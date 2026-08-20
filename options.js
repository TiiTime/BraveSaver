import { loadSettings, saveSettings } from "./lib/settings.js";
import { applyDom, normalizeLocale, t } from "./lib/i18n.js";

const form = document.getElementById("form");
const whitelistEl = document.getElementById("whitelist");
const savedEl = document.getElementById("saved");
const localeEl = document.getElementById("locale");

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
  const seen = new Set();
  const hosts = [];
  for (const line of text.split(/\n+/)) {
    const host = line.trim().toLowerCase().replace(/^www\./, "");
    if (!host || seen.has(host)) continue;
    seen.add(host);
    hosts.push(host);
  }
  return hosts;
}

localeEl.addEventListener("change", async () => {
  const locale = normalizeLocale(localeEl.value);
  await saveSettings({ locale });
  paintLocale(locale);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const patch = {
    preset: "custom",
    locale: normalizeLocale(localeEl.value),
  };
  for (const name of checks) {
    patch[name] = form.elements[name].checked;
  }
  for (const name of numbers) {
    patch[name] = Number(form.elements[name].value);
  }
  patch.whitelist = parseWhitelist(whitelistEl.value);
  await saveSettings(patch);
  paintLocale(patch.locale);
  savedEl.hidden = false;
  window.setTimeout(() => {
    savedEl.hidden = true;
  }, 1600);
});

fill(await loadSettings());
