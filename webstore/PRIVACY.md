# BraveSaver Privacy Policy

- Last updated: 2026-11-24
- Developer: Tii
- Applies to BraveSaver 1.0.4

## Purpose and local processing

BraveSaver reduces the resource usage of open browser tabs. Gentle parking pauses muted media and CSS animations in hidden tabs while keeping pages loaded. Optional tab unloading frees system memory and causes a page to reload when it is reopened. Automatic unloading is off by default.

BraveSaver processes open-tab metadata locally, including URLs, titles, last activity and tab state. It uses this information to show tabs in the popup, apply protection rules and site exceptions, and choose tabs for optional unloading. It reads system memory information for the popup and optional memory-pressure rules. BraveSaver does not build a browsing-history log or transmit open-tab metadata to Tii.

## Information stored in the browser

- Local storage keeps preferences, site exceptions, basic unload counters and the last update version shown.
- Session storage keeps tab and frame IDs with a document marker when an input event is detected on a supported page or embedded editor. The marker helps protect drafts from unloading. BraveSaver does not read or store what you typed, including form values and passwords.
- Session markers are cleared when their tabs close or the browser session ends. Persistent extension data can be removed by uninstalling BraveSaver.

## Network and third parties

BraveSaver does not use developer servers, accounts, analytics, advertising or remotely hosted code. It does not sell user data. The popup may display the favicon URL provided by the browser for an open tab. If the image is not cached, displaying it can cause a normal image request to the icon host. The optional review link opens the Chrome Web Store only when clicked. The store handles any review you choose to submit.

## Contact

https://github.com/TiiTime/BraveSaver/issues
