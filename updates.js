import { loadSettings } from "./lib/settings.js";

const toggle = document.getElementById("language");
const translations = [...document.querySelectorAll("[data-en]")].map((element) => ({
  element,
  de: element.textContent,
  en: element.dataset.en,
}));
let locale = navigator.language.toLowerCase().startsWith("de") ? "de" : "en";

if (globalThis.chrome?.runtime?.getManifest) {
  document.getElementById("version").textContent = chrome.runtime.getManifest().version;
  locale = (await loadSettings()).locale === "en" ? "en" : "de";
}

function render() {
  document.documentElement.lang = locale;
  document.title = locale === "de" ? "BraveSaver · Neuigkeiten" : "BraveSaver · What's new";
  toggle.textContent = locale === "de" ? "English" : "Deutsch";
  toggle.lang = locale === "de" ? "en" : "de";
  for (const { element, ...text } of translations) {
    element.textContent = text[locale];
  }
}

toggle.addEventListener("click", () => {
  locale = locale === "de" ? "en" : "de";
  render();
});
render();
