import { applyPreset, loadSettings, saveSettings } from "./lib/settings.js";
import { t } from "./lib/i18n.js";
import {
  formatAge,
  formatBytes,
  getMemoryPressure,
  hostnameOf,
  pickForgottenAudio,
  pickParkCandidates,
  protectionReason,
} from "./lib/heuristics.js";

const ALARM = "bravesaver-sweep";
const DIRTY_PREFIX = "dirtyTab:";
let sweepQueue = Promise.resolve();
let menuQueue = Promise.resolve();
let openingUpdate = false;
let wakeQueue = Promise.resolve();
let formQueue = Promise.resolve();

chrome.runtime.onInstalled.addListener((details) => {
  ensureAlarm();
  setupMenus();
  showUpdatePage(details).catch((error) => console.warn("BraveSaver update page", error));
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  setupMenus();
});

ensureAlarm();

async function showUpdatePage({ reason, previousVersion }) {
  const { version } = chrome.runtime.getManifest();
  if (reason !== "update" || !previousVersion || previousVersion === version || openingUpdate) return;

  openingUpdate = true;
  try {
    const { lastUpdateShown } = await chrome.storage.local.get("lastUpdateShown");
    if (lastUpdateShown === version) return;
    await chrome.tabs.create({ url: chrome.runtime.getURL("updates.html") });
    await chrome.storage.local.set({ lastUpdateShown: version });
  } finally {
    openingUpdate = false;
  }
}

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
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

function menuOperation(operation) {
  return new Promise((resolve, reject) => {
    operation(() => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function setupMenus() {
  menuQueue = menuQueue.then(async () => {
    const { locale } = await loadSettings();
    await menuOperation((done) => chrome.contextMenus.removeAll(done));
    const entries = [
      { id: "park-tab", title: t(locale, "menuParkTab"), contexts: ["page", "action"] },
      { id: "park-others", title: t(locale, "menuParkOthers"), contexts: ["page", "action"] },
      { id: "never-park", title: t(locale, "menuNeverPark"), contexts: ["page"] },
    ];
    for (const entry of entries) {
      await menuOperation((done) => chrome.contextMenus.create(entry, done));
    }
  }).catch((error) => console.warn("BraveSaver menu setup", error));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
  const prev = changes.settings.oldValue?.locale;
  const next = changes.settings.newValue?.locale;
  if (prev !== next) setupMenus();
});

async function getDirtyIds() {
  await formQueue;
  const stored = await chrome.storage.session.get(null);
  return new Set(Object.keys(stored)
    .filter((key) => key.startsWith(DIRTY_PREFIX))
    .map((key) => Number(key.slice(DIRTY_PREFIX.length).split(":")[0])));
}

function markDirty(tabId, dirty, frameId = null, documentToken = "legacy", documentId, documentGone = false) {
  const write = formQueue.then(async () => {
    if (frameId === null) {
      const stored = await chrome.storage.session.get(null);
      const prefix = `${DIRTY_PREFIX}${tabId}`;
      await chrome.storage.session.remove(Object.keys(stored).filter((key) => key === prefix || key.startsWith(prefix + ":")));
      await chrome.storage.session.remove(`topDocument:${tabId}`);
      return;
    }
    if (frameId === 0 && !documentGone) {
      const topKey = `topDocument:${tabId}`;
      const stored = await chrome.storage.session.get(null);
      if (stored[topKey] !== documentToken) {
        // A new top-level content script proves document replacement. Starting
        // a navigation is insufficient: it may still be stopped or cancelled.
        const prefix = `${DIRTY_PREFIX}${tabId}:`;
        for (const [key, state] of Object.entries(stored)) {
          if (!key.startsWith(prefix)) continue;
          if (!state.documentId) {
            await chrome.storage.session.remove(key);
            continue;
          }
          const live = await chrome.tabs.sendMessage(tabId, { type: "GET_FORM_STATE" }, { documentId: state.documentId })
            .catch(() => null);
          if (!live?.dirty) await chrome.storage.session.remove(key);
        }
        await chrome.storage.session.set({ [topKey]: documentToken });
      }
    }
    const key = `${DIRTY_PREFIX}${tabId}:${frameId}:${documentToken}`;
    if (dirty) await chrome.storage.session.set({ [key]: { documentId } });
    else await chrome.storage.session.remove(key);
  });
  formQueue = write.catch(() => {});
  return write;
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "FORM_DIRTY":
      if (sender.tab?.id != null) await markDirty(sender.tab.id, true, sender.frameId ?? 0, message.documentToken, sender.documentId);
      return { ok: true };
    case "FORM_CLEAN":
    case "FORM_GONE":
      if (sender.tab?.id != null) await markDirty(sender.tab.id, false, sender.frameId ?? 0, message.documentToken, sender.documentId, message.type === "FORM_GONE");
      return { ok: true };
    case "SAVE_SETTINGS":
      return { ok: true, settings: await saveSettings(message.patch || {}) };
    case "GET_STATUS":
      return snapshot();
    case "SET_ENABLED":
      await saveSettings({ autoUnload: Boolean(message.enabled) });
      await refreshBadge();
      return snapshot();
    case "SET_PRESET":
      await applyPreset(message.preset);
      return snapshot();
    case "PARK_NOW": {
      const result = await sweep("manual", { ignoreIdle: true });
      return { ...await snapshot(), result };
    }
    case "WAKE_ALL":
      await wakeDiscardedTabs();
      return snapshot();
    case "PARK_TAB":
      let result;
      if (message.tabId != null) {
        result = await discardIfSafe(message.tabId);
      }
      await refreshBadge();
      return { ...await snapshot(), result };
    case "WAKE_TAB":
      if (message.tabId != null) {
        await wakeTabs([message.tabId]);
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
    await discardIfSafe(tab.id);
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

async function discardedTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.filter((tab) => tab.discarded);
}

async function wakeDiscardedTabs() {
  const parked = await discardedTabs();
  await wakeTabs(parked.map((tab) => tab.id));
  await refreshBadge();
}

function wakeTabs(ids) {
  const pending = wakeQueue.then(async () => {
    for (const id of ids) {
      const tab = await chrome.tabs.get(id).catch(() => null);
      if (tab?.discarded) await chrome.tabs.reload(id).catch(() => {});
    }
  });
  wakeQueue = pending.catch(() => {});
  return pending;
}

async function discardIfSafe(tabId) {
  const settings = await loadSettings();
  const dirtyIds = await getDirtyIds();
  const tab = await chrome.tabs.get(tabId);
  const reason = protectionReason(tab, settings, dirtyIds);
  if (tab.discarded || reason) return { unloaded: false, reason: reason || "alreadyUnloaded" };

  if (settings.protectForms) {
    // Treat a missing content script as unknown rather than assuming no draft.
    const state = await chrome.tabs.sendMessage(tabId, { type: "GET_FORM_STATE" }, { frameId: 0 })
      .catch(() => null);
    if (state?.dirty !== false) return { unloaded: false, reason: state?.dirty ? "protectDraft" : "protectUnknown" };
  }

  const latestDirtyIds = await getDirtyIds();
  const latest = await chrome.tabs.get(tabId);
  if (latest.discarded || latest.url !== tab.url || latest.status === "loading" ||
      protectionReason(latest, settings, latestDirtyIds)) return { unloaded: false, reason: "tabChanged" };
  const discarded = await chrome.tabs.discard(tabId);
  return { unloaded: discarded?.discarded === true, reason: "unloadFailed" };
}

function sweep(reason, options) {
  const pending = sweepQueue.then(() => runSweep(reason, options));
  sweepQueue = pending.catch(() => {});
  return pending;
}

async function runSweep(reason, { ignoreIdle = false, keepTabId = null } = {}) {
  const settings = await loadSettings();
  if (!settings.autoUnload && reason !== "manual" && reason !== "menu") {
    await refreshBadge();
    return { parked: 0, parkedIds: [] };
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
  let skipped = 0;
  const parkedIds = [];
  for (const item of candidates) {
    try {
      if (!(await discardIfSafe(item.tab.id)).unloaded) {
        skipped++;
        continue;
      }
      parked += 1;
      parkedIds.push(item.tab.id);
    } catch {
      // Some tabs (chrome://, DevTools) refuse discard.
      skipped++;
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
  return { parked, parkedIds, skipped };
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

  await refreshBadge(parkedTabs.length, settings.autoUnload);

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
    canWake: parkedTabs.length > 0,
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
        protectionReason: protectionReason(tab, settings, dirtyIds),
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
    isEnabled = settings.autoUnload;
  }

  const text = parked > 0 ? (parked > 99 ? "99+" : String(parked)) : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? "#C4844A" : "#6B6258",
  });
  if (chrome.action.setBadgeTextColor) {
    await chrome.action.setBadgeTextColor({ color: "#16130F" });
  }
}
