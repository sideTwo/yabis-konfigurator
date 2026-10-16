# Bilder und Flüge für den Yabi’s-Konfigurator

Du brauchst **5 Standbilder (ChatGPT)** und **7 Flüge (Kling)**. Alles im Querformat **16:9**.
Fertige Dateien bitte genau so benennen und in `yabis-konfigurator/bilder/kling/` legen.

---

## Teil 1 – Fünf Standbilder in ChatGPT

**Wichtig für alle Raumbilder:** Die Flächen, auf die später Fliesen oder Vinyl kommen, müssen
**glatt, matt und hellgrau** sein, ohne Fliesen, ohne Fugen und ohne Muster. Nur so kann der
Konfigurator die echten Muster darauflegen. Keine Teppiche auf dem Boden, keine Menschen, kein Text.

Tipp: Erst das Haus erzeugen, dann bei jedem Raum dazuschreiben:
„Same house and architectural style as the previous image.“ So passen die Bilder zusammen.

### `haus.png` – das Haus von außen (Startbild)
```
Photorealistic architectural photograph, 16:9. Three-quarter view from the back garden of a modern
two-storey German detached house with white rendered facade, dark grey window frames and a flat roof.
Ground floor: large floor-to-ceiling sliding glass doors into the living room, opening onto a wide
terrace directly in front of them; to the right of the living room a smaller bathroom window with
frosted glass. Upper floor: a large bedroom window above the living room. Neat lawn, a few shrubs,
soft overcast daylight, calm and premium mood. Camera at 1.7 m height, 24 mm lens, straight verticals.
No people, no text, no logos.
```

### `terrasse.png` – Außenfliesen
```
Photorealistic architectural photograph, 16:9, same house as before. Eye-level view standing on the
terrace behind the house, looking along the terrace towards the garden. The terrace floor is a large,
smooth, matte, light grey surface without tiles, joints or texture, clearly visible across most of the
lower half of the image. On the left the white house wall with the sliding glass door, on the right the
lawn. Only one low outdoor bench at the far edge, nothing standing on the middle of the floor.
Soft overcast daylight with gentle shadows. Camera 1.6 m high, 20 mm lens, slightly looking down.
No people, no text.
```

### `wohnzimmer.png` – Innenfliesen 60×120
```
Photorealistic interior photograph, 16:9, same house as before. Bright open living room on the ground
floor. The floor is one continuous smooth matte light grey screed surface without tiles, joints or
texture, filling the lower third of the image; no rugs. Walls white plaster. On the left the large
sliding glass doors to the terrace, at the back a straight staircase going up to the upper floor, on the
right an open doorway into a hallway. A low sofa against the right wall and a small side table, nothing
in the middle of the floor. Soft daylight from the windows. Camera 1.6 m high, 20 mm lens, straight
verticals. No people, no text.
```

### `bad.png` – Badfliesen (Wand und Boden)
```
Photorealistic interior photograph, 16:9, same house as before. Modern bathroom seen from the doorway.
ALL walls and the floor are smooth, matte, light grey plaster without tiles, joints or texture.
Back wall: wall-hung floating vanity with a white basin and a large mirror. Right: walk-in shower with a
frameless glass panel and a black rain shower. Left: wall-hung toilet. Small frosted window. Even soft
daylight, realistic soft shadows. Camera 1.6 m high, 18 mm lens, straight verticals, floor clearly
visible. No people, no towels on the floor, no text.
```

### `schlafzimmer.png` – Vinylboden
```
Photorealistic interior photograph, 16:9, same house as before. Calm bedroom on the upper floor.
The floor is one continuous smooth matte light grey surface without planks, joints or texture, filling
the lower third of the image; no rugs. White walls, a low upholstered bed against the back wall with
light linen, one bedside table, large window on the left with soft daylight. Nothing standing in the
middle of the floor. Camera 1.6 m high, 20 mm lens, straight verticals. No people, no text.
```

---

## Teil 2 – Sieben Flüge in Kling

Immer **Startbild + Endbild** setzen (Funktion „Start- und Endbild“), etwa **5 Sekunden**,
mindestens 1080p. Die Bilder genau so verwenden, wie sie aus Teil 1 kommen, nicht nachbearbeiten.

| Datei | Startbild | Endbild | Prompt |
|---|---|---|---|
| `flug-haus-terrasse.mp4` | haus.png | terrasse.png | Smooth cinematic drone shot gliding down from the garden onto the terrace, steady, no shake, ending exactly on the final frame. |
| `flug-haus-wohnzimmer.mp4` | haus.png | wohnzimmer.png | Smooth cinematic drone flight towards the house, through the open sliding glass doors into the living room, steady, ending exactly on the final frame. |
| `flug-haus-bad.mp4` | haus.png | bad.png | Smooth cinematic drone flight towards the bathroom window, passing through it into the bathroom, steady, ending exactly on the final frame. |
| `flug-haus-schlafzimmer.mp4` | haus.png | schlafzimmer.png | Smooth cinematic drone flight rising up to the upper floor bedroom window and gliding through it into the bedroom, steady, ending exactly on the final frame. |
| `flug-wohnzimmer-terrasse.mp4` | wohnzimmer.png | terrasse.png | Smooth steady camera move from the living room out through the open sliding doors onto the terrace, ending exactly on the final frame. |
| `flug-wohnzimmer-bad.mp4` | wohnzimmer.png | bad.png | Smooth steady camera move through the living room, into the hallway and through the bathroom door, ending exactly on the final frame. |
| `flug-wohnzimmer-schlafzimmer.mp4` | wohnzimmer.png | schlafzimmer.png | Smooth steady camera move up the staircase to the upper floor and into the bedroom, ending exactly on the final frame. |

Rückwege (zum Beispiel Bad → Wohnzimmer) brauchst du **nicht**, die spielt die Seite rückwärts ab.

Wenn ein Flug wackelt oder das Ende nicht genau trifft: einfach neu erzeugen. Ich kann kleine
Abweichungen am Ende ausgleichen, große nicht.

---

## Teil 3 – Was du bei Yabi’s erfragst

- **Vinyl:** 3–5 Fotos oder Herstellerbilder der Böden, flach von oben, möglichst groß
- **Produktdaten:** Export vom WhatsApp-Katalog oder Lieferantenlisten (Excel/CSV)
- **Fliesen:** Bilder der Serien in „Matt 60x120“ und „Lappato 60x120“, am besten Herstellerbilder
- Wer pflegt das später, Preise sichtbar ja/nein, womit schreiben sie Angebote
