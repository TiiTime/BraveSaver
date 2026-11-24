# BraveSaver

Aktueller lokaler Stand: **1.0.4**. Verbesserter Eingabeschutz in eingebetteten Editoren, sicheres Wecken bereits geladener Tabs und ein automatisch aktualisiertes Popup.

MV3-Extension für **Brave** (Chromium). Drosselt die Hintergrundlast geladener Tabs und kann optional Tabs entladen.

- **Chrome Web Store:** https://chromewebstore.google.com/detail/bravesaver/biaipdcolloigdioodclahglfphchpca
- **Repo:** https://github.com/TiiTime/BraveSaver
- **Privacy:** https://raw.githubusercontent.com/TiiTime/BraveSaver/refs/heads/master/webstore/PRIVACY.md

**Sanftes Parken** pausiert stumme Medien und CSS-Animationen im Hintergrund. Beim Zurückwechseln bleibt die Seite geladen. **Entladen** gibt zusätzlich RAM frei und lädt den Tab beim Öffnen neu. Automatisches Entladen muss ausdrücklich aktiviert werden.

## Was sie tut

- **Optionales automatisches Entladen** nach Inaktivität (Profile: Sanft / Ausgewogen / Hart)
- **RAM-Druck:** bei wenig freiem Speicher früher entladen
- **Duplikate** anhand der URL inklusive Suchparametern und Fragment, abzüglich bekannter Tracking-Parameter
- **Schutz beim Entladen durch BraveSaver:** aktive Tabs, angepinnte Tabs, Ton, erkannte Eingaben und Website-Ausnahmen
- **Hintergrund:** stumme Videos pausieren, CSS-Animationen einfrieren — Ton-Tabs bleiben
- **Vergessener Ton** optional stumm, danach parkbar
- Badge = Zahl entladener Tabs

Die Extension selbst schläft: Sweep läuft über `chrome.alarms` (1 min), kein dauerhafter Background-Thread.

## Installation

**Empfohlen:** [BraveSaver im Chrome Web Store](https://chromewebstore.google.com/detail/bravesaver/biaipdcolloigdioodclahglfphchpca) → **Hinzufügen**. Gilt für Chrome und Brave.

Manuell / Entwicklung:

1. `brave://extensions` öffnen
2. **Entwicklermodus** an
3. **Entpackte Erweiterung laden** → Ordner `BraveSaver`

Per Rechtsklick lassen sich andere Tabs entladen oder Websites vom Entladen durch BraveSaver ausnehmen.

## Grenzen

Sanftes Parken reduziert Hintergrundlast von Medien und CSS-Animationen. Geladene Seiten belegen weiterhin RAM. Die eigene Speicherverwaltung des Browsers kann unabhängig von BraveSaver Tabs entladen.

## Chrome Web Store

Bestehender Store-Eintrag mit der Item-ID `biaipdcolloigdioodclahglfphchpca`.

Listing, Privacy, Screenshots, ZIP: [`webstore/`](webstore/README.md)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

Upload `dist/bravesaver-extension.zip`. Copy-paste: `webstore/STORE_LISTING.md`.
