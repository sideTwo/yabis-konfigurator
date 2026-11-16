# Yabi’s Fliesenwelt – Website, Raumstudio und Anfragekorb

**[Website mit Haus-Auswahl](https://sidetwo.github.io/yabis-konfigurator/)** · **[Raumstudio](https://sidetwo.github.io/yabis-konfigurator/studio/index.html?raum=bad)** · **[Shop](https://sidetwo.github.io/yabis-konfigurator/katalog.html)**

## Vorführstand

Sechs Bereiche: Bad, Wohnen, Balkon, Küchenwand, Treppenhaus und Außenfliesen.
Das Raumstudio startet mit **Habitat Perla** und **Bercy Terra** aus dem bereits
erfassten WhatsApp-Katalog. Das ist ein Pilot, keine bestätigte Topseller-Liste.
Die vier erfassten Artikel bleiben im Shop. Das endgültige Sortiment wird nach
der Aktualisierung des Kundenkatalogs freigegeben.

- Bad: Wand und Boden unabhängig, Wandhöhe 1,20 m oder raumhoch, Formate und Fugenfarben getrennt.
- Küche: Rückwand wechseln. Andere Bereiche: Boden bzw. Stufen und Podeste wechseln.
- Die fünf neuen Bereiche zeigen zunächst feste Bildvarianten in 60 × 120 cm mit heller Fuge.
  Weitere Format- und Fugenregler folgen dort erst mit passender Vorschau.
- Eigene Flächen und Verschnitt je Position; gemeinsamer Anfragekorb mit Raumzuordnung.
- PNG-Export, Originalartikel und Herstellermuster verlinkt.
- Außeneignung, Rutschhemmung, Aufbau und Verfügbarkeit sind nicht bestätigt;
  diese Rückfragen bleiben in Warenkorb und Anfragetext erhalten.
- Unverbindliche Anfrage. Keine Zahlung in dieser Vorschau.

Die KI-Gestaltungsvorschauen nach Herstellermustern ersetzen weder Produktmuster
noch Aufmaß oder technische Freigabe. Muster und Farben können abweichen.
Das Bad behält seine kalibrierten, getrennten Flächen. Andere Räume verwenden
vollständige fotografische Materialvarianten mit fester Perspektive.

## Einstieg

Alle sechs Haus-Buttons führen ins Raumstudio. Ein kurzer Zoom mit Überblendung
verbindet Haus und Raum, überspringbar und bei reduzierter Bewegung oder
Datensparmodus ausgelassen. Das ist noch kein KI-Kameraflug.
`js/room-transition.js` enthält den Anschluss für freigegebene lokale MP4-Clips.
Kein Video- oder KI-Dienst wird im Browser aufgerufen.

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
