import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

test("only extension-paused media resumes and inserted hidden players are paused", async () => {
  const events = {};
  const players = [];
  let mutation;
  class Media {
    constructor(paused) {
      this.paused = paused;
      this.muted = true;
      this.volume = 0;
      this.isConnected = true;
      this.dataset = { bsPaused: "1" }; // A page-owned attribute must not trigger playback.
      this.playCount = 0;
    }
    pause() { this.paused = true; }
    play() { this.playCount++; this.paused = false; return Promise.resolve(); }
  }
  const document = {
    hidden: false,
    documentElement: { classList: { toggle() {} } },
    addEventListener: (event, handler) => { events[event] = handler; },
    querySelectorAll: () => players,
  };
  const context = vm.createContext({
    document, crypto: { getRandomValues: (values) => values.fill(42) }, window: { addEventListener() {} }, HTMLMediaElement: Media,
    MutationObserver: class {
      constructor(handler) { mutation = handler; }
      observe() {}
      disconnect() {}
    },
    chrome: {
      storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } },
      runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} },
    },
  });
  vm.runInContext(await readFile(new URL("../content.js", import.meta.url), "utf8"), context);
  await Promise.resolve();
  const userPaused = new Media(true);
  const playing = new Media(false);
  players.push(userPaused, playing);
  document.hidden = true;
  events.visibilitychange();
  assert.equal(playing.paused, true);
  const inserted = new Media(false);
  players.push(inserted);
  mutation([{ addedNodes: [inserted] }]);
  assert.equal(inserted.paused, true);
  document.hidden = false;
  events.visibilitychange();
  assert.equal(userPaused.playCount, 0);
  assert.equal(playing.playCount, 1);
  assert.equal(inserted.playCount, 1);
});
