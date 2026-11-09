import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl, protectionReason } from "../lib/heuristics.js";
import { DEFAULTS, loadSettings } from "../lib/settings.js";

test("duplicate matching retains query state and fragments", () => {
  assert.notEqual(normalizeUrl("https://example.com/?q=one"), normalizeUrl("https://example.com/?q=two"));
  assert.notEqual(normalizeUrl("https://example.com/#draft"), normalizeUrl("https://example.com/#published"));
  assert.notEqual(normalizeUrl("https://example.com/editor/"), normalizeUrl("https://example.com/editor"));
  assert.equal(normalizeUrl("https://example.com/?q=one&utm_source=test&gclid=abc"), "https://example.com/?q=one");
});

test("protection reasons respect the settings", () => {
  const tab = { id: 3, url: "https://example.com" };
  assert.equal(protectionReason({ ...tab, active: true }, DEFAULTS, new Set()), "protectActive");
  assert.equal(protectionReason({ ...tab, audible: true }, DEFAULTS, new Set()), "protectSound");
  assert.equal(protectionReason(tab, DEFAULTS, new Set([3])), "protectDraft");
  assert.equal(protectionReason(tab, { ...DEFAULTS, whitelist: ["example.com"] }, new Set()), "protectSite");
  assert.equal(protectionReason({ ...tab, pinned: true }, { ...DEFAULTS, protectPinned: false }, new Set()), null);
});

test("upgrading with legacy auto-park enabled does not opt in to automatic unloading", async () => {
  globalThis.chrome = { storage: { local: { get: async () => ({ settings: { enabled: true, locale: "en" } }) } } };
  const settings = await loadSettings();
  assert.equal(settings.autoUnload, false);
  assert.equal(settings.locale, "en");
});
