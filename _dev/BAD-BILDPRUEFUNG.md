# Neue Badmaterialien vor der Freischaltung prüfen

Die feste Perspektive hat die Kalibrierung `bad-1672x941-v4`. Alle Badbilder
müssen **1672 × 941 Pixel** haben. Automatisches Strecken eines anderen Formats
ist verboten: Es verschiebt Fenster, Möbel und Flächenkanten. Die Studio-Seite
weist falsche Abmessungen deshalb ab.

## Bildvorgaben

Pro neuem Artikel zwei fotografische Materialansichten vorbereiten:

- `assets/studio/bad-<artikel-id>-120.webp`: Wand bis 1,20 m, Dusche raumhoch;
  obere Wand neutral weiß. Der Boden wird immer aus dieser Ansicht genommen.
- `assets/studio/bad-<artikel-id>-full.webp`: Wand raumhoch.

Beide Bilder auf die vorhandene Vorlage ausrichten. Kamera, Objektpositionen,
Raumkanten und Licht unverändert lassen. Keine eingebrannten Fugen; diese
kommen aus `tile-grid.js`. Grundbild und korrigierten Waschtisch nicht für
jeden Artikel neu erzeugen. Originale und Prompts bleiben im privaten Material.

`standbild-renderer.js` enthält die einzige gemeinsame Beschreibung der
Materialflächen und Schutzmasken. Der Fugenrenderer liest dieselben Flächen.
Keine zusätzliche Koordinatenliste pro Produkt anlegen.

## Wiederholbare Pixelprüfung

Nur für die Entwicklung wird `@napi-rs/canvas` benötigt, nicht für die Website.
Ein vorhandenes Paket lässt sich über `YABIS_CANVAS_PACKAGE` angeben. Keine
Abhängigkeit und kein KI-Dienst werden im Kundenbrowser geladen.

Im Repository:

```text
node _dev/audit-bath.cjs _dev/schirm/bad-audit habitat-perla,neuer-artikel
```

Der neue Artikel muss dafür noch nicht in der aktiven Studio-Auswahl stehen.
So werden nur der neue Artikel und die Referenz geprüft: acht Raumkombinationen
statt aller Paare eines großen Sortiments. Bestehende Bilder bleiben erhalten.

Ohne Materialliste wird die aktive Studio-Auswahl geprüft. Bis vier Materialien
werden alle Paare gerendert; größere Sortimente werden linear gegen eine
Referenz und jeweils mit sich selbst geprüft. Der Bericht nennt die Methode.

Die Prüfung erzeugt echte Pixel mit dem Produktionscode und kontrolliert:

- Bildabmessungen und Referenzpunkte an Wand, Boden, Fenster und Duschkanten;
- alle drei Formate und vier Fugenfarben in beiden Wandhöhen;
- Fugen außerhalb der Flächen oder über geschützten Bauteilen;
- voneinander unabhängige Wand- und Bodenwahl;
- unveränderte Fenster, Keramik und Waschtisch in den Materialkombinationen.

`report.json` muss `passed: true` enthalten. Die Kontaktübersicht und Detailbilder
zusätzlich ansehen: korrekte Pixelmaße allein beweisen keine perspektivische
Übereinstimmung oder wirklichkeitsgetreue Produktfarbe. Danach PC-Vollbild und
iPhone/Safari prüfen. Native Canvas-Bilder sind keine Browser-Screenshots.

Mit gesetztem `YABIS_CANVAS_PACKAGE` gehört die Pixelprüfung auch zur Testsuite;
ohne das Entwicklungspaket wird nur dieser eine Test ausdrücklich übersprungen.
