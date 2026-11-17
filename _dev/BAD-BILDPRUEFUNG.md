# Neue Badmaterialien vor der Freischaltung prüfen

Die feste Perspektive hat die Kalibrierung `bad-og-1672x941-v9`. Alle Badbilder
müssen **1672 × 941 Pixel** haben. Automatisches Strecken eines anderen Formats
ist verboten: Es verschiebt Fenster, Möbel und Flächenkanten. Die Studio-Seite
weist falsche Abmessungen deshalb ab.

## Bildvorgaben

Pro neuem Artikel genügt **eine** fotografische, fugenlose Materialansicht:

- `assets/studio/bad-og-<artikel-id>.webp`: Boden und alle Wandflächen raumhoch.
  Beide Wandhöhen benutzen dieselbe Platte; der Renderer übernimmt bei 1,20 m
  die weißen oberen Wände und das Abschlussprofil aus der festen Basis.
- `bad-og-basis-glas.webp`: feste Raumelemente, Fenster/Ausblick und weiße obere Wände.
- `bad-og-vorschau-glas.webp`: aus Produktionsrenderer und Standardauswahl erzeugtes
  Vorschaubild, auch für Startseite, Ladezustand und Raumübergang.

Jede Materialansicht auf die vorhandene Vorlage ausrichten. Kamera, Objektpositionen,
Raumkanten und Licht unverändert lassen. Keine eingebrannten Fugen; diese
kommen aus `tile-grid.js`. Grundbild und feste Raumausstattung nicht für
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
- alle drei Formate und vier Fugenfarben in beiden Wandhöhen; zusätzlich 48
  Einzelwechsel, bei denen die jeweils andere Fläche exakt unverändert bleibt;
- Fugen außerhalb der Flächen oder über geschützten Bauteilen;
- voneinander unabhängige Wand- und Bodenwahl;
- unveränderte Fenster, Keramik und Waschtisch in den Materialkombinationen.

`report.json` muss `passed: true` enthalten. Die Kontaktübersicht und Detailbilder
zusätzlich ansehen: korrekte Pixelmaße allein beweisen keine perspektivische
Übereinstimmung oder wirklichkeitsgetreue Produktfarbe. Danach PC-Vollbild und
iPhone/Safari prüfen. Native Canvas-Bilder sind keine Browser-Screenshots.

Mit gesetztem `YABIS_CANVAS_PACKAGE` gehört die Pixelprüfung auch zur Testsuite;
ohne das Entwicklungspaket wird nur dieser eine Test ausdrücklich übersprungen.

Die neue Brüstung unter dem Fenster und die Wand unter seiner Glasreflexion
gehören zu den konfigurierbaren Flächen. Fensterrahmen, Glas und Fensterbank
sind feste Bauteile. Exakte RGB-Unabhängigkeitsvergleiche lassen einen Pixel
Rand für Antialiasing aus; Referenzpunkte und Fugen-Leckprüfung benutzen die
ursprünglichen Masken einschließlich ihrer Ränder.

Das metrische Wandraster wird am gemeinsamen Bodenraster sowie den drei
Bildlinien Boden / 1,20-m-Abschluss / Decke kalibriert. Gleiche Welt-Höhen
setzen sich um die Ecken fort; Anschnitte an der Decke sind relativ zur
Raumhöhe gleich. Die KI-Raumvorlage ist kein vermessener Bestandsraum.

Bei 1,20 m endet die raumhohe Duschverfliesung an der äußeren linken
Glaskante (x = 925). Der Streifen zwischen Fenster und Glas ist oberhalb
der Abschlusslinie weiß gestrichen; unterhalb bleibt er konfigurierbar.
Bei raumhoher Wandwahl wird auch dieser Streifen vollständig gefliest.
Die weiße Fläche stammt aus der neuen Glas-Basis, nicht aus einem festen
grauen Fliesenstreifen. Rahmen, Fensterbank und Glas bleiben feste Bauteile.

Die Vorschau ist visuell auf 2,40 m Raumhöhe normalisiert: zwei vollständige
120-cm-Reihen oder vier 60-cm-Reihen bis zur Decke. Das ist eine gemeinsame
Gestaltungshöhe des Beispielraums, kein Aufmaß eines echten Kundenbads.

Materialbilder zusätzlich auf verschobene Deckenränder prüfen: Die beiden
Pilotaufnahmen haben leicht andere obere Wandkonturen als die feste Basis.
`bathRegistration` enthält ihre Quell-Deckenlinien. Der Renderer gleicht nur
diesen schmalen Texturbereich an die Ziel-Decke an; Fliesenraster, Kamera,
Objektmasken und übrige Fotografie bleiben erhalten. Der native Audit prüft
sechs echte Terracotta-Farbpixel an der zuvor weiß gebliebenen Deckenkante.
