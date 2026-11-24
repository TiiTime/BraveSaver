# BraveSaver – Datenschutzfelder im Chrome Web Store

Stand: BraveSaver 1.0.4. Die folgenden Texte sind für den bestehenden Store-Eintrag.

## Beschreibung des alleinigen Zwecks

BraveSaver reduziert den Ressourcenverbrauch offener Browser-Tabs. Standardmäßig pausiert die Erweiterung stumme Medien und CSS-Animationen in unsichtbaren Tabs und lässt die Seiten geladen. Optional können Nutzer inaktive Tabs entladen, um RAM freizugeben. Entladene Tabs bleiben in der Tab-Leiste und werden beim Öffnen neu geladen. Automatisches Entladen ist standardmäßig ausgeschaltet.

## tabs

BraveSaver verarbeitet Titel, URL, letzte Aktivität und Status offener Tabs lokal. Damit zeigt die Erweiterung Tabs im Popup an, berücksichtigt Website-Ausnahmen und wählt geeignete Tabs für das optionale Entladen aus.

## storage

BraveSaver speichert Einstellungen, Website-Ausnahmen, einfache Entladezähler und die zuletzt angezeigte Update-Version lokal im Browser. Während der Browsersitzung speichert es zu erkannten Eingaben Tab- und Frame-IDs mit einer Dokumentmarkierung. Eingegebener Text wird nicht gelesen oder gespeichert.

## alarms

Browser-Alarme stoßen regelmäßige Prüfungen an. Wenn automatisches Entladen aktiviert ist, prüft BraveSaver, welche Tabs die eingestellten Bedingungen erfüllen. Der Hintergrunddienst kann zwischen den Prüfungen ruhen.

## idle

Wenn das Gerät inaktiv oder gesperrt wird, stößt BraveSaver eine zusätzliche Prüfung an. Das automatische Entladen setzt weiterhin voraus, dass die Funktion aktiviert ist und der Tab die Schutzregeln und Wartezeiten erfüllt.

## system.memory

BraveSaver liest den gesamten und verfügbaren System-RAM für die Anzeige im Popup. Bei aktiviertem automatischem Entladen nutzt BraveSaver dieselben Werte, um auf Speicherdruck zu reagieren. Die Werte werden lokal verarbeitet.

## contextMenus

Das Rechtsklickmenü bietet Befehle zum Entladen von Tabs und zum Hinzufügen von Websites zu den Ausnahmen.

## Hostberechtigungen für HTTP und HTTPS

Ein im Paket enthaltenes Seitenskript pausiert stumme Medien und CSS-Animationen in unsichtbaren Tabs und erkennt Eingabeereignisse für den Tab-Schutz. Es läuft auch in unterstützten eingebetteten Editoren, einschließlich zugehöriger about:blank- und srcdoc-Frames. Es liest keine Feldwerte oder Passwörter. Der Zugriff auf HTTP- und HTTPS-Seiten ist erforderlich, damit diese Funktionen auch ohne vorherigen Klick auf das Erweiterungssymbol arbeiten.

## Remote-Code und Datennutzung

- Remote-Code: **Nein**. Alle Erweiterungsskripte liegen im Paket.
- **Webverlauf** deckt die lokale Verarbeitung von URLs und Domains offener Tabs ab. BraveSaver erstellt daraus keine Verlaufsliste und übermittelt diese Angaben nicht an den Entwickler.
- Die Datenschutzerklärung beschreibt zusätzlich die lokale Eingabemarkierung und die Verwendung der vom Browser bereitgestellten Tab-Symbole.

## URL der Datenschutzerklärung

https://raw.githubusercontent.com/TiiTime/BraveSaver/refs/heads/master/webstore/PRIVACY.md
