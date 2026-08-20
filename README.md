# BraveSaver

MV3-Extension für **Brave** (Chromium). Parkt inaktive Tabs, drosselt stumme Hintergrund-Videos/Animationen, schont RAM und CPU.

**Repo:** https://github.com/TiiTime/BraveSaver  
**Privacy:** https://github.com/TiiTime/BraveSaver/blob/master/webstore/PRIVACY.md

Parken = `chrome.tabs.discard`: Tab bleibt in der Leiste, Prozess ist weg. Klick lädt neu.

## Was sie tut

- **Auto-Park** nach Inaktivität (Profile: Sanft / Ausgewogen / Hart)
- **RAM-Druck:** bei wenig freiem Speicher früher parken
- **Duplikate** derselben URL zuerst weg
- **Schutz:** aktiv, angepinnt, Ton, Formular-Eingabe, Whitelist (Docs, Meet, Figma, …)
- **Hintergrund:** stumme Videos pausieren, CSS-Animationen einfrieren — Ton-Tabs bleiben
- **Vergessener Ton** optional stumm, danach parkbar
- Badge = Zahl geparkter Tabs

Die Extension selbst schläft: Sweep läuft über `chrome.alarms` (1 min), kein dauerhafter Background-Thread.

## In Brave laden

1. `brave://extensions` öffnen
2. **Entwicklermodus** an
3. **Entpackte Erweiterung laden** → Ordner `BraveSaver`

Rechtsklick auf einer Seite: Tab parken / andere parken / Domain nie parken.

## Grenzen

Brave Shields blockt Tracker schon. BraveSaver ersetzt das nicht. JS-CPU in *aktiven* Tabs kann eine Extension nicht drosseln — nur Last in unsichtbaren/toten Tabs kappen.

## Chrome Web Store

Listing, Privacy, Screenshots, ZIP: [`webstore/`](webstore/README.md)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

Upload `dist/bravesaver-extension.zip`. Copy-paste: `webstore/STORE_LISTING.md`.
