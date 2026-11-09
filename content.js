let pauseMutedVideo = true;
let pauseAnimations = true;
let dirty = false;

chrome.storage.local.get("settings").then((stored) => {
  applySettings(stored.settings || {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
  applySettings(changes.settings.newValue || {});
});

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === "GET_FORM_STATE") respond({ dirty });
});
chrome.runtime.sendMessage({ type: "FORM_CLEAN" }).catch(() => {});

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

  for (const media of document.querySelectorAll("video, audio")) {
    if (hidden && pauseMutedVideo && !media.paused && (media.muted || media.volume === 0)) {
      media.pause();
      media.dataset.bsPaused = "1";
    } else if ((!hidden || !pauseMutedVideo) && media.dataset.bsPaused === "1") {
      delete media.dataset.bsPaused;
      media.play().catch(() => {});
    }
  }
}
