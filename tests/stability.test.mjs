import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { DEFAULTS, loadSettings, saveSettings } from "../lib/settings.js";

test("concurrent settings patches retain both changes and sanitize old data", async () => {
  let settings = { idleMinutes: -5, maxPerSweep: "broken", whitelist: "bad", locale: "xx" };
  globalThis.chrome = { storage: { local: {
    get: async () => { const snapshot = structuredClone(settings); await setImmediate(); return { settings: snapshot }; },
    set: async (patch) => { await setImmediate(); settings = patch.settings; },
  } } };
  const loaded = await loadSettings();
  assert.equal(loaded.idleMinutes, DEFAULTS.idleMinutes);
  assert.equal(loaded.maxPerSweep, DEFAULTS.maxPerSweep);
  assert.deepEqual(loaded.whitelist, DEFAULTS.whitelist);
  await Promise.all([saveSettings({ locale: "en" }), saveSettings({ idleMinutes: 25 })]);
  assert.equal(settings.locale, "en");
  assert.equal(settings.idleMinutes, 25);
  await saveSettings({ whitelist: ["https://www.example.com/path", "EXAMPLE.com", "*.example.org"] });
  assert.deepEqual(settings.whitelist, ["example.com", "example.org"]);
});

test("wake is idempotent and input protection survives another frame becoming ready", async () => {
  const handlers = {};
  const event = (name) => ({ addListener: (fn) => { handlers[name] = fn; } });
  let discarded = false;
  let reloads = 0;
  const session = {};
  const tab = () => ({ id: 12, url: "https://example.com", title: "Example", discarded });
  globalThis.chrome = {
    runtime: { onInstalled: event("installed"), onStartup: event("startup"), onMessage: event("message") },
    alarms: { get: (_, callback) => callback({}), onAlarm: event("alarm") },
    idle: { onStateChanged: event("idle") },
    contextMenus: { onClicked: event("menu") },
    tabs: {
      onActivated: event("activated"), onRemoved: event("removed"), onUpdated: event("updated"),
      get: async () => tab(), query: async () => [tab()],
      sendMessage: async () => { throw new Error("Document is no longer present"); },
      reload: async () => { reloads++; discarded = false; },
    },
    action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
    storage: {
      onChanged: event("storage"),
      local: { get: async () => ({}), set: async () => {} },
      session: {
        get: async () => structuredClone(session),
        set: async (patch) => Object.assign(session, patch),
        remove: async (keys) => { for (const key of [keys].flat()) delete session[key]; },
      },
    },
  };
  await import("../background.js");
  const send = (message, sender = {}) => new Promise((resolve) => handlers.message(message, sender, resolve));
  await send({ type: "WAKE_TAB", tabId: 12 });
  assert.equal(reloads, 0, "a stale wake button must not reload a loaded tab");
  discarded = true;
  await Promise.all([send({ type: "WAKE_TAB", tabId: 12 }), send({ type: "WAKE_TAB", tabId: 12 })]);
  assert.equal(reloads, 1);
  await send({ type: "FORM_DIRTY" }, { tab: { id: 12 }, frameId: 2, documentId: "editor" });
  await send({ type: "FORM_CLEAN" }, { tab: { id: 12 }, frameId: 3, documentId: "other" });
  const status = await send({ type: "GET_STATUS" });
  assert.equal(status.tabs[0].protectionReason, "protectDraft");
  await send({ type: "FORM_DIRTY", documentToken: "new-editor" }, { tab: { id: 12 }, frameId: 2, documentId: "new-editor-document" });
  await send({ type: "FORM_GONE" }, { tab: { id: 12 }, frameId: 2 });
  assert.equal((await send({ type: "GET_STATUS" })).tabs[0].protectionReason, "protectDraft", "old document cannot clear a newer draft");
  handlers.updated(12, { status: "loading" });
  assert.equal((await send({ type: "GET_STATUS" })).tabs[0].protectionReason, "protectDraft", "starting or stopping navigation must preserve drafts");
  await send({ type: "FORM_CLEAN", documentToken: "new-top" }, { tab: { id: 12 }, frameId: 0, documentId: "new-top-document" });
  assert.notEqual((await send({ type: "GET_STATUS" })).tabs[0].protectionReason, "protectDraft", "replacement document clears expired child-frame markers");
});
