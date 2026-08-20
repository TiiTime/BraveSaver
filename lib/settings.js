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
  enabled: true,
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

export async function loadSettings() {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULTS, ...(stored.settings || {}) };
}

export async function saveSettings(patch) {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}

export async function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return loadSettings();
  return saveSettings({ ...preset, preset: name });
}
