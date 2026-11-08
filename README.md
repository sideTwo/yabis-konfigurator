# Yabi’s Fliesenwelt – Konfigurator und Produktkatalog

Prototyp für die Auswahl von Badfliesen und unverbindliche Angebotsanfragen.
Der aktuelle Bad-Konfigurator zeigt eine stumme Kamerafahrt, vier Boden- und vier
Wanddekore sowie getrennte Einstellungen für Format, Verlegung, Fugenfarbe,
Fläche und Verschnitt. Die Auswahl kann als Bild gespeichert und als Anfrage
per WhatsApp oder E-Mail vorbereitet werden. Der Nutzer versendet den Entwurf selbst.

## Lokal starten

Voraussetzung: Node.js. Es sind keine zusätzlichen npm-Pakete erforderlich.

```sh
node _dev/server.cjs
```

Danach öffnen:

- Bad-Konfigurator: http://127.0.0.1:8765/konfigurator-neu/index.html
- Produktkatalog mit Anfragekorb: http://127.0.0.1:8765/katalog.html
- Früherer Prototyp mit weiteren Räumen: http://127.0.0.1:8765/index.html

Der Server lauscht lokal auf `127.0.0.1:8765` und unterstützt Video-Range-Requests.

## Aktueller Bad-Konfigurator

- `konfigurator-neu/index.html` und `bad.css`: Oberfläche und Anfrageformular.
- `konfigurator-neu/bad-film.js`: Auswahl, Kamera, Mengenberechnung, Speicherung
  im Browser sowie Bildexport und Anfrageentwürfe.
- `konfigurator-neu/materialien.js`: Boden- und Wanddekore mit Farbvarianten.
- `konfigurator-neu/fugen-live.js`: perspektivische Fliesenraster und Flächenmasken.
- `konfigurator-neu/source-joints.js`: gemessene Originalfugen der Kamerafahrt.
- `konfigurator-neu/assets/`: lokale Filme, Raumbilder und Materialmuster.

`katalog.html`, `katalog.css` und `js/katalog.js` enthalten den zusätzlichen
Produktkatalog. Der ältere Raum-Prototyp liegt im Projektstamm unter `index.html`,
`style.css` und `js/`.

## Grenzen des Prototyps

Die Raumdarstellung und Dekore sind Beispiele; die neuen Farbausführungen basieren
auf vorhandenen Beispielmaterialien. Sie sind keine verbindliche Zuordnung zu
lieferbaren Katalogartikeln. Die Vorschau ersetzt kein Aufmaß und keine
Verlegeplanung. Artikelnummern, verfügbare Formate, Verpackungseinheiten, Mengen
und Preise müssen im Angebot bestätigt werden.

Es gibt keinen Checkout und keine Online-Bezahlung. Benötigte Produkt- und
Materialdaten sind in `ANFRAGE-YABIS.md` beschrieben. Die unter `_quelle/`
gesammelten Katalogdaten sind unvollständig.

## Entwicklungsdateien

Die Skripte unter `_dev/` und `_quelle/` unterstützen die Aufbereitung von
Filmen, Fugenmessungen, Materialmustern und Raumdaten. Die fertigen Laufzeitmedien
sind bereits enthalten. Für erneute Medienaufbereitung wird FFmpeg benötigt.
Temporäre Renderdateien, lokale Zugangsdaten und Prüfscreenshots werden nicht
versioniert. `robots.txt` und die Seiten enthalten Ausschlüsse für Suchmaschinen.
