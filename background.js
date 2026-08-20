import { applyPreset, loadSettings, saveSettings } from "./lib/settings.js";
import { t } from "./lib/i18n.js";
import {
  formatAge,
  formatBytes,
  getMemoryPressure,
  hostnameOf,
  pickForgottenAudio,
  pickParkCandidates,
} from "./lib/heuristics.js";

const ALARM = "bravesaver-sweep";
const DIRTY_KEY = "dirtyTabIds";

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  setupMenus();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  setupMenus();
});

ensureAlarm();
setupMenus();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) {
    sweep("alarm").catch((error) => console.warn("BraveSaver sweep", error));
  }
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state === "idle" || state === "locked") {
    sweep(state).catch((error) => console.warn("BraveSaver idle sweep", error));
  }
});

chrome.tabs.onActivated.addListener(() => {
  refreshBadge().catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  markDirty(tabId, false).catch(() => {});
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.discarded !== undefined || changeInfo.status === "complete") {
    refreshBadge().catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleMenu(info, tab).catch((error) => console.warn("BraveSaver menu", error));
});

function ensureAlarm() {
  chrome.alarms.get(ALARM, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM, { periodInMinutes: 1 });
    }
  });
}

async function setupMenus() {
  const settings = await loadSettings();
  const locale = settings.locale;
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: "park-tab",
    title: t(locale, "menuParkTab"),
    contexts: ["page", "action"],
  });
  chrome.contextMenus.create({
    id: "park-others",
    title: t(locale, "menuParkOthers"),
    contexts: ["page", "action"],
  });
  chrome.contextMenus.create({
    id: "never-park",
    title: t(locale, "menuNeverPark"),
    contexts: ["page"],
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
  const prev = changes.settings.oldValue?.locale;
  const next = changes.settings.newValue?.locale;
  if (prev !== next) setupMenus().catch(() => {});
});

async function getDirtyIds() {
  const stored = await chrome.storage.session.get(DIRTY_KEY);
  return new Set(stored[DIRTY_KEY] || []);
}

async function markDirty(tabId, dirty) {
  const ids = await getDirtyIds();
  if (dirty) ids.add(tabId);
  else ids.delete(tabId);
  await chrome.storage.session.set({ [DIRTY_KEY]: [...ids] });
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "FORM_DIRTY":
      if (sender.tab?.id != null) await markDirty(sender.tab.id, true);
      return { ok: true };
    case "FORM_CLEAN":
      if (sender.tab?.id != null) await markDirty(sender.tab.id, false);
      return { ok: true };
    case "GET_STATUS":
      return snapshot();
    case "SET_ENABLED":
      await saveSettings({ enabled: Boolean(message.enabled) });
      await refreshBadge();
      return snapshot();
    case "SET_PRESET":
      await applyPreset(message.preset);
      return snapshot();
    case "PARK_NOW":
      await sweep("manual", { ignoreIdle: true });
      return snapshot();
    case "PARK_TAB":
      if (message.tabId != null) {
        await chrome.tabs.discard(message.tabId);
      }
      await refreshBadge();
      return snapshot();
    case "WAKE_TAB":
      if (message.tabId != null) {
        await chrome.tabs.reload(message.tabId);
      }
      return snapshot();
    case "FOCUS_TAB":
      if (message.tabId != null) {
        const tab = await chrome.tabs.get(message.tabId);
        await chrome.tabs.update(message.tabId, { active: true });
        if (tab.windowId != null) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
      }
      return snapshot();
    default:
      return { ok: false, error: "unknown" };
  }
}

async function handleMenu(info, tab) {
  if (info.menuItemId === "park-tab" && tab?.id != null) {
    await chrome.tabs.discard(tab.id);
    await refreshBadge();
    return;
  }
  if (info.menuItemId === "park-others") {
    await sweep("menu", { ignoreIdle: true, keepTabId: tab?.id });
    return;
  }
  if (info.menuItemId === "never-park" && tab?.url) {
    const host = hostnameOf(tab.url);
    if (!host) return;
    const settings = await loadSettings();
    if (!settings.whitelist.includes(host)) {
      await saveSettings({ whitelist: [...settings.whitelist, host] });
    }
  }
}

async function sweep(reason, { ignoreIdle = false, keepTabId = null } = {}) {
  const settings = await loadSettings();
  if (!settings.enabled && reason !== "manual" && reason !== "menu") {
    await refreshBadge();
    return { parked: 0 };
  }

  const tabs = await chrome.tabs.query({});
  const dirtyIds = await getDirtyIds();
  const pressure = await getMemoryPressure();
  const now = Date.now();

  for (const tab of pickForgottenAudio(tabs, settings, now)) {
    try {
      await chrome.tabs.update(tab.id, { muted: true });
    } catch {
      // Tab gone.
    }
  }

  let candidates = pickParkCandidates(tabs, {
    settings: ignoreIdle
      ? {
          ...settings,
          idleMinutes: 0,
          idleMinutesPressure: 0,
          maxPerSweep: 50,
        }
      : settings,
    dirtyIds,
    pressure,
    now,
  });

  if (keepTabId != null) {
    candidates = candidates.filter((item) => item.tab.id !== keepTabId);
  }

  let parked = 0;
  for (const item of candidates) {
    try {
      await chrome.tabs.discard(item.tab.id);
      parked += 1;
    } catch {
      // Some tabs (chrome://, DevTools) refuse discard.
    }
  }

  const stats = await chrome.storage.local.get("stats");
  const prev = stats.stats || { parkedTotal: 0 };
  await chrome.storage.local.set({
    stats: {
      parkedTotal: prev.parkedTotal + parked,
      lastSweepAt: now,
      lastSweepReason: reason,
      lastParked: parked,
    },
  });

  await refreshBadge();
  return { parked };
}

async function snapshot() {
  const settings = await loadSettings();
  const tabs = await chrome.tabs.query({});
  const dirtyIds = await getDirtyIds();
  const pressure = await getMemoryPressure();
  const now = Date.now();
  const parkedTabs = tabs.filter((tab) => tab.discarded);
  const candidates = pickParkCandidates(tabs, { settings, dirtyIds, pressure, now });
  const stats = (await chrome.storage.local.get("stats")).stats || {};

  await refreshBadge(parkedTabs.length, settings.enabled);

  return {
    ok: true,
    settings,
    pressure: {
      ...pressure,
      availableLabel: formatBytes(pressure.available),
      capacityLabel: formatBytes(pressure.capacity),
    },
    counts: {
      tabs: tabs.length,
      parked: parkedTabs.length,
      dirty: dirtyIds.size,
      ready: candidates.length,
    },
    stats,
    tabs: tabs
      .map((tab) => ({
        id: tab.id,
        title: tab.title || hostnameOf(tab.url) || "Tab",
        host: hostnameOf(tab.url) || t(settings.locale, "internalHost"),
        favIconUrl: tab.favIconUrl || "",
        discarded: Boolean(tab.discarded),
        pinned: Boolean(tab.pinned),
        audible: Boolean(tab.audible),
        active: Boolean(tab.active),
        protected: Boolean(
          tab.active ||
            tab.pinned ||
            tab.audible ||
            dirtyIds.has(tab.id)
        ),
        age: formatAge(now - (tab.lastAccessed || now)),
        ageMs: now - (tab.lastAccessed || now),
      }))
      .sort((a, b) => {
        if (a.discarded !== b.discarded) return a.discarded ? 1 : -1;
        if (a.active !== b.active) return a.active ? -1 : 1;
        return b.ageMs - a.ageMs;
      }),
  };
}

async function refreshBadge(parkedCount, enabled) {
  let parked = parkedCount;
  let isEnabled = enabled;
  if (parked == null || isEnabled == null) {
    const settings = await loadSettings();
    const tabs = await chrome.tabs.query({ discarded: true });
    parked = tabs.length;
    isEnabled = settings.enabled;
  }

  const text = !isEnabled ? "off" : parked > 0 ? (parked > 99 ? "99+" : String(parked)) : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? "#C4844A" : "#6B6258",
  });
  if (chrome.action.setBadgeTextColor) {
    await chrome.action.setBadgeTextColor({ color: "#16130F" });
  }
}
