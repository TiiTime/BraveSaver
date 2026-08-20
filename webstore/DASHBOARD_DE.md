# Chrome Web Store — Datenschutz-Felder (DE)

Zum Kopieren ins Developer Dashboard. Limit je Feld: 1000 Zeichen.

## Remote code

**Nein, ich verwende keinen Remote-Code.**

Nicht „Ja“ wählen. BraveSaver lädt kein JS/Wasm von außen, nutzt kein `eval`, keine externen Module.

## Datennutzung

Keine der Daten-Kategorien ankreuzen (keine Erfassung durch Tii).

Die drei Bestätigungen anhaken:

1. Kein Verkauf / keine Weitergabe außer in den erlaubten Fällen
2. Nutzerdaten nicht außerhalb des alleinigen Zwecks
3. Keine Nutzung für Kredit-/Bonitätsprüfung

## URL der Datenschutzerklärung

https://github.com/TiiTime/BraveSaver/blob/master/webstore/PRIVACY.md

---

## Beschreibung des alleinigen Zwecks

BraveSaver hat einen einzigen Zweck: den RAM- und CPU-Verbrauch des Browsers zu senken, indem ungenutzte Tabs geparkt (chrome.tabs.discard) und Last in unsichtbaren Tabs gedrosselt wird. Geparkte Tabs bleiben in der Tableiste und werden beim Anklicken neu geladen. Die Erweiterung schließt keine Tabs, ersetzt keine Werbeblocker und sendet keine Daten an eigene Server. Einstellungen und Park-Logik laufen ausschließlich lokal.

---

## Begründung für die Berechtigung „tabs“

Die tabs-API ist nötig, um offene Tabs zu listen, Inaktivität (lastAccessed) zu erkennen und ungenutzte Tabs mit chrome.tabs.discard aus dem Speicher zu nehmen. So bleibt der Tab in der Leiste, der Prozess entfällt. Zusätzlich braucht BraveSaver Tab-Metadaten (aktiv, angeheftet, Ton, URL), damit aktive, angeheftete, hörbare und Whitelist-Tabs nicht geparkt werden. Es wird keine Browsing-History an Server gesendet.

---

## Begründung für die Berechtigung „storage“

chrome.storage speichert nur lokale Einstellungen: Ein/Aus, Sprache, Park-Profil, Schutzoptionen, Wartezeiten und die Domain-Whitelist. Optional werden einfache Zähler (wie viele Tabs geparkt wurden) lokal gehalten. Keine Konten, keine Sync-Server von Tii, keine personenbezogenen Profile. Die Daten bleiben im Browser des Nutzers.

---

## Begründung für die Berechtigung „alarms“

Manifest V3 Service Worker schlafen. chrome.alarms weckt BraveSaver etwa einmal pro Minute für den Park-Sweep. Ohne Alarme gäbe es keinen zuverlässigen Hintergrund-Timer, und die Erweiterung müsste den Worker künstlich wach halten — das würde mehr Ressourcen kosten, nicht weniger.

---

## Begründung für die Berechtigung „idle“

chrome.idle erkennt, wenn der Rechner ungenutzt oder gesperrt ist. Dann darf BraveSaver inaktive Tabs früher parken, weil niemand vor dem Bildschirm sitzt. Sobald wieder gearbeitet wird, bleibt der Schutz für den aktiven Tab bestehen. Es wird kein Nutzungsprofil erzeugt oder übertragen.

---

## Begründung für die Berechtigung „system.memory“

chrome.system.memory liefert nur grobe Speicherwerte (Kapazität / frei) auf dem Gerät. Bei knappem RAM parkt BraveSaver früher und mehr Tabs. Die Werte bleiben lokal und gehen nicht an Tii oder Dritte. Ohne diese API gäbe es nur Zeit-Heuristik, kein Reagieren auf echten Speicherdruck.

---

## Begründung für die Berechtigung „contextMenus“

Über das Kontextmenü kann der Nutzer einen Tab parken, andere Tabs parken oder die aktuelle Website auf die Whitelist setzen („nie parken“). Das ist Bedienung, keine Datenerfassung. Es werden keine Menü-Klicks oder URLs nach außen gesendet.

---

## Begründung für die Hostberechtigung

BraveSaver deklariert kein beliebiges Remote-Fetch. Ein kleines Content-Script läuft auf http-/https-Seiten, damit der alleinige Zweck lokal erfüllt wird: (1) merken, dass in einem Formular getippt wurde, damit dieser Tab nicht geparkt wird; (2) stumme Videos/Audio in unsichtbaren Tabs pausieren; (3) CSS-Animationen in unsichtbaren Tabs anhalten. Seiteninhalt, Passwörter und Formulardaten werden nicht ausgelesen, nicht gespeichert und nicht übertragen. Kein Tracking, keine Werbung, keine Dritt-APIs.
