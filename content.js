let pauseMutedVideo = true;
let pauseAnimations = true;
let dirty = false;

chrome.storage.local.get("settings").then((stored) => {
  applySettings(stored.settings || {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
  const next = changes.settings.newValue || {};
  pauseMutedVideo = next.pauseHiddenMutedVideo !== false;
  pauseAnimations = next.pauseHiddenAnimations !== false;
  syncHiddenState();
});

document.addEventListener("visibilitychange", syncHiddenState, { passive: true });
document.addEventListener("play", onPlay, true);
document.addEventListener(
  "input",
  (event) => {
    if (dirty) return;
    if (!isFormish(event.target)) return;
    dirty = true;
    chrome.runtime.sendMessage({ type: "FORM_DIRTY" }).catch(() => {});
  },
  { capture: true, passive: true }
);
document.addEventListener(
  "submit",
  () => {
    if (!dirty) return;
    dirty = false;
    chrome.runtime.sendMessage({ type: "FORM_CLEAN" }).catch(() => {});
  },
  { capture: true, passive: true }
);

syncHiddenState();

function applySettings(next) {
  pauseMutedVideo = next.pauseHiddenMutedVideo !== false;
  pauseAnimations = next.pauseHiddenAnimations !== false;
  syncHiddenState();
}

function isFormish(node) {
  if (!node || node.nodeType !== 1) return false;
  const tag = node.tagName;
  if (tag === "INPUT") {
    const type = String(node.type || "text").toLowerCase();
    if (["button", "submit", "reset", "checkbox", "radio", "file", "hidden"].includes(type)) {
      return false;
    }
  }
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable
  );
}

function onPlay(event) {
  const media = event.target;
  if (!(media instanceof HTMLMediaElement)) return;
  if (!document.hidden || !pauseMutedVideo) return;
  if (media.muted || media.volume === 0) {
    media.pause();
    media.dataset.bsPaused = "1";
  }
}

function syncHiddenState() {
  const hidden = document.hidden;
  document.documentElement.classList.toggle(
    "bs-freeze-anim",
    hidden && pauseAnimations
  );

  if (!pauseMutedVideo) return;

  for (const media of document.querySelectorAll("video, audio")) {
    if (hidden && !media.paused && (media.muted || media.volume === 0)) {
      media.pause();
      media.dataset.bsPaused = "1";
    } else if (!hidden && media.dataset.bsPaused === "1") {
      delete media.dataset.bsPaused;
      media.play().catch(() => {});
    }
  }
}
