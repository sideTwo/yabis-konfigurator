# Yabi’s Fliesenwelt – Konfigurator (Prototyp)

Haus → Bereich wählen (Außen, Innen, Bad, Vinyl) → Flug in den Raum → Muster live auf Boden und Wänden →
Merkliste mit m² → Anfrage per WhatsApp oder E-Mail. Kein Kauf per Klick, Yabi’s schreibt das Angebot.

Vorschau: https://bilal-altu.github.io/yabis-konfigurator/ (noindex)

## Aufbau
- `js/daten.js` – Räume (Flächen mit 4 Bildecken und Maßen in cm, Möbel-Aussparungen), Flüge (Raumgraph), Produkte
- `js/flaechen.js` – WebGL: Homografie Bild → Fläche, Fliesen in Format/Verband/Fuge, Licht aus dem Raumbild
- `js/flug.js` – kürzester Weg durchs Haus (Wohnzimmer ist Knoten), Clips vor/rückwärts, sonst Platzhalter-Zoom
- `js/app.js` – Oberfläche, Merkliste, Anfrage

## Echte Bilder einsetzen
1. ChatGPT-Bilder nach `ANLEITUNG-BILDER.md` als `bilder/raeume/<raum>.png` (1920 × 1080) ablegen,
   in `js/daten.js` die `bild`-Pfade umstellen und je Fläche die 4 Ecken messen (statt `kasten(...)`).
2. Kling-Clips als `bilder/kling/flug-<von>-<nach>.mp4` ablegen, `bash _quelle/flug-bilder.sh` ausführen,
   Bildzahlen bei `FLUEGE` eintragen.
3. Platzhalter-Bilder: `node _quelle/platzhalter.mjs`. Screenshots: `node _dev/schirm.mjs <png> <url> [b] [h] [handy] [js] [ms]`.

## Offen
Vinyl-Fotos (bis dahin erzeugte Platzhalter-Maserung), Produktdaten der ~500 Varianten, Preise, Pflege.
