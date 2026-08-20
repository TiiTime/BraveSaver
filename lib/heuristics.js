const INTERNAL =
  /^(chrome|brave|edge|about|devtools|chrome-extension|brave-extension|file):/i;

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url || "";
  }
}

export function isInternalUrl(url) {
  return !url || INTERNAL.test(url);
}

export async function getMemoryPressure() {
  if (!chrome.system?.memory?.getInfo) {
    return { ratio: 0, known: false, capacity: 0, available: 0 };
  }
  try {
    const info = await chrome.system.memory.getInfo();
    const ratio =
      info.capacity > 0 ? 1 - info.availableCapacity / info.capacity : 0;
    return {
      ratio,
      known: true,
      capacity: info.capacity,
      available: info.availableCapacity,
    };
  } catch {
    return { ratio: 0, known: false, capacity: 0, available: 0 };
  }
}

export function idleThresholdMs(settings, pressure) {
  let minutes = settings.idleMinutes;
  if (pressure.known && pressure.ratio >= settings.pressureHigh) {
    minutes = Math.min(minutes, settings.idleMinutesPressure);
  }
  if (pressure.known && pressure.ratio >= 0.9) {
    minutes = Math.min(minutes, 2);
  }
  return Math.max(0, minutes) * 60 * 1000;
}

function isWhitelisted(url, whitelist) {
  const host = hostnameOf(url);
  if (!host) return false;
  return whitelist.some((entry) => {
    const needle = String(entry).trim().toLowerCase().replace(/^www\./, "");
    if (!needle) return false;
    return host === needle || host.endsWith(`.${needle}`);
  });
}

function duplicateGroups(tabs) {
  const groups = new Map();
  for (const tab of tabs) {
    const key = normalizeUrl(tab.url || "");
    if (!key || isInternalUrl(tab.url)) continue;
    const list = groups.get(key) || [];
    list.push(tab);
    groups.set(key, list);
  }
  return groups;
}

export function isProtected(tab, settings, dirtyIds) {
  if (!tab || tab.active) return true;
  if (tab.discarded) return true;
  if (tab.pinned && settings.protectPinned) return true;
  if (tab.audible && settings.protectAudible) return true;
  if (isInternalUrl(tab.url)) return true;
  if (isWhitelisted(tab.url, settings.whitelist || [])) return true;
  if (settings.protectForms && dirtyIds.has(tab.id)) return true;
  return false;
}

export function pickParkCandidates(tabs, { settings, dirtyIds, pressure, now }) {
  const threshold = idleThresholdMs(settings, pressure);
  const groups = duplicateGroups(tabs);
  const eligible = [];

  for (const tab of tabs) {
    if (isProtected(tab, settings, dirtyIds)) continue;

    const age = now - (tab.lastAccessed || now);
    const key = normalizeUrl(tab.url || "");
    const group = groups.get(key) || [];
    const isDuplicate = settings.parkDuplicates && group.length > 1;
    const oldestDup =
      isDuplicate &&
      group.every((other) => (tab.lastAccessed || 0) <= (other.lastAccessed || 0));

    if (oldestDup && age >= 60 * 1000) {
      eligible.push({ tab, reason: "duplicate", age });
      continue;
    }

    if (age >= threshold) {
      eligible.push({ tab, reason: "idle", age });
    }
  }

  eligible.sort((a, b) => b.age - a.age);

  const cap =
    pressure.known && pressure.ratio >= 0.85
      ? Math.max(settings.maxPerSweep, 12)
      : settings.maxPerSweep;

  return eligible.slice(0, cap);
}

export function pickForgottenAudio(tabs, settings, now) {
  if (!settings.muteForgotten) return [];
  const wait = Math.max(5, settings.muteAfterMinutes) * 60 * 1000;
  return tabs.filter((tab) => {
    if (!tab.audible || tab.mutedInfo?.muted || tab.active || tab.pinned) {
      return false;
    }
    if (isInternalUrl(tab.url)) return false;
    const age = now - (tab.lastAccessed || now);
    return age >= wait;
  });
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "—";
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb)} MB`;
}

export function formatAge(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}
