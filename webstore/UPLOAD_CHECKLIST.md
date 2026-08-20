# BraveSaver — Chrome Web Store Upload

Texte: **`STORE_LISTING.md`** · Datenschutz: **`PRIVACY.md`**  
Dashboard: https://chrome.google.com/webstore/devconsole

---

## Vor dem Upload

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

| Prüfpunkt | Datei / Wert |
|-----------|----------------|
| ZIP | `dist/bravesaver-extension.zip` |
| Version | `manifest.json` → **1.0.0** |
| Store-Icon | `webstore/assets/icon-128.png` (128×128) |
| Screenshots | `screenshot-01` … `screenshot-05` (je 1280×800, 24-bit RGB) |
| Small promo | `promo-tile-440x280.png` |
| Marquee | `promo-marquee-1400x560.png` |
| Privacy-URL | https://github.com/TiiTime/BraveSaver/blob/master/webstore/PRIVACY.md |

Nur das ZIP hochladen — nicht den ganzen Ordner.

---

## Dashboard — neues Item

1. Developer Dashboard → **Neuer Eintrag** → **Erweiterung**.
2. Tab **Paket** → `dist/bravesaver-extension.zip`.
3. Automatische Prüfung abwarten.
4. Tab **Store-Eintrag**: Name, Kurz- + Langbeschreibung aus `STORE_LISTING.md` (EN und DE).
5. Icon, 5 Screenshots, Small promo, optional Marquee.
6. Tab **Datenschutz**: Antworten aus `STORE_LISTING.md`, Privacy-URL.
7. Sichtbarkeit **Öffentlich**, Preis **Kostenlos**, Kategorie **Productivity**.
8. **Zur Überprüfung einreichen**.

---

## Store-Listing (Felder)

| Feld | Inhalt |
|------|--------|
| **Name** | BraveSaver |
| **Kurzbeschreibung** | `STORE_LISTING.md` → Short description |
| **Ausführliche Beschreibung** | EN und/oder DE aus `STORE_LISTING.md` |
| **Kategorie** | Productivity |
| **Screenshots** | 01 Hero → 02 Popup → 03 Protect → 04 Settings → 05 How |
| **Small promo tile** | `promo-tile-440x280.png` |

**Single purpose:** *Reduce RAM and CPU by parking idle tabs and throttling hidden-tab background work.*

---

## Nach dem Einreichen

Review typisch 1–3 Werktage. Ablehnung → Meldung lesen, ZIP/Listing/Privacy anpassen, neu einreichen.

Privacy-URL muss **öffentlich** sein. Repo noch privat? `PRIVACY.md` z. B. als GitHub-Gist oder GitHub-Repo public stellen, dann URL eintragen.

---

## Assets neu rendern

```powershell
powershell -ExecutionPolicy Bypass -File scripts/render-store-assets.ps1
```
