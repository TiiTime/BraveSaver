let pauseMutedVideo = true;
let pauseAnimations = true;
let dirty = false;
const pausedMedia = new Set();
const documentToken = Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join("-");

chrome.storage.local.get("settings").then((stored) => {
  applySettings(stored.settings || {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
  applySettings(changes.settings.newValue || {});
});

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === "GET_FORM_STATE") respond({ dirty, documentToken });
});
function reportFormState() {
  chrome.runtime.sendMessage({ type: dirty ? "FORM_DIRTY" : "FORM_CLEAN", documentToken }).catch(() => {});
}
reportFormState();
window.addEventListener("pageshow", reportFormState);
window.addEventListener("pagehide", () => {
  chrome.runtime.sendMessage({ type: "FORM_GONE", documentToken }).catch(() => {});
});

document.addEventListener("visibilitychange", syncHiddenState, { passive: true });
document.addEventListener("play", onPlay, true);
document.addEventListener(
  "input",
  (event) => {
    if (dirty) return;
    if (!isFormish(event.target)) return;
    dirty = true;
    reportFormState();
  },
  { capture: true, passive: true }
);

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
  if (!document.hidden || !pauseMutedVideo) {
    pausedMedia.delete(media);
    return;
  }
  if (!media.paused && (media.muted || media.volume === 0)) {
    pauseMedia(media);
  }
}

function pauseMedia(media) {
  pausedMedia.add(media);
  media.pause();
}

// Observe inserted players only while a hidden page needs media throttling.
const mediaObserver = new MutationObserver((records) => {
  for (const media of pausedMedia) {
    if (!media.isConnected) pausedMedia.delete(media);
  }
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof HTMLMediaElement) onPlay({ target: node });
      for (const media of node.querySelectorAll?.("video, audio") || []) onPlay({ target: media });
    }
  }
});
document.addEventListener("volumechange", onPlay, true);

function syncMedia() {
  if (!document.hidden || !pauseMutedVideo) return;
  for (const media of document.querySelectorAll("video, audio")) {
    if (!media.paused && (media.muted || media.volume === 0)) pauseMedia(media);
  }
}

function syncHiddenState() {
  const hidden = document.hidden;
  document.documentElement.classList.toggle(
    "bs-freeze-anim",
    hidden && pauseAnimations
  );

  mediaObserver.disconnect();
  if (hidden && pauseMutedVideo) {
    mediaObserver.observe(document, { childList: true, subtree: true });
    syncMedia();
    return;
  }
  for (const media of pausedMedia) {
    if (media.isConnected && media.paused) media.play().catch(() => {});
  }
  pausedMedia.clear();
}
