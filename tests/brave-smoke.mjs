import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const browserPath = process.argv[2];
assert.ok(browserPath, "Pass the path to Brave or another Chromium browser");
const fixture = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const title = req.url === "/draft" ? "Draft fixture" : "Clean fixture";
  res.end(`<!doctype html><title>${title}</title><style>@keyframes run {to {opacity:.5}} textarea {animation: run 3s infinite}</style>
    <textarea></textarea><script>window.documentIdentity = crypto.randomUUID();</script>`);
});
await new Promise((done) => fixture.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${fixture.address().port}`;
const profile = await mkdtemp(join(tmpdir(), "bravesaver-e2e-"));
const extension = resolve(import.meta.dirname, "..");
const browser = spawn(browserPath, [
  "--headless=new", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  `--disable-extensions-except=${extension}`, `--load-extension=${extension}`,
  "about:blank",
], { windowsHide: true, stdio: "ignore" });

async function until(fn, label) {
  const deadline = Date.now() + 12000;
  let error;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (e) { error = e; }
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`, { cause: error });
}

let socket;
try {
  const address = await until(async () => {
    const [port, path] = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split(/\r?\n/);
    return `ws://127.0.0.1:${port}${path}`;
  }, "Brave debugger");
  socket = new WebSocket(address);
  await new Promise((done, fail) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", fail, { once: true });
  });
  const pending = new Map();
  let nextId = 0;
  socket.addEventListener("message", ({ data }) => {
    const packet = JSON.parse(data);
    const handler = pending.get(packet.id);
    if (!handler) return;
    pending.delete(packet.id);
    if (packet.error) handler.reject(new Error(packet.error.message));
    else handler.resolve(packet.result);
  });
  function cdp(method, params = {}, sessionId) {
    const id = ++nextId;
    socket.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }
  async function attach(targetId) {
    return (await cdp("Target.attachToTarget", { targetId, flatten: true })).sessionId;
  }
  async function evaluate(session, expression) {
    const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  async function openPage(url) {
    const { targetId } = await cdp("Target.createTarget", { url });
    return { targetId, session: await attach(targetId) };
  }

  const worker = await until(async () => (await cdp("Target.getTargets")).targetInfos.find(
    (target) => target.type === "service_worker" && target.url.endsWith("/background.js"),
  ), "BraveSaver service worker");
  const workerSession = await attach(worker.targetId);
  assert.equal((await cdp("Target.getTargets")).targetInfos.some((target) => target.url.endsWith("/updates.html")), false);
  const news = await openPage(new URL("updates.html", worker.url).href);
  await until(() => evaluate(news.session, "document.querySelector('#language').lang === 'en'"), "German update page");
  assert.equal(await evaluate(news.session, "document.querySelector('#version').textContent"), "1.0.3");
  await evaluate(news.session, "document.querySelector('#language').click()");
  assert.equal(await evaluate(news.session, "document.documentElement.lang"), "en");
  assert.equal(await evaluate(news.session, "document.querySelector('.review a').textContent"), "Review BraveSaver ↗");
  assert.equal(await evaluate(news.session, "document.querySelector('.review a').href"), "https://chromewebstore.google.com/detail/bravesaver/biaipdcolloigdioodclahglfphchpca/reviews");
  await cdp("Target.closeTarget", { targetId: news.targetId });
  console.log("PASS: update page renders both languages and points to BraveSaver reviews");
  const draft = await openPage(origin + "/draft");
  const id = await until(() => evaluate(draft.session, "window.documentIdentity"), "draft fixture");
  await until(() => evaluate(workerSession, `(async () => {
    const [tab] = await chrome.tabs.query({ url: ${JSON.stringify(origin + "/draft")} });
    return (await chrome.tabs.sendMessage(tab.id, { type: "GET_FORM_STATE" })).dirty === false;
  })()`), "draft content script");
  await evaluate(draft.session, `(() => {
    const field = document.querySelector("textarea");
    field.value = "Nicht gespeicherter Entwurf";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  const clean = await openPage(origin + "/clean");
  const cleanId = await until(() => evaluate(clean.session, "window.documentIdentity"), "clean fixture");
  await until(() => evaluate(draft.session, "document.hidden && document.documentElement.classList.contains('bs-freeze-anim')"), "gentle parking on hidden tab");
  const popup = await openPage(new URL("popup.html", worker.url).href);
  await until(() => evaluate(popup.session, "document.querySelector('#soft-park-status').textContent.includes('Sanftes Parken an')"), "popup status");
  assert.equal(await evaluate(popup.session, "document.querySelector('#enabled').checked"), false);
  await evaluate(popup.session, "document.querySelector('#enabled').click()");
  assert.equal(await evaluate(popup.session, "document.querySelector('#unload-confirm').open"), true);
  await evaluate(popup.session, "document.querySelector('#unload-confirm [value=cancel]').click()");
  assert.equal(await evaluate(popup.session, "[...document.querySelectorAll('.stats dt')].at(-1).textContent"), "Freier System-RAM");
  const status = () => evaluate(popup.session, 'chrome.runtime.sendMessage({type:"GET_STATUS"})');
  const tabs = (await status()).tabs;
  const draftTab = tabs.find((tab) => tab.host === "127.0.0.1" && tab.protectionReason === "protectDraft");
  assert.ok(draftTab, "draft gets a protection reason");
  const cleanTab = tabs.find((tab) => tab.title === "Clean fixture");
  assert.ok(cleanTab);
  await evaluate(popup.session, `document.querySelector('#tab-filter').value = 'protected';
    document.querySelector('#tab-filter').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(popup.session, "document.querySelector('#tab-list').textContent.includes('Eingabe')"), true);
  await evaluate(workerSession, `new Promise((resolve) => {
    function onAlarm(alarm) {
      if (alarm.name !== "bravesaver-sweep") return;
      chrome.alarms.onAlarm.removeListener(onAlarm);
      setTimeout(resolve, 100);
    }
    chrome.alarms.onAlarm.addListener(onAlarm);
    chrome.alarms.create("bravesaver-sweep", { when: Date.now() + 100 });
  })`);
  assert.equal((await status()).stats.lastSweepAt, undefined);
  assert.equal((await status()).tabs.find((tab) => tab.id === cleanTab.id).discarded, false);
  const rejected = await evaluate(popup.session, `chrome.runtime.sendMessage({type:"PARK_TAB",tabId:${draftTab.id}})`);
  assert.equal(rejected.tabs.find((tab) => tab.id === draftTab.id).discarded, false);
  await cdp("Target.activateTarget", { targetId: draft.targetId });
  await until(() => evaluate(draft.session, "!document.hidden && !document.documentElement.classList.contains('bs-freeze-anim')"), "gentle parking resumed");
  assert.deepEqual(await evaluate(draft.session, "[window.documentIdentity, document.querySelector('textarea').value]"), [id, "Nicht gespeicherter Entwurf"]);
  console.log("PASS: Brave default, auto-unload off, gentle parking resumes original page and draft, manual unload protects draft, popup protection filter");

  // A debugger attached to the page can prevent Chromium from discarding it.
  await cdp("Target.detachFromTarget", { sessionId: clean.session });
  await cdp("Target.activateTarget", { targetId: popup.targetId });
  await evaluate(popup.session, `document.querySelector('#tab-filter').value = 'all';
    document.querySelector('#tab-filter').dispatchEvent(new Event('change'));
    document.querySelector('[title="Clean fixture"]').closest('li').querySelector('.action').click()`);
  assert.equal(await evaluate(popup.session, "document.querySelector('#unload-confirm').open"), true);
  await evaluate(popup.session, "document.querySelector('#unload-confirm [value=confirm]').click()");
  await until(async () => (await status()).tabs.find((tab) => tab.title === "Clean fixture")?.discarded, "clean tab discarded");
  await until(() => evaluate(popup.session, "document.querySelector('#park-now').dataset.i18n === 'wakeParked'"), "wake button");
  await evaluate(popup.session, `document.querySelector('#tab-filter').value = 'parked';
    document.querySelector('#tab-filter').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(popup.session, "document.querySelectorAll('#tab-list li').length"), 1);
  assert.equal(await evaluate(popup.session, "document.querySelector('#tab-list [title]').title"), "Clean fixture");
  await evaluate(popup.session, "document.querySelector('#park-now').click()");
  const resumedTarget = await until(async () => (await cdp("Target.getTargets")).targetInfos.find(
    (target) => target.type === "page" && target.url === origin + "/clean",
  ), "wake creates page target");
  const resumed = await attach(resumedTarget.targetId);
  const reloadedId = await until(() => evaluate(resumed, "window.documentIdentity"), "unloaded tab reload");
  assert.notEqual(reloadedId, cleanId);
  console.log("PASS: explicit unload releases an unprotected tab and wake reloads it");
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: 999999, method: "Browser.close" }));
    await delay(250);
  }
  socket?.close();
  browser.kill();
  fixture.close();
  // Chromium may still be releasing its profile handles on Windows.
  const resolvedProfile = await realpath(profile);
  if (dirname(resolvedProfile) === await realpath(tmpdir()) && basename(resolvedProfile).startsWith("bravesaver-e2e-")) {
    await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }).catch(() => {});
  }
}
