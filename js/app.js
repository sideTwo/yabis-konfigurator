// Ablauf: Haus -> Bereich wählen -> Flug in den Raum -> Muster live auf die Flächen -> Merkliste -> Anfrage.
(function () {
  const { W, H, RAEUME, FLUEGE, BEREICHE, PRODUKTE, FUGEN, VERBAENDE, TELEFON, MAIL } = window.YK;
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, ...kinder) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) k.startsWith("on") ? e.addEventListener(k.slice(2), v) : v !== false && e.setAttribute(k, v === true ? "" : v);
    for (const k of kinder.flat()) if (k != null) e.append(k);
    return e;
  };
  const speicher = { lies(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, schreib(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  const buehne = $(".buehne"), bildLw = $(".buehne__bild"), flLw = $(".buehne__flaechen");
  const steuerung = $(".steuerung"), stellen = $(".stellen"), nav = $(".bereiche");
  const flaechen = Flaechen(flLw, { W, H });
  const flug = Flug(bildLw, { W, H, FLUEGE });

  // Raumbilder einmal laden (SVG-Platzhalter oder später die ChatGPT-Bilder)
  const bilder = new Map();
  const raumBild = (id) => {
    if (!bilder.has(id)) bilder.set(id, new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = RAEUME[id].bild; }));
    return bilder.get(id);
  };
  // Zielpunkt im Bild für den Platzhalter-Flug: von außen auf die Klickstelle, innen Richtung Raummitte
  const fokus = (von, nach) => {
    const s = RAEUME.haus.stellen.find((x) => x.ziel === nach);
    if (von === "haus" && s) return [s.x / 100, s.y / 100];
    if (nach === "haus") return [0.5, 0.5];
    return [0.5, 0.55];
  };

  // ---------- Zustand ----------
  const auswahl = speicher.lies("yk-auswahl", {});  // raum -> flaeche -> { produkt, format, verband, fuge }
  let merkliste = speicher.lies("yk-merkliste", []);
  let ort = "haus", aktiveFlaeche = null, unterwegs = false;

  function standard(raum, fl) {
    const r = RAEUME[raum];
    const p = PRODUKTE.find((x) => x.bereiche[0] === r.bereich) || PRODUKTE.find((x) => x.bereiche.includes(r.bereich));
    const fuge = FUGEN.find((f) => f.id === p.fuge) || null;
    return { produkt: p.id, format: p.formate[0], verband: p.verbaende[0], fuge: fuge ? fuge.id : null, flaeche: fl };
  }
  const wahl = (raum, fl) => {
    auswahl[raum] ??= {};
    auswahl[raum][fl] ??= standard(raum, fl);
    return auswahl[raum][fl];
  };
  const fuerEngine = (raum) => {
    const r = RAEUME[raum], out = {};
    for (const f of r.flaechen || []) {
      const w = wahl(raum, f.id), p = PRODUKTE.find((x) => x.id === w.produkt);
      out[f.id] = { produkt: p, format: w.format, verband: VERBAENDE[w.verband], fuge: p.fuge === "keine" ? null : FUGEN.find((x) => x.id === w.fuge) };
    }
    return out;
  };

  // ---------- Leinwände ----------
  function groesse() {
    const r = buehne.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    for (const lw of [bildLw, flLw]) { lw.width = Math.round(r.width * d); lw.height = Math.round(r.height * d); }
  }
  async function zeigeStill() {
    flug.male(await raumBild(ort));
    if (ort !== "haus") await flaechen.zeichne(fuerEngine(ort)); else await flaechen.zeichne({});
  }
  addEventListener("resize", () => { groesse(); zeigeStill(); });

  // ---------- Navigation ----------
  function navZeichnen() {
    nav.replaceChildren(...BEREICHE.map((b) => el("button", { type: "button", "aria-current": String(b.raum === ort), onclick: () => gehe(b.raum) }, b.name)));
  }
  async function gehe(ziel) {
    if (unterwegs || ziel === ort) return;
    unterwegs = true;
    buehne.classList.add("fliegt");
    await flaechen.zeichne({});
    stellen.replaceChildren();
    await flug.fliege(ort, ziel, raumBild, fokus);
    ort = ziel;
    if (ort !== "haus") await flaechen.setzeRaum(RAEUME[ort]);
    aktiveFlaeche = ort === "haus" ? null : RAEUME[ort].flaechen[0].id;
    buehne.classList.remove("fliegt");
    unterwegs = false;
    history.replaceState(null, "", "#" + ort);
    aufbauen();
    await zeigeStill();
  }

  // ---------- Oberfläche ----------
  function kopfText() {
    const b = BEREICHE.find((x) => x.raum === ort);
    $("[data-raum]").textContent = RAEUME[ort].titel;
    $("[data-bereich]").textContent = ort === "haus" ? "Wählen Sie einen Bereich" : { aussen: "Außenfliesen", innen: "Innenfliesen", bad: "Badfliesen", vinyl: "Vinylboden" }[RAEUME[ort].bereich];
    return b;
  }
  const vorschauStil = (p) => p.textur.startsWith("holz:")
    ? `background: repeating-linear-gradient(90deg, ${p.textur.split(":")[1]} 0 18px, ${p.textur.split(":")[2]} 18px 19px)`
    : `background-image: url("${p.textur}")`;

  function aufbauen() {
    navZeichnen(); kopfText();
    if (ort === "haus") {
      stellen.replaceChildren(...RAEUME.haus.stellen.map((s) =>
        el("button", { class: "stelle", type: "button", style: `left:${s.x}%;top:${s.y}%`, "aria-label": `${s.text}: ${s.unter}`, onclick: () => gehe(s.ziel) }, el("i"), el("span", {}, el("b", {}, s.text), el("small", {}, s.unter)))));
      steuerung.replaceChildren(
        el("p", { class: "start__kopf" }, "Wo sollen die neuen Fliesen hin? Tippen Sie auf das Haus oder hier:"),
        el("div", { class: "start" }, RAEUME.haus.stellen.map((s) => el("button", { type: "button", onclick: () => gehe(s.ziel) }, el("b", {}, s.text), el("small", {}, s.unter)))));
      return;
    }
    stellen.replaceChildren();
    const r = RAEUME[ort], w = wahl(ort, aktiveFlaeche), p = PRODUKTE.find((x) => x.id === w.produkt);
    const neu = async (aenderung) => { Object.assign(w, aenderung); speicher.schreib("yk-auswahl", auswahl); aufbauen(); await flaechen.zeichne(fuerEngine(ort)); };
    const chips = (titel, liste) => el("div", { class: "gruppe" }, el("span", {}, titel), liste);

    const zeile = el("div", { class: "zeile" },
      r.flaechen.length > 1 ? chips("Fläche", r.flaechen.map((f) => el("button", { class: "chip", type: "button", "aria-pressed": String(f.id === aktiveFlaeche), onclick: () => { aktiveFlaeche = f.id; aufbauen(); } }, f.name))) : null,
      chips("Format", p.formate.map((f) => el("button", { class: "chip", type: "button", "aria-pressed": String(f[0] === w.format[0] && f[1] === w.format[1]), onclick: () => neu({ format: f }) }, `${f[0]} × ${f[1]}`))),
      p.verbaende.length > 1 ? chips("Verband", p.verbaende.map((v) => el("button", { class: "chip", type: "button", "aria-pressed": String(v === w.verband), onclick: () => neu({ verband: v }) }, VERBAENDE[v].name))) : null,
      p.fuge !== "keine" ? chips("Fuge", FUGEN.map((f) => el("button", { class: "fuge", type: "button", style: `background:${f.farbe}`, title: f.name, "aria-label": "Fuge " + f.name, "aria-pressed": String(f.id === w.fuge), onclick: () => neu({ fuge: f.id }) }))) : null);

    const muster = el("div", { class: "muster", role: "list" }, PRODUKTE.filter((x) => x.bereiche.includes(r.bereich)).map((x) =>
      el("button", { class: "karte", type: "button", role: "listitem", "aria-pressed": String(x.id === w.produkt), onclick: () => {
        const fuge = FUGEN.find((f) => f.id === x.fuge);
        neu({ produkt: x.id, format: x.formate.find((f) => f[0] === w.format[0] && f[1] === w.format[1]) || x.formate[0], verband: x.verbaende.includes(w.verband) ? w.verband : x.verbaende[0], fuge: fuge ? fuge.id : null });
      } }, el("span", { class: "vorschau", style: vorschauStil(x) }), el("b", {}, x.name), el("small", {}, x.platzhalter ? `${x.oberflaeche} · Platzhalter` : x.oberflaeche))));

    const flName = r.flaechen.find((f) => f.id === aktiveFlaeche).name;
    const unten = el("div", { class: "unten" },
      el("p", { class: "klein" }, `${p.name}, ${w.format[0]} × ${w.format[1]} cm, ${VERBAENDE[w.verband].name} – ${flName}, ${r.titel}`),
      el("button", { class: "knopf knopf--kupfer", type: "button", onclick: (e) => merken(e.currentTarget) }, "Auf die Merkliste"));
    steuerung.replaceChildren(zeile, muster, unten);
  }

  // ---------- Merkliste ----------
  const liste = $(".merkliste"), listeOl = $(".merkliste__liste");
  function merken(knopf) {
    const r = RAEUME[ort], w = wahl(ort, aktiveFlaeche), p = PRODUKTE.find((x) => x.id === w.produkt);
    const m2 = Math.max(1, Math.round(flaechen.flaecheM2(aktiveFlaeche) * 10) / 10);
    merkliste.push({ raum: r.titel, flaeche: r.flaechen.find((f) => f.id === aktiveFlaeche).name, produkt: p.id, name: p.name, format: w.format, verband: VERBAENDE[w.verband].name, fuge: p.fuge === "keine" ? null : FUGEN.find((f) => f.id === w.fuge)?.name, m2 });
    speicher.schreib("yk-merkliste", merkliste);
    merkAnzahl();
    knopf.textContent = "Gemerkt ✓";
    setTimeout(() => { knopf.textContent = "Auf die Merkliste"; }, 1600);
  }
  function merkAnzahl() { $("[data-anzahl]").textContent = merkliste.length; }
  function listeZeichnen() {
    $(".merkliste__leer").hidden = merkliste.length > 0;
    listeOl.replaceChildren(...merkliste.map((m, i) => {
      const p = PRODUKTE.find((x) => x.id === m.produkt);
      const mitVerschnitt = () => Math.ceil(m.m2 * 1.1 * 10) / 10;
      const hinweis = el("small", {}, `mit 10 % Verschnitt: ${mitVerschnitt()} m²`);
      return el("li", { class: "posten" },
        el("span", { class: "vorschau", style: vorschauStil(p) }),
        el("b", {}, m.name),
        el("button", { class: "weg", type: "button", "aria-label": "Entfernen", onclick: () => { merkliste.splice(i, 1); speicher.schreib("yk-merkliste", merkliste); merkAnzahl(); listeZeichnen(); } }, "×"),
        el("small", {}, `${m.raum}, ${m.flaeche} · ${m.format[0]} × ${m.format[1]} cm · ${m.verband}${m.fuge ? " · Fuge " + m.fuge : ""}`),
        el("label", {}, "Fläche", el("input", { type: "number", min: "0.5", step: "0.5", value: m.m2, oninput: (e) => { m.m2 = +e.target.value || 0; hinweis.textContent = `mit 10 % Verschnitt: ${mitVerschnitt()} m²`; speicher.schreib("yk-merkliste", merkliste); } }), "m²"),
        hinweis);
    }));
  }
  $(".merk-knopf").addEventListener("click", () => { listeZeichnen(); liste.hidden = false; $(".schliessen").focus(); });
  $(".schliessen").addEventListener("click", () => { liste.hidden = true; });
  addEventListener("keydown", (e) => { if (e.key === "Escape") liste.hidden = true; });

  function anfrageText(f) {
    const zeilen = merkliste.map((m, i) => `${i + 1}. ${m.name}, ${m.format[0]}×${m.format[1]} cm, ${m.verband}${m.fuge ? ", Fuge " + m.fuge : ""} – ${m.raum}/${m.flaeche}: ${m.m2} m² (mit Verschnitt ${Math.ceil(m.m2 * 11) / 10} m²)`);
    const weg = f.get("weg") === "Lieferung" ? `Lieferung nach PLZ ${f.get("plz") || "?"}` : "Abholung im Laden";
    return `Hallo Yabi’s, ich hätte gern ein Angebot:\n\n${zeilen.join("\n")}\n\n${weg}\nName: ${f.get("name") || "-"}\nTelefon: ${f.get("tel") || "-"}\n\n(aus dem Konfigurator)`;
  }
  $(".anfrage").addEventListener("submit", (e) => {
    e.preventDefault();
    const fehler = $(".fehler");
    const f = new FormData(e.target);
    if (!merkliste.length) { fehler.textContent = "Die Merkliste ist noch leer."; fehler.hidden = false; return; }
    if (f.get("weg") === "Lieferung" && !/^\d{5}$/.test(f.get("plz") || "")) { fehler.textContent = "Bitte eine fünfstellige Postleitzahl für die Lieferung angeben."; fehler.hidden = false; return; }
    fehler.hidden = true;
    const text = anfrageText(f);
    if (e.submitter && e.submitter.value === "mail") location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Anfrage aus dem Konfigurator")}&body=${encodeURIComponent(text)}`;
    else open(`https://wa.me/${TELEFON}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
  $("[data-bild]").addEventListener("click", () => {
    const c = document.createElement("canvas"); c.width = bildLw.width; c.height = bildLw.height;
    const g = c.getContext("2d"); g.drawImage(bildLw, 0, 0); g.drawImage(flLw, 0, 0);
    const a = el("a", { href: c.toDataURL("image/jpeg", 0.9), download: `yabis-${ort}.jpg` }); a.click();
  });

  // ---------- Start ----------
  (async () => {
    groesse();
    const start = (location.hash || "#haus").slice(1);
    ort = RAEUME[start] ? start : "haus";
    if (ort !== "haus") { await flaechen.setzeRaum(RAEUME[ort]); aktiveFlaeche = RAEUME[ort].flaechen[0].id; }
    aufbauen(); merkAnzahl();
    await zeigeStill();
    document.documentElement.dataset.bereit = "1";
    // Raumbilder im Hintergrund vorladen
    Object.keys(RAEUME).forEach(raumBild);
  })();
})();
