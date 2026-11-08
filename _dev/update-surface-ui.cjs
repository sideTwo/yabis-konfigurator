const fs=require('node:fs');
const file='konfigurator-neu/index.html';
let html=fs.readFileSync(file,'utf8');
const from=html.indexOf('<fieldset><legend>03 · Bodendarstellung'),to=html.indexOf('<p class="hint">Beispieldekore',from);
if(from<0||to<0)throw new Error('Expected settings section is missing');
const settings=`
<div class="surface-switch" role="group" aria-label="Einstellungen für Fläche">
  <button type="button" id="target-boden" aria-pressed="true">Boden einstellen</button>
  <button type="button" id="target-wand" aria-pressed="false">Wand einstellen</button>
</div>
<fieldset><legend id="surface-format-title">03 · Format &amp; Verlegung – Boden</legend>
  <label><span id="format-label">Bodenformat</span><select id="format"><option value="30,60">30 × 60 cm</option><option value="60,60">60 × 60 cm</option><option value="60,120">60 × 120 cm</option><option value="120,120">120 × 120 cm</option></select></label>
  <label><span id="pattern-label">Verlegung Boden</span><select id="pattern"><option value="kreuz">Kreuzfuge</option><option value="halb">Halbverband</option><option value="drittel">Drittelverband</option></select></label>
  <label><span id="grout-label">Fugenfarbe Boden</span><select id="grout"><option value="hell">Sand / Hell</option><option value="grau">Grau</option><option value="dunkel">Anthrazit</option></select></label>
  <p class="preview-note">Ihre Format-, Verlege- und Fugenwünsche werden angefragt. Die Kamerafahrt zeigt eine feste Beispielvariante des gewählten Dekors.</p>
</fieldset>
<fieldset><legend id="surface-area-title">04 · Fläche &amp; Menge – Boden</legend>
  <label>Bodenfläche in m²<input id="area" type="number" min="0.1" max="10000" step="0.1" placeholder="z. B. 12" required></label>
  <label hidden>Wandfläche in m²<input id="wall-area" type="number" min="0.1" max="10000" step="0.1" placeholder="z. B. 25" required></label>
  <label><span id="waste-label">Verschnitt Boden</span><select id="waste"><option value="10">10 %</option><option value="5">5 %</option><option value="15">15 %</option><option value="0">Ohne</option></select></label>
  <div class="request-areas" role="group" aria-label="Flächen für Ihre Anfrage">
    <label class="check"><input type="checkbox" id="include-boden" checked>Boden anfragen</label>
    <label class="check"><input type="checkbox" id="include-wand" checked>Wand anfragen</label>
  </div>
  <div id="quantity" class="quantity" role="status"></div>
</fieldset>`;
html=html.slice(0,from)+settings+html.slice(to);
html=html.replace('bad-film.js?v=2','bad-film.js?v=3').replace('bad.css?v=6','bad.css?v=7');
fs.writeFileSync(file,html);
