import { loadSettings, normalizeWhitelist } from "./lib/settings.js";
import { applyDom, normalizeLocale, t } from "./lib/i18n.js";

const form = document.getElementById("form");
const whitelistEl = document.getElementById("whitelist");
const savedEl = document.getElementById("saved");
const localeEl = document.getElementById("locale");
let initialSettings;

const checks = [
  "protectPinned",
  "protectAudible",
  "protectForms",
  "parkDuplicates",
  "muteForgotten",
  "pauseHiddenMutedVideo",
  "pauseHiddenAnimations",
];

const numbers = [
  "idleMinutes",
  "idleMinutesPressure",
  "maxPerSweep",
  "muteAfterMinutes",
];

function paintLocale(locale) {
  const lang = normalizeLocale(locale);
  applyDom(lang);
  document.title = t(lang, "optionsTitle");
  localeEl.value = lang;
}

function fill(settings) {
  paintLocale(settings.locale);
  for (const name of checks) {
    form.elements[name].checked = Boolean(settings[name]);
  }
  for (const name of numbers) {
    form.elements[name].value = settings[name];
  }
  whitelistEl.value = (settings.whitelist || []).join("\n");
}

function parseWhitelist(text) {
  return normalizeWhitelist(text.split(/\n+/).filter((line) => line.trim()));
}

async function saveSettings(patch) {
  const result = await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", patch });
  if (!result?.ok) throw new Error(result?.error || "Settings could not be saved");
  return result.settings;
}

localeEl.addEventListener("change", async () => {
  const locale = normalizeLocale(localeEl.value);
  await saveSettings({ locale });
  initialSettings.locale = locale;
  paintLocale(locale);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const patch = {};
  for (const name of checks) {
    const value = form.elements[name].checked;
    if (value !== initialSettings[name]) patch[name] = value;
  }
  for (const name of numbers) {
    const value = Number(form.elements[name].value);
    if (value !== initialSettings[name]) patch[name] = value;
  }
  const whitelist = parseWhitelist(whitelistEl.value);
  if (JSON.stringify(whitelist) !== JSON.stringify(initialSettings.whitelist)) patch.whitelist = whitelist;
  if (Object.keys(patch).length) patch.preset = "custom";
  initialSettings = await saveSettings(patch);
  fill(initialSettings);
  savedEl.hidden = false;
  window.setTimeout(() => {
    savedEl.hidden = true;
  }, 1600);
});

initialSettings = await loadSettings();
fill(initialSettings);
