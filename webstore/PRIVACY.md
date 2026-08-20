# BraveSaver — Privacy Policy

**Last updated:** 2026-08-20  
**Developer:** Tii  
**Extension:** BraveSaver (browser extension for Chrome / Brave)

## Summary

BraveSaver does not sell your data. BraveSaver does not run its own servers. Nothing you browse is uploaded to Tii.

## What the extension does

BraveSaver parks idle tabs (`chrome.tabs.discard`) and can pause muted media / CSS animations in **hidden** tabs so the browser uses less RAM and CPU.

## What is stored locally

In your browser, via `chrome.storage`:

- Settings (on/off, language, park timings, protection flags, site whitelist)
- Lightweight local stats (how many tabs were parked)

This data stays on your device. It is not synced to Tii.

## What runs on web pages

A small content script runs on `http`/`https` pages to:

- Notice that you typed in a form, so that tab is **not** parked
- Pause **muted** video/audio when the tab is hidden
- Pause CSS animations while the tab is hidden

The script does **not** read the page’s article text, passwords, or form values for any other purpose. It does **not** send page contents anywhere.

## What stays on the device

Tab titles, URLs, discard state, and (if the browser allows it) approximate memory pressure are processed **locally** so BraveSaver can decide which tabs to park. They are not transmitted to Tii.

## What we do not collect

- No account
- No analytics by Tii
- No advertising identifiers
- No browsing history uploaded to Tii
- No sale of data to third parties

## Third parties

None. BraveSaver does not call remote APIs.

## Contact

Questions: https://github.com/TiiTime/BraveSaver/issues

## Changes

This policy may be updated in the repository. The published URL always shows the current version.
