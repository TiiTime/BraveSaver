import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";

test("updates open once and overlapping lifecycle events keep unique menu IDs", async () => {
  const listeners = {};
  const event = (name) => ({ addListener: (handler) => { listeners[name] = handler; } });
  const opened = [];
  const menuIds = new Set();
  const duplicates = [];
  const saved = {};
  globalThis.chrome = {
    runtime: {
      onInstalled: event("installed"), onStartup: event("startup"), onMessage: event("message"),
      getManifest: () => ({ version: "1.0.3" }), getURL: (name) => `chrome-extension://test/${name}`,
    },
    alarms: { get: (_, callback) => callback({}), onAlarm: event("alarm") },
    idle: { onStateChanged: event("idle") },
    tabs: {
      onActivated: event("activated"), onRemoved: event("removed"), onUpdated: event("updated"),
      create: async ({ url }) => { opened.push(url); },
    },
    contextMenus: {
      onClicked: event("clicked"),
      removeAll: async (callback) => { await setImmediate(); menuIds.clear(); callback?.(); },
      create: ({ id }, callback) => {
        if (menuIds.has(id)) duplicates.push(id);
        menuIds.add(id);
        queueMicrotask(() => callback?.());
      },
    },
    storage: {
      onChanged: event("storage"),
      local: {
        get: async (key) => ({ [key]: saved[key] }),
        set: async (patch) => Object.assign(saved, patch),
      },
    },
  };
  await import("../background.js");
  listeners.installed({ reason: "install" });
  listeners.startup();
  await setImmediate();
  assert.deepEqual(opened, []);
  listeners.installed({ reason: "update", previousVersion: "1.0.3" });
  listeners.installed({ reason: "update", previousVersion: "1.0.2" });
  listeners.installed({ reason: "update", previousVersion: "1.0.2" });
  for (let i = 0; i < 10; i++) await setImmediate();
  assert.deepEqual(opened, ["chrome-extension://test/updates.html"]);
  assert.deepEqual(duplicates, []);
  assert.deepEqual([...menuIds].sort(), ["never-park", "park-others", "park-tab"]);
});
