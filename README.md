# Yabi’s Fliesenwelt – Konfigurator und Produktkatalog

**[Badstudio direkt ausprobieren](https://sidetwo.github.io/yabis-konfigurator/konfigurator-neu/)**
· **[Produktkatalog mit Anfragekorb](https://sidetwo.github.io/yabis-konfigurator/katalog.html)**

Vorführung für Yabi’s Fliesenwelt: Boden und Wand getrennt gestalten,
1,20 m oder raumhohe Wandfliesen auswählen und ein Angebot anfragen.
Die vier Artikel sind dem Yabis-Katalog zugeordnet. Die Raumansichten sind
KI-gestützte Vorschauen anhand der Herstellermuster; Muster, Farbe und Oberfläche
können vom Originalprodukt abweichen. Es entsteht keine verbindliche Bestellung.

Prototyp für die Auswahl von Badfliesen und unverbindliche Angebotsanfragen.
Das aktive Badstudio nutzt die freigegebene feste Badperspektive und acht
mit KI erstellte Materialansichten. Vier Wand- und vier Bodenmaterialien sind
unabhängig wählbar, dazu 1,20 m oder raumhohe Wandfliesen. Für jede Fläche sind
Fliesenformat und Fugenfarbe separat wählbar und sofort in der Vorschau sichtbar.
Bei 1,20 m bleiben die oberen Wände neutral weiß gestrichen, mit Abschlussprofil.
Die Dusche ist in beiden Fällen vollständig gefliest.
Beide Flächen lassen sich in den gemeinsamen Anfragekorb des Produktkatalogs
übernehmen. Dort sind Format, Fläche und Verschnitt pro Position änderbar.
WhatsApp und E-Mail werden als Entwurf vorbereitet; der Nutzer versendet selbst.

## Lokal starten

Voraussetzung: Node.js. Es sind keine zusätzlichen npm-Pakete erforderlich.

Unter Windows genügt ein Doppelklick auf `Badstudio-starten.cmd`. Der Starter
startet den lokalen Server bei Bedarf und öffnet das Badstudio im Browser.

```sh
node _dev/server.cjs
```

Danach öffnen:

- Badstudio mit Bildvorschau: http://127.0.0.1:8765/konfigurator-neu/index.html
- Bisherige Original-Kamerafahrt: http://127.0.0.1:8765/konfigurator-neu/kamerafahrt.html
- Separater 3D-Versuch: http://127.0.0.1:8765/bad-3d/prototyp.html
- Produktkatalog mit Anfragekorb: http://127.0.0.1:8765/katalog.html
- Früherer Prototyp mit weiteren Räumen: http://127.0.0.1:8765/raum-prototyp.html

Der Server lauscht lokal auf `127.0.0.1:8765` und unterstützt Video-Range-Requests.

## Aktive Vorführung

Alle Shop-Links führen zum Bild-Konfigurator unter `konfigurator-neu/`.
Auch der frühere Einstieg `bad-3d/index.html` leitet dorthin um. Die Auswahl
ist mit dem gemeinsamen Anfragekorb verbunden.

- `konfigurator-neu/index.html`, `standbild.css`, `standbild.js`: feste Ansicht,
  getrennte Boden-/Wandauswahl, Mengen und Verschnitt, Anfragekorb und PNG-Export.
- `konfigurator-neu/standbild-renderer.js`: getrennte, kalibrierte Boden- und Wandmasken,
  weiße gestrichene Flächen sowie die Aussparung für das vor den Boden ragende WC.
- `konfigurator-neu/assets/konfiguration-fugenlos/`: acht fotografische Materialflächen
  ohne fest eingebrannte Fliesenfugen. Die vorherigen Bilder bleiben unter
  `assets/konfiguration/` erhalten, einschließlich der neutral weißen Basis. Der Boden verwendet
  immer dieselbe Materialansicht, unabhängig von Wandmodell und Fliesenhöhe.
- `_quelle/yabis-auswahl-2026-11-12.json` und
  `_quelle/yabis-herstellerbilder-2026-11-12.json`: Zuordnung zu den Katalogartikeln
  und verwendete Herstellerquellen. Die Raumvarianten wurden mit Imagegen erstellt.

Die aktuelle Ansicht steht direkt im Bad, ohne Türen, mit Waschtisch links und
WC rechts. Die flächenbündige Betätigungsplatte folgt der Nutzervorlage: zwei
aneinanderliegende rechteckige Tasten mit gleicher Fliesenoberfläche.
Die WC-Spiegelung im Duschglas ist entfernt. Die vorherigen Entwürfe bleiben erhalten.

- `konfigurator-neu/tile-grid.js`: perspektivisches Fugenraster in einem
  Zentimetermodell. Jede Raumebene verwendet eine durchgehende Projektionsmatrix,
  damit Längsfugen an Querreihen nicht verspringen. Die 1,20-m-Abschlusskante dient
  als Höhenanker; Raumtiefe und Breite sind Modellannahmen, kein vermessenes Bad.

60 × 120, 60 × 60 und 120 × 120 cm sowie vier Fugenfarben sind für Boden und Wand
getrennt wählbar. Andere Formate als 60 × 120 cm werden ausdrücklich als
Formatwunsch übergeben. Die Vorschau zeigt Kreuzfugen mit 3 mm Breite.
Wandhöhe, Format und Fugenfarbe werden pro Position in den Anfragekorb und den
Anfragetext übernommen. Die geflieste Wandfläche einschließlich Dusche wird
manuell eingetragen; gestrichene Flächen werden nicht automatisch berechnet.
Flächen und Verschnitt lassen sich getrennt angeben. Die alten Filme bleiben erhalten.

## Separater 3D-Versuch

- `bad-3d/scene.js`: modellierter Raum, PBR-Materialien, getrennte Boden-/Wandmeshes,
  Spiegel und eine Kamerafahrt für alle Kombinationen. Keine Kombinationsvideos.
- `bad-3d/studio.js`: drei Entwürfe, freie Kombinationen, Fugen/Format, Flächen und
  Übergabe in den gemeinsamen Anfragekorb. Im Stillstand wird nur bei Änderungen gerendert.
- `js/shop-core.js`: gemeinsame Produktdaten, Mengenberechnung und Warenkorb.
- `katalog.html`, `katalog.css`, `js/katalog.js`: Anfrage-Shop ohne Animation und
  ohne Checkout, Produktdetails, Suche/Filter, Warenkorb und Anfrageexport.
- `vendor/three/`: lokal gespeichertes Three.js 0.180.0 mit MIT-Lizenz.
- `tests/shop-core.test.cjs`: Mengen-, Warenkorb- und Richtpreisprüfungen.

60 × 120 cm ist das belegte Katalogformat. 60 × 60 und 120 × 120 cm sind ausdrücklich
Formatwünsche, keine bestätigten verfügbaren Yabis-Varianten.
Die Katalogbeträge (Erfassung 30.10.2026) sind als Richtpreise sichtbar: 39,90 €
für Habitat Perla, Bercy Terra und Bianco Mare, 44,90 € für Taj Mahal beige.
Die Preiseinheit ist nicht bestätigt. Nur nach ausdrücklicher Auswahl in der
Oberfläche wird eine Kostenschätzung unter der Annahme €/m² gerechnet; sie gilt
ausschließlich für das Katalogformat, ohne Kartonrundung und Lieferung.

## Badstudio mit Original-Kamerafahrt

- `konfigurator-neu/kamerafahrt.html` und `bad.css`: bisherige Oberfläche und Anfrageformular.
- `konfigurator-neu/bad-film.js`: Auswahl, Kamera, Mengenberechnung, Speicherung
  im Browser sowie Bildexport und Anfrageentwürfe.
- `konfigurator-neu/materialien.js`: vier Originalartikel aus dem Yabis-Katalog
  mit passenden Herstellermustern, belegtem Format 60 × 120 cm und direkten Produktlinks.
- `bilder/katalog/originale/`: unveränderte Originalfotos aus WhatsApp.
- `bilder/katalog/hersteller/`: saubere Muster von Prissmacer und Roca Tiles.
- `_quelle/yabis-auswahl-2026-11-12.json`: Quellen, Formate und offene Produktangaben.
- `_quelle/yabis-herstellerbilder-2026-11-12.json`: Herstellerseiten, Bildquellen und Zuschnitt.
- `konfigurator-neu/fugen-live.js`: Flächenmasken, aus gemessenen Fugen abgeleitete
  Bodenperspektive pro Bild, lineare Lichtübertragung und geschätzte, vom Finish
  abhängige Reflexe. Wände werden im Querformat verlegt. Helle Materialien erhalten
  eine weiche Begrenzung der Lichter, damit die Zeichnung sichtbar bleibt.
- `konfigurator-neu/source-joints.js`: gemessene Originalfugen der Kamerafahrt.
- `konfigurator-neu/assets/`: lokale Filme, Raumbilder und Materialmuster.

`katalog.html`, `katalog.css` und `js/katalog.js` enthalten den zusätzlichen
Produktkatalog. Der ältere Raum-Prototyp liegt im Projektstamm unter `raum-prototyp.html`,
`style.css` und `js/`.

## Grenzen des Prototyps

Die aktuelle lokale Auswahl enthält Habitat Perla, Bercy Terra, Taj Mahal beige
und Bianco Mare. Alle vier stammen aus dem Yabis-WhatsApp-Katalog und sind auch
im separaten Produktkatalog auswählbar. Keine ausdrückliche Topseller-Markierung
wurde gefunden. Bei Bianco Mare widersprechen sich Gruppe (Lappato) und
Beschreibung (poliert); die Oberfläche muss bestätigt werden.

Die aktive Raumansicht kombiniert mit KI erzeugte Materialbilder anhand der
Herstellermuster. Die Yabis-Ausstellungsfotos und Herstellerbilder bleiben
unverändert zum Vergleichen erhalten. Die KI-Bilder sind illustrative Entwürfe:
Zeichnung, Farbton, Fugen, Reflexe und Details können vom echten Produkt abweichen.
Die vier Ansichten sind weitgehend deckungsgleich; leichte Unterschiede an
Kanten bleiben möglich. Die Vorschau ist nicht farb- oder musterbindend.
In der archivierten Kamerafahrt werden weiterhin Herstellermuster projiziert;
die aktive Bildvorschau lädt weder diese Projektion noch Videos.
Verfügbarkeit, Eignung für Boden, Wand und Nassbereiche,
Verpackungseinheiten, Mengen und Preise müssen im Angebot bestätigt werden.
Die Vorschau ersetzt kein Aufmaß und keine Verlegeplanung.

Die aktuelle Vorführung wird über GitHub Pages aus diesem Repository bereitgestellt.

Es gibt keinen Checkout und keine Online-Bezahlung. Benötigte Produkt- und
Materialdaten sind in `ANFRAGE-YABIS.md` beschrieben. Die unter `_quelle/`
gesammelten Katalogdaten sind unvollständig.

Prüfungen: `node --test --test-isolation=none tests/material-motion.test.cjs tests/shop-core.test.cjs tests/tile-grid.test.cjs tests/standbild.test.cjs`.
Die Startseite `index.html` führt zum neuen Anfrage-Shop.

## Entwicklungsdateien

Die Skripte unter `_dev/` und `_quelle/` unterstützen die Aufbereitung von
Filmen, Fugenmessungen, Materialmustern und Raumdaten. Die fertigen Laufzeitmedien
sind bereits enthalten. Für erneute Medienaufbereitung wird FFmpeg benötigt.
Temporäre Renderdateien, lokale Zugangsdaten und Prüfscreenshots werden nicht
versioniert. `robots.txt` und die Seiten enthalten Ausschlüsse für Suchmaschinen.
