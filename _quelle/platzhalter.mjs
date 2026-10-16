// Platzhalter-Bilder (SVG, 1920 x 1080) für Haus und Räume, bis die ChatGPT-Bilder da sind.
// Gleiche Geometrie wie js/daten.js, damit die Flächen-Engine exakt passt.
//   node _quelle/platzhalter.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "../js/daten.js";

const ZIEL = join(dirname(fileURLToPath(import.meta.url)), "..", "bilder", "raeume");
mkdirSync(ZIEL, { recursive: true });
const { RAEUME, W, H } = globalThis.YK;
const p = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const poly = (pts, fill, extra = "") => `<polygon points="${p(pts)}" fill="${fill}" ${extra}/>`;
const NEUTRAL = "#BCBAB6", WEISS = "#EFEDE9";
const schild = `<text x="40" y="1048" font-family="Arial, sans-serif" font-size="22" fill="#00000055">Platzhalter – wird durch das ChatGPT-Bild ersetzt</text>`;

function svg(inhalt) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="licht-boden" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
<linearGradient id="licht-links" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient>
<linearGradient id="licht-rechts" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".04"/></linearGradient>
<radialGradient id="licht-rueck" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></radialGradient>
<linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D3DA"/><stop offset="1" stop-color="#E8ECEE"/></linearGradient>
<linearGradient id="rasen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7E9468"/><stop offset="1" stop-color="#5E7650"/></linearGradient>
<filter id="weich"><feGaussianBlur stdDeviation="14"/></filter>
</defs>${inhalt}${schild}</svg>`;
}

// Möbel als Quader mit drei sichtbaren Seiten
function moebel(k, [x0, x1], [y0, y1], [z0, z1], farben = ["#2B2D31", "#3A3D42", "#4B4F55"]) {
  const P = (x, y, z) => k.proj(x, y, z);
  const vorn = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
  const oben = [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)];
  const mitte = k.b / 2;
  const seite = x1 < mitte ? [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)] : [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)];
  const schatten = [P(x0 - 4, 0, z0), P(x1 + 4, 0, z0), P(x1 + 6, 0, z1 + 8), P(x0 - 6, 0, z1 + 8)];
  return poly(schatten, "#000", `opacity=".22" filter="url(#weich)"`) + poly(seite, farben[0]) + poly(oben, farben[2]) + poly(vorn, farben[1]);
}
function rahmen(k, ebene, [u0, u1], [v0, v1], fill, rand = "#3A3C40") {
  // Rechteck auf einer Wand: ebene "rueck" (u = X, v = Y), "links" (u = Z, v = Y)
  const P = (u, v) => ebene === "rueck" ? k.proj(u, v, 0) : ebene === "links" ? k.proj(0, v, u) : k.proj(k.b, v, u);
  return poly([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], fill, `stroke="${rand}" stroke-width="6"`);
}

function raum(k, { wand = NEUTRAL, boden = NEUTRAL, zusatz = "" }) {
  const decke = [k.rueck.ecken[3], k.rueck.ecken[2], k.rechts.ecken[2], k.links.ecken[2]];
  return poly(decke, "#F4F3F0") +
    poly(k.links.ecken, wand) + poly(k.links.ecken, "url(#licht-links)") +
    poly(k.rechts.ecken, wand) + poly(k.rechts.ecken, "url(#licht-rechts)") +
    poly(k.rueck.ecken, wand) + poly(k.rueck.ecken, "url(#licht-rueck)") +
    poly(k.boden.ecken, boden) + poly(k.boden.ecken, "url(#licht-boden)") + zusatz;
}

// Bad: alle Wände und Boden neutral
{
  const k = RAEUME.bad.k;
  const glas = poly([k.proj(k.b - 95, 0, 0), k.proj(k.b - 95, 0, 110), k.proj(k.b - 95, 205, 110), k.proj(k.b - 95, 205, 0)], "#DDEBEF", `opacity=".28" stroke="#9FB1B6" stroke-width="3"`);
  const brause = `<line x1="${k.proj(k.b - 40, 120, 0)[0]}" y1="${k.proj(k.b - 40, 120, 0)[1]}" x2="${k.proj(k.b - 40, 205, 0)[0]}" y2="${k.proj(k.b - 40, 205, 0)[1]}" stroke="#1E1F22" stroke-width="8"/>` +
    poly([k.proj(k.b - 62, 205, 0), k.proj(k.b - 18, 205, 0), k.proj(k.b - 18, 205, 30), k.proj(k.b - 62, 205, 30)], "#1E1F22");
  writeFileSync(join(ZIEL, "bad.svg"), svg(raum(k, {
    zusatz: rahmen(k, "rueck", [88, 172], [128, 205], "#D9E1E4", "#2A2C2F") +
      moebel(k, [75, 185], [72, 118], [0, 46], ["#1F2124", "#2B2E32", "#F4F3F0"]) +
      poly([k.proj(105, 118, 8), k.proj(155, 118, 8), k.proj(155, 118, 38), k.proj(105, 118, 38)], "#FFFFFF") +
      moebel(k, [0, 38], [36, 78], [70, 125], ["#E9E8E5", "#F7F6F4", "#FFFFFF"]) +
      rahmen(k, "links", [20, 60], [150, 215], "#E7EEF0") + brause + glas,
  })));
}
// Wohnzimmer: Wände weiß, Boden neutral; Fenster, Treppe, Sofa
{
  const k = RAEUME.wohnzimmer.k;
  const fenster = rahmen(k, "links", [10, 150], [0, 235], "#D7E3E8", "#3A3C40") + rahmen(k, "rueck", [60, 230], [0, 230], "#DCE6EA", "#3A3C40");
  let treppe = "";
  for (let i = 0; i < 9; i++) treppe += poly([k.proj(300 + i * 18, i * 22, 0), k.proj(318 + i * 18, i * 22, 0), k.proj(318 + i * 18, (i + 1) * 22, 0), k.proj(300 + i * 18, (i + 1) * 22, 0)], "#D6D3CD", `stroke="#B9B5AE" stroke-width="2"`);
  writeFileSync(join(ZIEL, "wohnzimmer.svg"), svg(raum(k, { wand: WEISS, zusatz: fenster + treppe + moebel(k, [400, 495], [0, 42], [40, 230], ["#6F6A63", "#8C867D", "#A49D93"]) })));
}
// Schlafzimmer: Bett an der Rückwand
{
  const k = RAEUME.schlafzimmer.k;
  writeFileSync(join(ZIEL, "schlafzimmer.svg"), svg(raum(k, {
    wand: WEISS, zusatz: rahmen(k, "links", [20, 160], [40, 230], "#D7E3E8") +
      moebel(k, [110, 290], [0, 48], [0, 205], ["#CFC8BC", "#E2DCD1", "#F2EEE7"]) +
      moebel(k, [300, 345], [0, 50], [0, 40], ["#8A6E52", "#9C7F61", "#B09474"]),
  })));
}
// Terrasse: Hauswand links, Rasen rechts, Hecke hinten, Himmel
{
  const k = RAEUME.terrasse.k;
  const r = k.rueck.ecken, b = k.boden.ecken;
  const himmel = `<rect width="${W}" height="${H}" fill="url(#himmel)"/>`;
  const rasen = poly([[r[1][0], r[1][1]], [W, r[1][1] - 10], [W, H], [b[2][0], H]], "url(#rasen)") + poly([[0, r[0][1] - 4], [r[0][0], r[0][1]], [b[3][0], H], [0, H]], "url(#rasen)");
  const hecke = poly([[0, r[0][1] - 150], [W, r[0][1] - 170], [W, r[1][1] - 6], [0, r[0][1] + 2]], "#4E6444");
  const wand = poly(k.links.ecken, WEISS) + poly(k.links.ecken, "url(#licht-links)") + rahmen(k, "links", [30, 150], [0, 240], "#C9D6DC", "#3A3C40");
  writeFileSync(join(ZIEL, "terrasse.svg"), svg(himmel + hecke + rasen + wand + poly(b, NEUTRAL) + poly(b, "url(#licht-boden)") +
    moebel(k, [430, 540], [0, 45], [0, 40], ["#5C4A3A", "#6E5946", "#7F6852"])));
}
// Haus von außen
{
  const glas = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#AFC2CB" stroke="#2F3134" stroke-width="10"/><rect x="${x + 10}" y="${y + 10}" width="${w * 0.45}" height="${h - 20}" fill="#fff" opacity=".12"/>`;
  const inhalt = `<rect width="${W}" height="${H}" fill="url(#himmel)"/>
<rect x="0" y="820" width="${W}" height="260" fill="url(#rasen)"/>
<rect x="520" y="206" width="1100" height="654" fill="#F2F0EC"/><rect x="1620" y="206" width="60" height="654" fill="#D9D6D0"/>
<rect x="500" y="180" width="1200" height="30" fill="#3A3C40"/>
${glas(620, 560, 460, 290)}${glas(640, 250, 420, 200)}
<rect x="1300" y="590" width="180" height="110" fill="#E3E8EA" stroke="#2F3134" stroke-width="10"/>
<rect x="1160" y="250" width="150" height="200" fill="#AFC2CB" stroke="#2F3134" stroke-width="10"/>
${poly([[300, 860], [1140, 860], [1210, 960], [180, 960]], NEUTRAL)}${poly([[180, 960], [1210, 960], [1210, 980], [180, 980]], "#9C9993")}
<g fill="#4E6444"><circle cx="1720" cy="790" r="70"/><circle cx="1800" cy="810" r="55"/><circle cx="160" cy="800" r="60"/></g>`;
  writeFileSync(join(ZIEL, "haus.svg"), svg(inhalt));
}
console.log("Platzhalter geschrieben:", ZIEL);
