import { applyDom, normalizeLocale, t } from "./lib/i18n.js";

const enabledEl = document.getElementById("enabled");
const headlineEl = document.getElementById("headline");
const filamentEl = document.getElementById("filament");
const wireLive = document.getElementById("wire-live");
const loadLabel = document.getElementById("load-label");
const statTabs = document.getElementById("stat-tabs");
const statParked = document.getElementById("stat-parked");
const statRam = document.getElementById("stat-ram");
const tabList = document.getElementById("tab-list");
const tabFilter = document.getElementById("tab-filter");
const softParkStatus = document.getElementById("soft-park-status");
const unloadDialog = document.getElementById("unload-confirm");
let lastStatus;
let busy = false;
let refreshing = false;
let refreshPending = false;
let refreshTimer;
let statusVersion = 0;
const actionStatus = document.getElementById("action-status");

async function send(type, payload = {}) {
  const result = await chrome.runtime.sendMessage({ type, ...payload });
  if (!result?.ok) throw new Error(result?.error || "Request failed");
  return result;
}

async function refreshStatus() {
  if (refreshing || busy || unloadDialog.open) {
    refreshPending = true;
    return;
  }
  refreshing = true;
  const version = statusVersion;
  try {
    const status = await send("GET_STATUS");
    if (!busy && !unloadDialog.open && version === statusVersion) render(status);
    else refreshPending = true;
  } catch {
    actionStatus.textContent = t(localeOf(lastStatus), "actionFailed");
  } finally {
    refreshing = false;
    if (refreshPending && !busy && !unloadDialog.open) {
      refreshPending = false;
      scheduleRefresh();
    }
  }
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshStatus, 100);
}

async function runAction(action) {
  if (busy) return;
  busy = true;
  statusVersion++;
  actionStatus.textContent = "";
  setBusyControls();
  try {
    await action();
  } catch {
    actionStatus.textContent = t(localeOf(lastStatus), "actionFailed");
  } finally {
    busy = false;
    setBusyControls();
    scheduleRefresh();
  }
}

function setBusyControls() {
  for (const control of document.querySelectorAll(".shell button, .shell input, #tab-filter")) {
    control.disabled = busy || control.dataset.protected === "true";
  }
}

function localeOf(status) {
  return normalizeLocale(status?.settings?.locale);
}

function confirmUnload(locale, question) {
  document.getElementById("unload-question").textContent = t(locale, question);
  unloadDialog.returnValue = "";
  return new Promise((resolve) => {
    unloadDialog.addEventListener("close", () => resolve(unloadDialog.returnValue === "confirm"), { once: true });
    unloadDialog.showModal();
  });
}

function setFilament(ratio, known, locale) {
  const pct = known ? Math.round(ratio * 100) : 0;
  const offset = 420 - 420 * Math.min(1, Math.max(0, known ? ratio : 0.18));
  wireLive.style.strokeDashoffset = String(offset);
  filamentEl.dataset.hot = known && ratio >= 0.82 ? "true" : "false";
  filamentEl.setAttribute("aria-valuenow", String(pct));
  loadLabel.textContent = known ? t(locale, "loadKnown", { pct }) : t(locale, "loadUnknown");
}

function render(status) {
  const locale = localeOf(status);
  applyDom(locale);
  lastStatus = status;

  const { settings, counts, pressure } = status;
  enabledEl.checked = settings.autoUnload;
  const softParkEnabled = settings.pauseHiddenMutedVideo || settings.pauseHiddenAnimations;
  softParkStatus.textContent = t(locale, softParkEnabled ? "softParkOn" : "softParkOff");

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.preset === settings.preset));
  });

  if (!settings.autoUnload && counts.parked === 0) {
    headlineEl.textContent = t(locale, "autoParkOff");
  } else if (counts.parked === 0) {
    headlineEl.textContent =
      counts.ready > 0
        ? t(locale, "readyToPark", { n: counts.ready })
        : t(locale, "noBallast");
  } else {
    headlineEl.textContent = t(locale, "parkedCount", { n: counts.parked });
  }

  statTabs.textContent = String(counts.tabs);
  statParked.textContent = String(counts.parked);
  statRam.textContent = pressure.known ? pressure.availableLabel : "n/a";
  setFilament(pressure.ratio, pressure.known, locale);

  const parkNow = document.getElementById("park-now");
  const canWake = Boolean(status.canWake) || counts.parked > 0;
  parkNow.dataset.i18n = canWake ? "wakeParked" : "parkInactive";
  parkNow.textContent = t(locale, parkNow.dataset.i18n);
  parkNow.classList.toggle("wake", canWake);

  tabList.replaceChildren();
  const visible = status.tabs.filter((tab) => {
    if (tabFilter.value === "parked") return tab.discarded;
    if (tabFilter.value === "protected") return !tab.discarded && tab.protectionReason;
    return true;
  });
  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = t(locale, "noTabs");
    tabList.append(empty);
    return;
  }

  for (const tab of visible) {
    const row = document.createElement("li");

    if (tab.favIconUrl) {
      const img = document.createElement("img");
      img.alt = "";
      img.width = 16;
      img.height = 16;
      img.src = tab.favIconUrl;
      img.addEventListener("error", () => img.replaceWith(fallbackIcon()));
      row.append(img);
    } else {
      row.append(fallbackIcon());
    }

    const meta = document.createElement("button");
    meta.type = "button";
    meta.className = "meta";
    const host = document.createElement("span");
    host.className = "host";
    host.textContent = tab.host;
    host.title = tab.title;
    const age = document.createElement("span");
    age.className = "age";
    age.textContent = tab.discarded ? t(locale, "parkedState") : tab.age;
    meta.append(host, age);
    meta.addEventListener("click", async () => {
      await runAction(async () => {
        await send("FOCUS_TAB", { tabId: tab.id });
        window.close();
      });
    });
    row.append(meta);

    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = tab.discarded
      ? t(locale, "pillIdle")
      : tab.protectionReason ? t(locale, tab.protectionReason) : "";
    row.append(pill);

    const action = document.createElement("button");
    action.className = "action";
    if (tab.discarded) {
      action.classList.add("wake");
      action.textContent = t(locale, "wake");
      action.addEventListener("click", async () => {
        await runAction(async () => render(await send("WAKE_TAB", { tabId: tab.id })));
      });
    } else if (tab.protectionReason) {
      action.disabled = true;
      action.dataset.protected = "true";
      action.textContent = t(locale, "park");
    } else {
      action.textContent = t(locale, "park");
      action.addEventListener("click", async () => {
        await runAction(async () => {
          if (!await confirmUnload(locale, "confirmUnload")) return;
          const status = await send("PARK_TAB", { tabId: tab.id });
          render(status);
          if (status.result && !status.result.unloaded) {
            actionStatus.textContent = t(locale, "skipped") + " " + t(locale, status.result.reason);
          }
        });
      });
    }
    row.append(action);
    tabList.append(row);
  }
  setBusyControls();
}

function fallbackIcon() {
  const span = document.createElement("span");
  span.className = "favicon-fallback";
  span.setAttribute("aria-hidden", "true");
  return span;
}

enabledEl.addEventListener("change", async () => {
  const enabled = enabledEl.checked;
  enabledEl.checked = lastStatus?.settings.autoUnload ?? false;
  await runAction(async () => {
    if (enabled && !await confirmUnload(localeOf(lastStatus), "confirmAutoUnload")) return;
    render(await send("SET_ENABLED", { enabled }));
  });
});

tabFilter.addEventListener("change", () => {
  if (lastStatus) render(lastStatus);
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", async () => {
    await runAction(async () => render(await send("SET_PRESET", { preset: button.dataset.preset })));
  });
});

document.getElementById("park-now").addEventListener("click", async () => {
  if (!lastStatus) return;
  await runAction(async () => {
    const canWake = lastStatus.canWake;
    if (!canWake && !await confirmUnload(localeOf(lastStatus), "confirmUnload")) return;
    const status = await send(canWake ? "WAKE_ALL" : "PARK_NOW");
    render(status);
    if (status.result?.skipped) actionStatus.textContent = t(localeOf(status), "skippedCount", { n: status.result.skipped });
  });
});

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.tabs.onCreated.addListener(scheduleRefresh);
chrome.tabs.onRemoved.addListener(scheduleRefresh);
chrome.tabs.onUpdated.addListener(scheduleRefresh);
chrome.tabs.onActivated.addListener(scheduleRefresh);
chrome.storage.onChanged.addListener(scheduleRefresh);
await refreshStatus();
