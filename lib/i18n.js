export const LOCALES = ["de", "en"];

const de = {
  optionsTitle: "BraveSaver Einstellungen",
  lede: "Parkt tote Tabs, lässt aktive, angepinnte, hörbare und Formular-Tabs in Ruhe. Ziel: weniger RAM/CPU, ohne dass Brave selbst langsamer wird.",
  language: "Sprache",
  languageHint: "UI von Popup, Einstellungen und Rechtsklick-Menü.",
  localeDe: "Deutsch",
  localeEn: "English",
  protection: "Schutz",
  protectPinned: "Angeheftete Tabs nie parken",
  protectAudible: "Tabs mit Ton nie parken",
  protectForms: "Tabs mit Tipp-Eingabe nie parken",
  parkDuplicates: "Duplikate früher parken",
  muteForgotten: "Vergessenen Ton nach Wartezeit stummschalten",
  backgroundLoad: "Hintergrund-Last",
  pauseHiddenMutedVideo: "Stumme Videos in unsichtbaren Tabs pausieren",
  pauseHiddenAnimations: "CSS-Animationen in unsichtbaren Tabs einfrieren",
  timings: "Zeiten",
  idleMinutes: "Parken nach Inaktivität (Minuten)",
  idleMinutesPressure: "Bei RAM-Druck (Minuten)",
  maxPerSweep: "Max. Parks pro Sweep",
  muteAfterMinutes: "Ton stumm nach (Minuten)",
  whitelist: "Nie parken (Hosts, eine Zeile pro Domain)",
  save: "Speichern",
  saved: "Gespeichert.",
  autoPark: "Auto-Park",
  parkProfile: "Park-Profil",
  presetGentle: "Sanft",
  presetBalanced: "Ausgewogen",
  presetAggressive: "Hart",
  tabs: "Tabs",
  parked: "Geparkt",
  ramFree: "RAM frei",
  parkInactive: "Inaktive parken",
  settings: "Einstellungen",
  footHint: "Parken = RAM frei, Tab bleibt in der Leiste.",
  loadUnknown: "Last unbekannt — Tab-Heuristik aktiv",
  loadKnown: "Last {pct}%",
  statusUnreadable: "Status nicht lesbar",
  autoParkOff: "Auto-Park aus",
  readyToPark: "{n} Tabs bereit zum Parken",
  noBallast: "Kein Ballast",
  parkedCount: "{n} Tabs geparkt",
  noTabs: "Keine Tabs.",
  parkedState: "geparkt",
  wake: "Wecken",
  active: "aktiv",
  pin: "pin",
  park: "Park",
  pillIdle: "idle",
  pillPin: "pin",
  pillAudio: "ton",
  internalHost: "intern",
  menuParkTab: "Tab parken",
  menuParkOthers: "Andere Tabs parken",
  menuNeverPark: "Diese Seite nie parken",
};

const en = {
  optionsTitle: "BraveSaver settings",
  lede: "Parks idle tabs, leaves active, pinned, audible, and form tabs alone. Goal: less RAM/CPU without slowing Brave itself.",
  language: "Language",
  languageHint: "UI for popup, settings, and the right-click menu.",
  localeDe: "Deutsch",
  localeEn: "English",
  protection: "Protection",
  protectPinned: "Never park pinned tabs",
  protectAudible: "Never park tabs with sound",
  protectForms: "Never park tabs with typed input",
  parkDuplicates: "Park duplicate tabs sooner",
  muteForgotten: "Mute forgotten audio after the wait time",
  backgroundLoad: "Background load",
  pauseHiddenMutedVideo: "Pause muted videos in hidden tabs",
  pauseHiddenAnimations: "Freeze CSS animations in hidden tabs",
  timings: "Timing",
  idleMinutes: "Park after idle (minutes)",
  idleMinutesPressure: "Under memory pressure (minutes)",
  maxPerSweep: "Max parks per sweep",
  muteAfterMinutes: "Mute audio after (minutes)",
  whitelist: "Never park (hosts, one domain per line)",
  save: "Save",
  saved: "Saved.",
  autoPark: "Auto-park",
  parkProfile: "Park profile",
  presetGentle: "Gentle",
  presetBalanced: "Balanced",
  presetAggressive: "Hard",
  tabs: "Tabs",
  parked: "Parked",
  ramFree: "RAM free",
  parkInactive: "Park inactive",
  settings: "Settings",
  footHint: "Park = free RAM, tab stays in the strip.",
  loadUnknown: "Load unknown — tab heuristic active",
  loadKnown: "Load {pct}%",
  statusUnreadable: "Status unreadable",
  autoParkOff: "Auto-park off",
  readyToPark: "{n} tabs ready to park",
  noBallast: "No ballast",
  parkedCount: "{n} tabs parked",
  noTabs: "No tabs.",
  parkedState: "parked",
  wake: "Wake",
  active: "active",
  pin: "pin",
  park: "Park",
  pillIdle: "idle",
  pillPin: "pin",
  pillAudio: "audio",
  internalHost: "internal",
  menuParkTab: "Park tab",
  menuParkOthers: "Park other tabs",
  menuNeverPark: "Never park this site",
};

const PACKS = { de, en };

export function normalizeLocale(value) {
  return value === "en" ? "en" : "de";
}

export function t(locale, key, vars = {}) {
  const pack = PACKS[normalizeLocale(locale)] || de;
  let text = pack[key] ?? de[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function applyDom(locale, root = document) {
  const lang = normalizeLocale(locale);
  if (root.documentElement) {
    root.documentElement.lang = lang;
  }
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(lang, node.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((node) => {
    const [attr, key] = node.dataset.i18nAttr.split(":");
    if (attr && key) node.setAttribute(attr, t(lang, key));
  });
}
