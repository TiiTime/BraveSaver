export const PRESETS = {
  gentle: {
    idleMinutes: 30,
    idleMinutesPressure: 12,
    maxPerSweep: 3,
    parkDuplicates: false,
    muteForgotten: false,
  },
  balanced: {
    idleMinutes: 15,
    idleMinutesPressure: 6,
    maxPerSweep: 5,
    parkDuplicates: true,
    muteForgotten: false,
  },
  aggressive: {
    idleMinutes: 5,
    idleMinutesPressure: 2,
    maxPerSweep: 10,
    parkDuplicates: true,
    muteForgotten: true,
  },
};

export const DEFAULTS = {
  autoUnload: false,
  locale: "de",
  preset: "balanced",
  protectPinned: true,
  protectAudible: true,
  protectForms: true,
  pauseHiddenMutedVideo: true,
  pauseHiddenAnimations: true,
  parkDuplicates: true,
  muteForgotten: false,
  muteAfterMinutes: 20,
  idleMinutes: 15,
  idleMinutesPressure: 6,
  maxPerSweep: 5,
  pressureHigh: 0.82,
  whitelist: [
    "docs.google.com",
    "sheets.google.com",
    "slides.google.com",
    "meet.google.com",
    "calendar.google.com",
    "figma.com",
    "www.figma.com",
    "notion.so",
    "www.notion.so",
    "web.whatsapp.com",
    "vscode.dev",
    "github.dev",
  ],
};

const NUMBER_RANGES = {
  idleMinutes: [1, 240],
  idleMinutesPressure: [1, 60],
  maxPerSweep: [1, 50],
  muteAfterMinutes: [5, 240],
  pressureHigh: [0.1, 1],
};
let settingsQueue = Promise.resolve();

export function normalizeWhitelist(entries) {
  const hosts = entries.map((entry) => {
    try {
      const host = new URL(String(entry).includes("://") ? entry : `https://${String(entry).replace(/^\*\./, "")}`).hostname;
      return host.toLowerCase().replace(/^www\./, "");
    } catch {
      return "";
    }
  });
  return [...new Set(hosts.filter(Boolean))];
}

function normalizeSettings(stored) {
  const settings = { ...DEFAULTS };
  for (const [key, fallback] of Object.entries(DEFAULTS)) {
    if (typeof fallback === "boolean") {
      settings[key] = typeof stored[key] === "boolean" ? stored[key] : fallback;
    }
  }
  for (const [key, [min, max]] of Object.entries(NUMBER_RANGES)) {
    const value = stored[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) {
      settings[key] = key === "pressureHigh" ? value : Math.floor(value);
    }
  }
  settings.locale = stored.locale === "en" ? "en" : "de";
  if (Object.hasOwn(PRESETS, stored.preset) || stored.preset === "custom") settings.preset = stored.preset;
  if (Array.isArray(stored.whitelist)) settings.whitelist = normalizeWhitelist(stored.whitelist);
  return settings;
}

export async function loadSettings() {
  const stored = await chrome.storage.local.get("settings");
  return normalizeSettings(stored.settings || {});
}

export function saveSettings(patch) {
  const write = settingsQueue.then(async () => {
    const current = await loadSettings();
    const next = normalizeSettings({ ...current, ...patch });
    await chrome.storage.local.set({ settings: next });
    return next;
  });
  settingsQueue = write.catch(() => {});
  return write;
}

export async function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return loadSettings();
  return saveSettings({ ...preset, preset: name });
}
