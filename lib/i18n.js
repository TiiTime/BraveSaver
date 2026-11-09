export const LOCALES = ["de", "en"];

const de = {
  filterTabs: "Tabs filtern",
  filterAll: "Alle",
  filterProtected: "Geschützt",
  protectActive: "Aktiv",
  protectInternal: "Intern",
  protectDraft: "Eingabe",
  protectPin: "Angeheftet",
  protectSound: "Ton",
  protectSite: "Ausnahme",
  softParkOn: "Sanftes Parken an",
  softParkOff: "Sanftes Parken aus",
  confirmUnload: "Tabs entladen? Beim Öffnen werden sie neu geladen.",
  confirmAutoUnload: "Automatisches Entladen einschalten? Entladene Tabs werden beim Öffnen neu geladen.",
  cancel: "Abbrechen",
  confirm: "Bestätigen",
  optionsTitle: "BraveSaver Einstellungen",
  lede: "Sanftes Parken drosselt Hintergrundlast bei geladener Seite. Entladen ist optional und lädt den Tab beim Öffnen neu.",
  language: "Sprache",
  languageHint: "UI von Popup, Einstellungen und Rechtsklick-Menü.",
  localeDe: "Deutsch",
  localeEn: "English",
  protection: "Schutz",
  protectPinned: "Angeheftete Tabs nie entladen",
  protectAudible: "Tabs mit Ton nie entladen",
  protectForms: "Tabs mit erkannter Eingabe nie entladen",
  parkDuplicates: "Duplikate früher entladen",
  muteForgotten: "Vergessenen Ton nach Wartezeit stummschalten",
  backgroundLoad: "Sanftes Parken",
  pauseHiddenMutedVideo: "Stumme Videos in unsichtbaren Tabs pausieren",
  pauseHiddenAnimations: "CSS-Animationen in unsichtbaren Tabs einfrieren",
  timings: "Zeiten",
  idleMinutes: "Entladen nach Inaktivität (Minuten)",
  idleMinutesPressure: "Bei RAM-Druck (Minuten)",
  maxPerSweep: "Max. Entladungen pro Prüfung",
  muteAfterMinutes: "Ton stumm nach (Minuten)",
  whitelist: "Nie entladen (Hosts, eine Zeile pro Domain)",
  save: "Speichern",
  saved: "Gespeichert.",
  autoPark: "Auto-Parken (Entladen)",
  parkProfile: "Park-Profil",
  presetGentle: "Sanft",
  presetBalanced: "Ausgewogen",
  presetAggressive: "Hart",
  tabs: "Tabs",
  parked: "Entladen",
  ramFree: "Freier System-RAM",
  parkInactive: "Inaktive entladen",
  wakeParked: "Entladene laden",
  settings: "Einstellungen",
  footHint: "Sanftes Parken lässt die Seite geladen.",
  loadUnknown: "Last unbekannt — Tab-Heuristik aktiv",
  loadKnown: "System-RAM {pct} % belegt",
  statusUnreadable: "Status nicht lesbar",
  autoParkOff: "Automatisches Entladen aus",
  readyToPark: "{n} Tabs zum Entladen bereit",
  noBallast: "Kein Ballast",
  parkedCount: "{n} Tabs entladen",
  noTabs: "Keine Tabs.",
  parkedState: "entladen",
  wake: "Laden",
  active: "aktiv",
  pin: "pin",
  park: "Entladen",
  pillIdle: "entladen",
  pillPin: "pin",
  pillAudio: "ton",
  internalHost: "intern",
  menuParkTab: "Tab entladen (lädt später neu)",
  menuParkOthers: "Andere Tabs entladen (laden später neu)",
  menuNeverPark: "Diese Website nie entladen",
};

const en = {
  filterTabs: "Filter tabs",
  filterAll: "All",
  filterProtected: "Protected",
  protectActive: "Active",
  protectInternal: "Internal",
  protectDraft: "Draft",
  protectPin: "Pinned",
  protectSound: "Audio",
  protectSite: "Exception",
  softParkOn: "Gentle parking on",
  softParkOff: "Gentle parking off",
  confirmUnload: "Unload tabs? They will reload when opened.",
  confirmAutoUnload: "Enable automatic unloading? Unloaded tabs will reload when opened.",
  cancel: "Cancel",
  confirm: "Confirm",
  optionsTitle: "BraveSaver settings",
  lede: "Gentle parking reduces background activity while keeping the page loaded. Unloading is optional and reloads the tab when reopened.",
  language: "Language",
  languageHint: "UI for popup, settings, and the right-click menu.",
  localeDe: "Deutsch",
  localeEn: "English",
  protection: "Protection",
  protectPinned: "Never unload pinned tabs",
  protectAudible: "Never unload tabs with sound",
  protectForms: "Never unload tabs with detected input",
  parkDuplicates: "Unload duplicate tabs sooner",
  muteForgotten: "Mute forgotten audio after the wait time",
  backgroundLoad: "Gentle parking",
  pauseHiddenMutedVideo: "Pause muted videos in hidden tabs",
  pauseHiddenAnimations: "Freeze CSS animations in hidden tabs",
  timings: "Timing",
  idleMinutes: "Unload after idle (minutes)",
  idleMinutesPressure: "Under memory pressure (minutes)",
  maxPerSweep: "Maximum unloads per check",
  muteAfterMinutes: "Mute audio after (minutes)",
  whitelist: "Never unload (hosts, one domain per line)",
  save: "Save",
  saved: "Saved.",
  autoPark: "Auto-park (unload)",
  parkProfile: "Park profile",
  presetGentle: "Gentle",
  presetBalanced: "Balanced",
  presetAggressive: "Hard",
  tabs: "Tabs",
  parked: "Unloaded",
  ramFree: "Free system RAM",
  parkInactive: "Unload inactive",
  wakeParked: "Reload unloaded",
  settings: "Settings",
  footHint: "Gentle parking keeps the page loaded.",
  loadUnknown: "Load unknown — tab heuristic active",
  loadKnown: "System RAM {pct}% used",
  statusUnreadable: "Status unreadable",
  autoParkOff: "Automatic unloading off",
  readyToPark: "{n} tabs ready to unload",
  noBallast: "No ballast",
  parkedCount: "{n} tabs unloaded",
  noTabs: "No tabs.",
  parkedState: "unloaded",
  wake: "Reload",
  active: "active",
  pin: "pin",
  park: "Unload",
  pillIdle: "unloaded",
  pillPin: "pin",
  pillAudio: "audio",
  internalHost: "internal",
  menuParkTab: "Unload tab (reloads later)",
  menuParkOthers: "Unload other tabs (reload later)",
  menuNeverPark: "Never unload this website",
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
