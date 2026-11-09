# Web Store assets

**Upload für 1.0.3:** [Checkliste](UPLOAD_CHECKLIST.md) · [Screenshot Deutsch](assets/bravesaver-1.0.3-de.jpg) · [Screenshot Englisch](assets/bravesaver-1.0.3-en.jpg). Die weiter unten aufgeführten Screenshots stammen aus früheren Versionen.

- **Store-Eintrag:** https://chromewebstore.google.com/detail/bravesaver/biaipdcolloigdioodclahglfphchpca
- **Item-ID:** `biaipdcolloigdioodclahglfphchpca`

Material für den Chrome Web Store. Upload-Schritte: **[UPLOAD_CHECKLIST.md](UPLOAD_CHECKLIST.md)**  
Copy-Paste: **[STORE_LISTING.md](STORE_LISTING.md)** · Privacy: **[PRIVACY.md](PRIVACY.md)**

| Asset | File | Size |
|-------|------|------|
| Store icon | `assets/icon-128.png` | 128×128 |
| Screenshot 1 | `assets/screenshot-01-hero.png` | 1280×800 |
| Screenshot 2 | `assets/screenshot-02-popup.png` | 1280×800 |
| Screenshot 3 | `assets/screenshot-03-protect.png` | 1280×800 |
| Screenshot 4 | `assets/screenshot-04-settings.png` | 1280×800 |
| Screenshot 5 | `assets/screenshot-05-how.png` | 1280×800 |
| Small promo | `assets/promo-tile-440x280.png` | 440×280 |
| Marquee | `assets/promo-marquee-1400x560.png` | 1400×560 |
| Extension ZIP | `../dist/bravesaver-extension.zip` | `scripts/build-release.ps1` |

## Build ZIP

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

## Render images

```powershell
powershell -ExecutionPolicy Bypass -File scripts/render-store-assets.ps1
```
