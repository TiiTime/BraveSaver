# BraveSaver — Chrome Web Store Listing

Copy-paste for the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).  
Assets: `webstore/assets/`.

---

## Store icon (required)

| File | Size |
|------|------|
| `webstore/assets/icon-128.png` | 128×128 |
| Package also ships `icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` |

---

## Screenshots (required, 1–5) — upload all five

**1280×800**, square corners, no padding. **PNG 24-bit RGB, no alpha.**

| # | File | What it shows |
|---|------|----------------|
| 1 | `screenshot-01-hero.png` | What BraveSaver is |
| 2 | `screenshot-02-popup.png` | Toolbar popup / park list |
| 3 | `screenshot-03-protect.png` | Pinned, audio, forms stay |
| 4 | `screenshot-04-settings.png` | Language + protection |
| 5 | `screenshot-05-how.png` | Park = RAM gone, tab stays |

---

## Small promo tile (required)

| File | Size |
|------|------|
| `promo-tile-440x280.png` | 440×280 |

---

## Marquee promo tile (optional)

| File | Size |
|------|------|
| `promo-marquee-1400x560.png` | 1400×560 |

---

## Name

**BraveSaver**

---

## Short description (max 132 characters)

**EN:** Parks idle tabs and throttles hidden-tab load so Brave uses less RAM and CPU. Free by Tii.

**DE:** Parkt inaktive Tabs und drosselt Hintergrund-Last — weniger RAM und CPU in Brave. Kostenlos von Tii.

---

## Detailed description — English

**BraveSaver** parks tabs you are not using so Brave spends less RAM and CPU. Parked tabs stay in the tab strip. Click one and it reloads.

It does not fight Brave Shields. It does not close your tabs. It parks the ballast.

**What it does**

- Auto-parks idle tabs after a wait you choose (Gentle / Balanced / Hard)
- Parks sooner when system memory is tight
- Parks duplicate pages of the same URL first
- Pauses muted video and CSS animation in hidden tabs
- Optional: mute audio you forgot about, then that tab can park too

**What it will not park**

- The active tab
- Pinned tabs
- Tabs that are playing sound (unless you turn on forgotten-mute)
- Tabs where you started typing in a form
- Sites on your whitelist (Docs, Meet, Figma, and whatever you add)

**How to use**

1. Install BraveSaver
2. Pin the icon, open the popup
3. Leave Auto-park on, or hit “Park inactive”
4. Right-click a page: park this tab, park others, or never park this site
5. Settings: Deutsch / English, timings, whitelist

**Privacy**

No account. No Tii servers. Settings stay in the browser. The page script only watches for form typing and hidden-tab media — it does not upload page content. Full policy in the repository.

**Free** — built by **Tii**.

---

## Detailed description — Deutsch

**BraveSaver** parkt Tabs, die du nicht benutzt, damit Brave weniger RAM und CPU zieht. Geparkte Tabs bleiben in der Leiste. Klick → neu geladen.

Kein Ersatz für Brave Shields. Tabs werden nicht geschlossen. Nur Ballast wird geparkt.

**Was es tut**

- Auto-Park nach einer Wartezeit (Sanft / Ausgewogen / Hart)
- Bei RAM-Druck früher parken
- Doppelte URLs zuerst
- Stumme Videos und CSS-Animationen in unsichtbaren Tabs pausieren
- Optional: vergessenen Ton stumm, danach parkbar

**Was es nicht parkt**

- Den aktiven Tab
- Angeheftete Tabs
- Tabs mit Ton (außer „vergessenen Ton stumm“)
- Tabs mit angefangener Eingabe
- Whitelist (Docs, Meet, Figma, plus eigene Hosts)

**Bedienung**

1. BraveSaver installieren
2. Icon anheften, Popup öffnen
3. Auto-Park an, oder „Inaktive parken“
4. Rechtsklick: Tab parken, andere parken, Seite nie parken
5. Einstellungen: Deutsch / English, Zeiten, Whitelist

**Datenschutz**

Kein Account. Keine Server von Tii. Einstellungen bleiben im Browser. Das Seiten-Skript merkt nur Formular-Tipperei und pausiert Last in versteckten Tabs — kein Upload von Seiteninhalt. Richtlinie im Repository.

**Kostenlos** — von **Tii**.

---

## Category

**Productivity**

---

## Language

Primary: **English** and **German** (add both localizations in the dashboard if possible)

---

## Privacy practices (dashboard)

| Question | Answer |
|----------|--------|
| Collects user data? | No personal data collected by Tii |
| Remote servers? | None |
| Sold to third parties? | No |
| Used for unrelated purposes? | No |
| Host access? | Content script on http/https only to detect form typing and pause hidden muted media / animations. Nothing is sent off-device. |

**Privacy policy URL:**  
https://github.com/TiiTime/BraveSaver/blob/master/webstore/PRIVACY.md

---

## Dashboard — Datenschutz (Copy-Paste DE)

Vollständige Texte: **`DASHBOARD_DE.md`**.

**Remote code:** **Nein** (nicht Ja). Alles JS liegt im ZIP.

**Datennutzung:** keine Kategorien ankreuzen. Die drei Bestätigungen (kein Verkauf, nur alleiniger Zweck, keine Kreditprüfung) anhaken.

---

## Homepage / support

| Field | URL |
|-------|-----|
| Homepage | https://github.com/TiiTime/BraveSaver |
| Support | https://github.com/TiiTime/BraveSaver/issues |

---

## Package to upload

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

Upload **`dist/bravesaver-extension.zip`** — not the Git repo.  
Version: **1.0.0**
