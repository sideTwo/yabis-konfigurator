# Verwaltung Yabis Fliesenwelt

Yabi pflegt hier Artikel, Preise, Fotos und Formatpreise selbst. Adresse: `/verwaltung/`.

## So hängt es zusammen

- **Datenbank:** SQLite-Datei `katalog.sqlite` im Ordner `_yabis-verwaltung/` **eine Ebene über dem Webordner**
  (lokal: `Website Kunden/yabis-fliesenwelt/_yabis-verwaltung/`). Pfad in `konfiguration.php`
  oder per Umgebungsvariable `YABIS_VERWALTUNG`.
- **Beim Speichern** schreibt die Verwaltung `daten/katalog.js` neu. Shop (`katalog.html`) und Raumstudio laden nur diese Datei.
  Herstellernamen, Herstellerseiten und Bildquellen bleiben in der Datenbank und kommen nie in die öffentliche Datei.
- **Ausblenden statt Löschen:** Ausgeblendete Artikel stehen mit `hidden: true` in der Datei. Der Shop zeigt sie nicht,
  das Raumstudio und alte Anfragekörbe finden sie weiter.
- **Fotos** landen verkleinert als WebP in `bilder/katalog/eigene/`.
- **Sicherung:** Vor jedem Speichern eine Kopie in `_yabis-verwaltung/sicherungen/` (die letzten 60). Protokoll unter „Protokoll“.

## Livegang auf ALL-INKL

1. PHP 8.1 oder neuer, Erweiterungen `pdo_sqlite`, `gd` (mit WebP), `fileinfo`.
2. Ordner `_yabis-verwaltung/` **neben** dem Webordner anlegen (nicht darin) und Schreibrechte für PHP geben.
   Weicht der Pfad ab: `YABIS_VERWALTUNG` setzen oder `DATENORDNER` in `konfiguration.php` anpassen.
3. Lokale Datenbank `katalog.sqlite` dorthin hochladen oder auf dem Server `php verwaltung/werkzeug/import.php` ausführen.
4. Zugänge anlegen: `php verwaltung/werkzeug/benutzer.php <name> --zufall` (per SSH) oder lokal anlegen und die Datenbank hochladen.
   Passwörter nie ins Repo oder Brain, nur an Yabi direkt.
5. HTTPS erzwingen. `verwaltung/.htaccess` sperrt `lib.php`, `konfiguration.php` und `werkzeug/`.
6. Testen: anmelden, Preis ändern, im Shop prüfen, Protokoll ansehen.

## Wichtig bei späteren Website-Updates

Nach dem Livegang ist der Server die Quelle für die Artikel. Beim Hochladen neuer Website-Stände **nie überschreiben**:
`daten/katalog.js`, `bilder/katalog/eigene/` und `_yabis-verwaltung/`. Sonst sind Yabis Änderungen weg.
Der Import (`werkzeug/import.php --ersetzen`) setzt alles auf den alten WhatsApp-Stand zurück und ist nur für den Neustart gedacht.

## Lokal testen

`yabis-php` in `.claude/launch.json` (Port 4801), dann `http://localhost:4801/verwaltung/`.
Lokaler Testzugang: `_yabis-verwaltung/ZUGANG-LOKAL.txt` (nicht im Repo).
