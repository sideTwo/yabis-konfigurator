# Yabi’s Fliesenwelt – Website, Raumstudio und Anfragekorb

**[Website mit Haus-Auswahl](https://sidetwo.github.io/yabis-konfigurator/)** · **[Raumstudio](https://sidetwo.github.io/yabis-konfigurator/studio/index.html?raum=bad)** · **[Shop](https://sidetwo.github.io/yabis-konfigurator/katalog.html)**

## Vorführstand

Sechs Bereiche: Bad, Wohnen, Balkon, Küchenwand, Treppenhaus und Außenbereich.
Im Raumstudio sind **14 Bestseller** mit 15 unterscheidbaren Ausführungen belegt.
Bad und Küche bieten die Fliesen an. Im Wohnbereich kommen Rijn, Donau und
Ganges als Fischgrätvinyl hinzu. Balkon und Treppenhaus zeigen
Habitat Perla und Bercy Terra. Im Außenbereich führt die Vorschau zur Naturstein-Anfrage.
Der Shop enthält **287 Artikel**. Zu den 284 Einträgen aus dem
WhatsApp-Katalog kommen Capitol Hueso, Cesar Pul Beige und Flavio Oxido auf Anfrage.

Der Shop lädt `js/catalog-products.js` und die drei Ergänzungen aus `js/studio-core.js`.
Rohdaten, Handyfoto-Originale, Bildbericht und PC-/Handynachweise liegen unter
`../_material/katalog-import-2026-11-18/`.

Der Shop bietet kombinierbare Filter für Produkttyp, Optik, Oberfläche und Format
sowie eine A–Z-Sortierung. Eurobeträge erscheinen als Richtpreise pro Quadratmeter.
Bei 18 Quellartikeln mit ZAR-Angabe gilt Preis auf Anfrage. Der Mengenrechner
ermittelt einen Richtwert für belegte Katalogformate. Verkaufseinheiten,
Verfügbarkeit und Lieferung klärt Yabis im Angebot.

### Produktbilder

50 Herstellerdekore in `js/catalog-images.js` stammen von Prissmacer,
Roca Tiles und EKOFLOORS. Bildnutzungsrechte hat Bilal für Yabis am 18.11.2026
bestätigt. Quellen, Zuordnungen und Vergleichsbögen liegen unter
`../_material/herstellerbilder-2026-11-18/`.

Alle 284 WhatsApp-Artikel haben eine rekonstruierte Materialansicht in
`js/catalog-reconstructions.js`. Bei 50 Artikeln ist das Herstellerdekor die
Hauptansicht. Im Produktdialog lässt sich dort auf „Oberfläche“ wechseln.
Die übrigen 234 Artikel zeigen ihre Rekonstruktion als Hauptansicht.
Handyfotos dienen als interne Bildreferenzen. Generierung und Vergleich sind
unter `../_material/ki-produktbilder-2026-11-18/` dokumentiert.
Die drei Bestseller-Ergänzungen verwenden Dekore aus Herstellerunterlagen.

- Bad: Wand und Boden unabhängig, Wandhöhe 1,20 m oder raumhoch, Formate und Fugenfarben getrennt.
- Küche: Rückwand und Fronten unabhängig wechseln. Wohnen: Fliesen und
  Fischgrätvinyl im gleichen Raum vergleichen.
- Bad, Küche, Wohnen, Balkon und Treppenhaus projizieren Materialtexturen auf
  feste Raumflächen. Das Treppenhaus zeigt durchgehende Tritt- und Setzstufen.
- Stein- und Keramikflächen bieten eine natürliche Verteilung oder eine
  durchlaufende Maserung. „Neu verteilen“ ändert die Lage der vorhandenen Dekore.
- Je drei Kombinationen stehen für Bad und Küche bereit. Die Materialien und
  die zugehörigen Fugenfarben beziehungsweise Fronten bleiben danach einzeln wählbar.
- Eigene Flächen und Verschnitt je Position; gemeinsamer Anfragekorb mit Raumzuordnung.
- PNG-Export, Originalartikel und Herstellermuster verlinkt.
- Außeneignung, Rutschhemmung, Aufbau und Verfügbarkeit sind nicht bestätigt;
  diese Rückfragen bleiben in Warenkorb und Anfragetext erhalten.
- Unverbindliche Anfrage. Keine Zahlung in dieser Vorschau.

Die KI-Gestaltungsvorschauen nach Herstellermustern ersetzen weder Produktmuster
noch Aufmaß oder technische Freigabe. Muster und Farben können abweichen.
Die Produktvorschau zeigt eine angenäherte Verlegung. Unbestätigte Verkaufsformate
werden im Anfragekorb als „Format auf Anfrage“ übernommen.

## Einstieg

Alle sechs Haus-Buttons führen ins Raumstudio. Beim Bad geht die Hausansicht in
einen lokal ausgelieferten Anflug auf das Fenster über, danach erscheint die
aktuelle Badkonfiguration. Die übrigen Bereiche verwenden einen kurzen Zoom
mit Überblendung. Die Animation lässt sich überspringen und wird bei reduzierter
Bewegung oder Datensparmodus ausgelassen.

Der alte Link `konfigurator-neu/index.html` führt ins Bad des Raumstudios weiter.
Nicht ausgewählte Shopartikel erscheinen nicht automatisch im Studio.

## Aufbau

- `studio/`: gemeinsame Oberfläche für PC-Vollbild und Handy.
- `js/studio-core.js`: Raumdefinitionen und kuratierte Material-IDs; unabhängig
  vom vollständigen Sortiment in `js/shop-core.js`.
- `assets/studio/`: WebP-Ansichten, nur für den gewählten Raum geladen.
- `konfigurator-neu/standbild-renderer.js`, `tile-grid.js`: Badmasken und Fugenperspektive.
- `js/room-transition.js`, `studio/transition.css`: Einstieg aus dem Haus-Hero.
- `tests/`: Mengen, Anfragekorb, Perspektive, Raumzuordnung, Bildladefehler und Wechselrennen.

## Lokal und Prüfen

Mit dem gemeinsamen `_werkzeuge/serve.ps1` den Kundenordner als Root auf Port 4800
starten und `http://localhost:4800/yabis-konfigurator/` öffnen. Der frühere
Node-Server `_dev/server.cjs` nutzt Port 8765 mit dem Repository als Root.

```sh
node -e "for(const f of require('fs').readdirSync('tests').filter(x=>x.endsWith('.test.cjs'))) require('./tests/'+f)"
```

Katalog- und Herstellerzuordnungen: `_quelle/`. Neue Prompts, Bildoriginale,
Kling-Testauftrag und Produktfreigabeliste: privater Kundenordner
`_material/raumstudio/` außerhalb dieses öffentlichen Repos.

## Badbilder für weitere Artikel vorbereiten

Material und Fugen verwenden dieselben kalibrierten Flächen. Auch Wandstreifen
hinter Glas und die Fensterlaibungen sind enthalten; Fenster, Keramik und
Möbel werden gezielt geschützt. Badbilder mit falschen Pixelmaßen werden
abgewiesen. Der optionale native Pixeltest vergleicht echte Zeichenausgaben
und erzeugt eine Kontaktübersicht. Für neue Artikel genügt zunächst der
Vergleich mit einer Referenz, ohne das komplette Sortiment neu zu rendern.

Siehe [_dev/BAD-BILDPRUEFUNG.md](_dev/BAD-BILDPRUEFUNG.md).
