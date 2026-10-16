// Daten des Konfigurators: Räume (mit Flächen in Bildkoordinaten), Flüge, Produkte.
// Bildformat aller Raum- und Flugbilder: 1920 x 1080.
// Solange die echten ChatGPT-Bilder fehlen, werden die Räume aus einem einfachen Perspektivmodell
// berechnet (kasten). Mit den echten Bildern werden die Ecken pro Fläche gemessen und hier eingetragen.
(function (global) {
  const W = 1920, H = 1080, VP = [960, 360], F = 1066; // Fluchtpunkt, Brennweite in px (~84° Bildwinkel)

  // Raum als Kasten: Breite b, Höhe h, Kamerahöhe ch (cm), Rückwand mit s px/cm.
  // Liefert Projektion und die vier Flächen (Ecken in Reihenfolge der Ebene: (0,0) (w,0) (w,h) (0,h)).
  function kasten({ b, h, ch, s }) {
    const zHinten = F / s;
    const sv = (H - VP[1]) / ch;                  // Maßstab an der Bildunterkante (vorderste sichtbare Bodenlinie)
    // Tiefe so weit nach vorn, dass Boden und Seitenwände bis an Bildunter- und Seitenrand reichen
    const zVorn = Math.min(F / sv, (b / 2) * F / (W / 2 + 60)) * 0.92, t = Math.round(zHinten - zVorn);
    // Weltpunkt: X quer ab linker Wand, Y Höhe ab Boden, Z Abstand von der Rückwand nach vorn
    const proj = (X, Y, Z) => { const z = zHinten - Z, k = F / z; return [VP[0] + (X - b / 2) * k, VP[1] + (ch - Y) * k]; };
    const q = (pts) => pts.map(([X, Y, Z]) => proj(X, Y, Z).map((n) => Math.round(n * 10) / 10));
    return {
      proj, b, h, t,
      boden: { groesse: [b, t], ecken: q([[0, 0, 0], [b, 0, 0], [b, 0, t], [0, 0, t]]) },
      rueck: { groesse: [b, h], ecken: q([[0, 0, 0], [b, 0, 0], [b, h, 0], [0, h, 0]]) },
      links: { groesse: [t, h], ecken: q([[0, 0, 0], [0, 0, t], [0, h, t], [0, h, 0]]) },
      rechts: { groesse: [t, h], ecken: q([[b, 0, 0], [b, 0, t], [b, h, t], [b, h, 0]]) },
    };
  }

  // Quader (Möbel) als Umriss im Bild: konvexe Hülle der 8 Ecken
  function huelle(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const kreuz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const unten = [], oben = [];
    for (const x of p) { while (unten.length >= 2 && kreuz(unten[unten.length - 2], unten[unten.length - 1], x) <= 0) unten.pop(); unten.push(x); }
    for (const x of p.reverse()) { while (oben.length >= 2 && kreuz(oben[oben.length - 2], oben[oben.length - 1], x) <= 0) oben.pop(); oben.push(x); }
    return unten.slice(0, -1).concat(oben.slice(0, -1));
  }
  const quader = (k, [x0, x1], [y0, y1], [z0, z1]) => huelle(
    [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]].map(([x, y, z]) => k.proj(x, y, z)));

  const bad = kasten({ b: 260, h: 250, ch: 150, s: 2.7 });
  const wohnen = kasten({ b: 500, h: 270, ch: 155, s: 1.95 });
  const schlafen = kasten({ b: 400, h: 260, ch: 150, s: 2.3 });
  const terrasse = kasten({ b: 560, h: 280, ch: 160, s: 1.75 });

  const RAEUME = {
    haus: {
      titel: "Ihr Haus", bild: "bilder/raeume/haus.svg",
      // Klickstellen in Prozent der Bühne
      stellen: [
        { ziel: "terrasse", x: 23, y: 81, text: "Außenfliesen", unter: "Terrasse und Balkon" },
        { ziel: "wohnzimmer", x: 44, y: 61, text: "Innenfliesen", unter: "Wohnraum, 60 × 120" },
        { ziel: "bad", x: 73, y: 62, text: "Badfliesen", unter: "Wand und Boden" },
        { ziel: "schlafzimmer", x: 44, y: 27, text: "Vinylboden", unter: "Schlafzimmer" },
      ],
    },
    terrasse: {
      titel: "Terrasse", bereich: "aussen", bild: "bilder/raeume/terrasse.svg", k: terrasse,
      flaechen: [{ id: "boden", name: "Terrassenboden", quads: [terrasse.boden] }],
      verdeckt: [{ flaeche: "boden", umriss: quader(terrasse, [430, 540], [0, 45], [0, 40]) }],
    },
    wohnzimmer: {
      titel: "Wohnzimmer", bereich: "innen", bild: "bilder/raeume/wohnzimmer.svg", k: wohnen,
      flaechen: [{ id: "boden", name: "Boden", quads: [wohnen.boden] }],
      verdeckt: [{ flaeche: "boden", umriss: quader(wohnen, [400, 495], [0, 42], [40, 230]) }],
    },
    bad: {
      titel: "Bad", bereich: "bad", bild: "bilder/raeume/bad.svg", k: bad,
      flaechen: [
        { id: "wand", name: "Wand", quads: [bad.rueck, bad.links, bad.rechts] },
        { id: "boden", name: "Boden", quads: [bad.boden] },
      ],
      verdeckt: [
        { flaeche: "wand", umriss: quader(bad, [75, 185], [72, 118], [0, 46]) },     // Waschtisch
        { flaeche: "wand", umriss: quader(bad, [88, 172], [128, 205], [0, 2]) },     // Spiegel
        { flaeche: "wand", umriss: quader(bad, [0, 38], [36, 78], [70, 125]) },      // WC
        { flaeche: "boden", umriss: quader(bad, [0, 38], [36, 78], [70, 125]) },
        { flaeche: "wand", umriss: quader(bad, [0, 1], [150, 215], [20, 60]) },        // Fenster
      ],
    },
    schlafzimmer: {
      titel: "Schlafzimmer", bereich: "vinyl", bild: "bilder/raeume/schlafzimmer.svg", k: schlafen,
      flaechen: [{ id: "boden", name: "Boden", quads: [schlafen.boden] }],
      verdeckt: [{ flaeche: "boden", umriss: quader(schlafen, [110, 290], [0, 48], [0, 205]) }],
    },
  };

  // Flüge: Kanten des Hauses. Gewicht 3 für Flüge von außen, damit innen der Weg durchs Wohnzimmer gewinnt.
  // bilder: Anzahl Einzelbilder in bilder/fluege/<name>/000.webp … (0 = noch kein Kling-Clip, Platzhalter-Übergang)
  const FLUEGE = [
    { von: "haus", nach: "terrasse", gewicht: 3, bilder: 0 },
    { von: "haus", nach: "wohnzimmer", gewicht: 3, bilder: 0 },
    { von: "haus", nach: "bad", gewicht: 3, bilder: 0 },
    { von: "haus", nach: "schlafzimmer", gewicht: 3, bilder: 0 },
    { von: "wohnzimmer", nach: "terrasse", gewicht: 1, bilder: 0 },
    { von: "wohnzimmer", nach: "bad", gewicht: 1, bilder: 0 },
    { von: "wohnzimmer", nach: "schlafzimmer", gewicht: 1, bilder: 0 },
  ];

  const BEREICHE = [
    { id: "haus", name: "Haus", raum: "haus" },
    { id: "aussen", name: "Außen", raum: "terrasse" },
    { id: "innen", name: "Innen", raum: "wohnzimmer" },
    { id: "bad", name: "Bad", raum: "bad" },
    { id: "vinyl", name: "Vinyl", raum: "schlafzimmer" },
  ];

  // Beispielmuster. Texturen aus Fotos der Ausstellung; Vinyl ist ein erzeugter Platzhalter.
  const FUGEN = [{ id: "hell", name: "Hell", farbe: "#D8D4CC" }, { id: "grau", name: "Grau", farbe: "#8E8A83" }, { id: "anthrazit", name: "Anthrazit", farbe: "#3A3C40" }];
  const VERBAENDE = {
    kreuz: { name: "Kreuzfuge", versatz: 0 },
    halb: { name: "Halbverband", versatz: 0.5 },
    drittel: { name: "Drittelverband", versatz: 1 / 3 },
    wild: { name: "Wilder Verband", versatz: -1 },
  };
  const PRODUKTE = [
    { id: "marmor-hell", name: "Marmoroptik hell", bereiche: ["innen", "bad"], textur: "bilder/muster/marmor-hell.webp", oberflaeche: "Matt", glanz: 0.1, formate: [[60, 120], [120, 120], [60, 60]], verbaende: ["kreuz", "halb", "drittel"], fuge: "hell" },
    { id: "stein-grau", name: "Steinoptik grau", bereiche: ["innen", "bad", "aussen"], textur: "bilder/muster/stein-grau.webp", oberflaeche: "Matt", glanz: 0, formate: [[60, 120], [60, 60], [120, 120]], verbaende: ["kreuz", "halb", "drittel"], fuge: "grau" },
    { id: "beton-dunkel", name: "Betonoptik dunkel", bereiche: ["innen", "bad"], textur: "bilder/muster/beton-dunkel.webp", oberflaeche: "Matt", glanz: 0.05, formate: [[60, 120], [120, 120], [60, 60]], verbaende: ["kreuz", "halb"], fuge: "anthrazit" },
    { id: "terrasse-schiefer", name: "Terrassenplatte Schieferoptik", bereiche: ["aussen"], textur: "bilder/muster/terrasse-schiefer.webp", oberflaeche: "Rau, außen", glanz: 0, formate: [[60, 60], [40, 80], [60, 120]], verbaende: ["kreuz", "halb"], fuge: "grau" },
    { id: "vinyl-eiche-hell", name: "Vinyl Eiche hell", platzhalter: true, bereiche: ["vinyl"], textur: "holz:#CDB38F:#A98A62", oberflaeche: "Planke", glanz: 0.05, formate: [[20, 120], [23, 150]], verbaende: ["wild"], fuge: "keine" },
    { id: "vinyl-eiche-natur", name: "Vinyl Eiche natur", platzhalter: true, bereiche: ["vinyl"], textur: "holz:#B48A5E:#8A6440", oberflaeche: "Planke", glanz: 0.05, formate: [[20, 120], [23, 150]], verbaende: ["wild"], fuge: "keine" },
    { id: "vinyl-eiche-grau", name: "Vinyl Eiche grau", platzhalter: true, bereiche: ["vinyl"], textur: "holz:#A9A39A:#7E776D", oberflaeche: "Planke", glanz: 0.05, formate: [[20, 120], [23, 150]], verbaende: ["wild"], fuge: "keine" },
  ];

  global.YK = { W, H, RAEUME, FLUEGE, BEREICHE, PRODUKTE, FUGEN, VERBAENDE, TELEFON: "4915146353821", MAIL: "info@yabisfliesenwelt.de" };
})(typeof window !== "undefined" ? window : globalThis);
