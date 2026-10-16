// Flüge durchs Haus: kürzester Weg über den Raumgraphen, Clips als Bildfolgen vor- und rückwärts.
// Fehlt ein Clip noch (bilder: 0), läuft ein ruhiger Zoom-Übergang als Platzhalter.
(function (global) {
  const FPS = 30;
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const bildLaden = (src) => new Promise((ok) => { const i = new Image(); i.decoding = "async"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  function Flug(leinwand, { W, H, FLUEGE }) {
    const g = leinwand.getContext("2d");
    const folgen = new Map(); // Name -> Promise<Image[]>

    function weg(von, nach) { // Dijkstra auf wenigen Knoten
      const kanten = FLUEGE.flatMap((f) => [{ ...f, a: f.von, b: f.nach, rueck: false }, { ...f, a: f.nach, b: f.von, rueck: true }]);
      const dist = { [von]: 0 }, vor = {}, offen = new Set([von]);
      while (offen.size) {
        const k = [...offen].reduce((m, x) => (dist[x] < dist[m] ? x : m));
        offen.delete(k);
        if (k === nach) break;
        for (const e of kanten.filter((e) => e.a === k)) {
          const d = dist[k] + e.gewicht;
          if (dist[e.b] === undefined || d < dist[e.b]) { dist[e.b] = d; vor[e.b] = e; offen.add(e.b); }
        }
      }
      const pfad = []; for (let k = nach; k !== von; k = vor[k].a) { if (!vor[k]) return []; pfad.unshift(vor[k]); }
      return pfad;
    }
    const name = (f) => `flug-${f.von}-${f.nach}`;
    function folge(f) {
      if (!f.bilder) return Promise.resolve(null);
      if (!folgen.has(name(f))) folgen.set(name(f), Promise.all(Array.from({ length: f.bilder }, (_, i) => bildLaden(`bilder/fluege/${name(f)}/${String(i).padStart(3, "0")}.webp`))));
      return folgen.get(name(f));
    }

    function male(img, zoom = 1, fx = 0.5, fy = 0.5, alpha = 1) {
      const s = leinwand.width / W;
      g.setTransform(s, 0, 0, s, 0, 0);
      g.globalAlpha = alpha;
      const w = W * zoom, h = H * zoom;
      g.drawImage(img, fx * W - fx * w, fy * H - fy * h, w, h);
      g.globalAlpha = 1;
    }

    async function clip(f, rueck) {
      const bilder = await folge(f);
      const n = bilder.length, start = performance.now(), dauer = (n / FPS) * 1000;
      return new Promise((ok) => {
        const schritt = (t) => {
          const k = Math.min(1, (t - start) / dauer);
          let i = Math.round(k * (n - 1)); if (rueck) i = n - 1 - i;
          let j = i; while (j > 0 && !bilder[j]) j--;
          if (bilder[j]) male(bilder[j]);
          k < 1 ? requestAnimationFrame(schritt) : ok();
        };
        requestAnimationFrame(schritt);
      });
    }

    // Platzhalter-Übergang: in Richtung des Ziels hineinzoomen, neues Bild zieht nach
    async function uebergang(altBild, neuBild, fokus = [0.5, 0.5]) {
      const dauer = 900, start = performance.now();
      const weich = (x) => x * x * (3 - 2 * x);
      return new Promise((ok) => {
        const schritt = (t) => {
          const k = Math.min(1, (t - start) / dauer);
          g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#ECEAE5"; g.fillRect(0, 0, leinwand.width, leinwand.height);
          if (k < 0.55) male(altBild, 1 + weich(k / 0.55) * 0.9, fokus[0], fokus[1], 1 - weich(Math.max(0, (k - 0.25) / 0.3)));
          if (k > 0.35) male(neuBild, 1.18 - weich((k - 0.35) / 0.65) * 0.18, 0.5, 0.5, weich(Math.min(1, (k - 0.35) / 0.4)));
          k < 1 ? requestAnimationFrame(schritt) : ok();
        };
        requestAnimationFrame(schritt);
      });
    }

    // Fliegt von -> nach; raumBild(id) liefert das Standbild eines Raums, fokus(id) den Zielpunkt im Haus
    async function fliege(von, nach, raumBild, fokus) {
      const pfad = weg(von, nach);
      for (const e of pfad) folge(e); // alles vorab laden
      for (const e of pfad) {
        if (e.bilder) await clip(e, e.rueck);
        else await uebergang(await raumBild(e.a), await raumBild(e.b), fokus(e.a, e.b));
      }
      male(await raumBild(nach));
      return pfad;
    }

    return { fliege, male, weg, pause };
  }
  global.Flug = Flug;
})(window);
