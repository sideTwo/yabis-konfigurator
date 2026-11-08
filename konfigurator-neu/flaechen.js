// Flächen-Engine: legt Fliesen/Planken perspektivisch richtig auf Boden und Wände eines Raumbilds.
// Je Fläche: Homografie Bild -> Ebene (cm), Maske (Umriss minus Möbel), Licht aus dem neutralen Raumbild.
(function (global) {
  // ---------- Homografie: 4 Punkte Ebene (cm) -> Bild (px) ----------
  function loese(A, b) { // Gauß mit Pivot, 8x8
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[m][c])) m = r;
      [M[c], M[m]] = [M[m], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  function homografie(von, nach) { // 3x3, zeilenweise
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = von[i], [u, v] = nach[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const h = loese(A, b);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  function anwenden(Hm, [x, y]) { const w = Hm[6] * x + Hm[7] * y + Hm[8]; return [(Hm[0] * x + Hm[1] * y + Hm[2]) / w, (Hm[3] * x + Hm[4] * y + Hm[5]) / w]; }

  // ---------- Shader ----------
  const VS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;
  const FS = `#version 300 es
precision highp float;
uniform sampler2D uRaum, uMaske, uTex;
uniform mat3 uInv;          // Bild px -> Ebene cm
uniform vec2 uBild;         // 1920 x 1080
uniform vec3 uAbb;          // Gerät px -> Bild px: Skala, Leinwandhöhe, -
uniform vec2 uKachel;       // Breite, Höhe in cm
uniform float uFuge, uVersatz, uDrehen, uTexAspekt, uLichtRef, uGlanz, uBeton;
uniform vec3 uFugeFarbe;
out vec4 farbe;
float zufall(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float rauschen(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(zufall(i),zufall(i+vec2(1,0)),f.x),mix(zufall(i+vec2(0,1)),zufall(i+vec2(1,1)),f.x),f.y);
}
void main(){
  vec2 bild = vec2(gl_FragCoord.x, uAbb.y - gl_FragCoord.y) / uAbb.x;
  vec2 uvBild = bild / uBild;
  float maske = texture(uMaske, uvBild).r;
  if (maske < 0.004) discard;
  vec3 q = uInv * vec3(bild, 1.);
  vec2 p = q.xy / q.z;
  if (uDrehen > .5) p = p.yx;
  vec2 k = uKachel;
  float reihe = floor(p.y / k.y);
  float versatz = uVersatz < 0. ? zufall(vec2(reihe, 7.)) * k.x : fract(reihe * uVersatz) * k.x;
  float x = p.x + versatz;
  float spalte = floor(x / k.x);
  vec2 lokal = vec2(x - spalte * k.x, p.y - reihe * k.y);
  // Fuge mit Kantenglättung
  vec2 abst = min(lokal, k - lokal);
  float rand = min(abst.x, abst.y);
  vec2 pixel = max(fwidth(p), vec2(1e-3));
  float aa = min(pixel.x, pixel.y);
  // Integrate subpixel joints instead of inflating distant joints to white lines.
  vec2 kanten = clamp((vec2(uFuge * .5) + pixel * .5 - abst) / pixel, 0., 1.);
  float fuge = uFuge > 0. ? max(kanten.x, kanten.y) : 0.;
  float kante = uFuge > 0. ? 0. : (1. - smoothstep(0., aa * 1.2, rand)) * .28;   // Planken: feine Kante statt Fuge
  // Texturausschnitt je Fliese, gespiegelt und versetzt, damit sich nichts wiederholt
  vec2 id = vec2(spalte, reihe);
  float r1 = zufall(id), r2 = zufall(id + 3.1), r3 = zufall(id + 7.7);
  float ka = k.x / k.y;
  vec2 teil = ka > uTexAspekt ? vec2(1., uTexAspekt / ka) : vec2(ka / uTexAspekt, 1.);
  vec2 t = lokal / k;
  if (r2 > .5) t.x = 1. - t.x;
  if (r3 > .5 && uFuge > 0.) t.y = 1. - t.y;
  vec2 ab = (1. - teil) * vec2(r1, fract(r1 * 7.31));
  vec2 stetig = p / k * teil;
  vec3 tex = textureGrad(uTex, ab + t * teil, dFdx(stetig), dFdy(stetig)).rgb;
  if(uBeton > .5){
    // The demo concrete is evaluated at surface coordinates, with no enlarged photo crop.
    vec2 bp=lokal+id*173.;
    float wolken=rauschen(bp*.13)*.025+rauschen(bp*.6)*.018+rauschen(bp*2.)*.012;
    float detail=(rauschen(bp*9.)-.5)*.018/(1.+length(fwidth(bp))*9.);
    float poren=smoothstep(.84,.98,rauschen(bp*5.))*.022;
    tex=vec3(.235,.245,.242)+wolken+detail-poren;
  }
  // Licht aus dem neutralen Raumbild
  vec3 raum = texture(uRaum, uvBild).rgb;
  float luminanz = dot(raum, vec3(.2126, .7152, .0722));
  float licht = clamp(pow(luminanz / .48, 1.25), .035, 1.12);
  // Contact shadows belong to the room, independently of the selected finish.
  float tiefe = max((bild.y - 520.) / 560., .15);
  float linkerRand = 708. - (bild.y - 695.) * 286. / 215.;
  float unterWaschtisch = exp(-max(bild.x-linkerRand,0.) / (48.*tiefe))
    * (1.-smoothstep(950.,1080.,bild.y));
  float tuer = exp(-max(1457.-bild.x,0.)/(19.*tiefe))*smoothstep(805.,830.,bild.y);
  float rueckwand = exp(-max(bild.y-697.,0.)/8.);
  float duschkante = exp(-abs(bild.y-812.)/3.)*smoothstep(1175.,1200.,bild.x);
  float kontakt = (1.-.36*unterWaschtisch)*(1.-.32*tuer)*(1.-.27*rueckwand)*(1.-.22*duschkante);
  float ton = 1. + (zufall(id + 11.3) - .5) * .025;
  // Apply illumination in linear light; grout receives the same room shadows.
  vec3 albedo = mix(pow(tex, vec3(2.2)) * ton, pow(uFugeFarbe, vec3(2.2)) * .82, fuge);
  float fase = 1.-smoothstep(.10,.32,rand);
  vec3 lichtfarbe = mix(vec3(1.), clamp(raum/max(luminanz,.04),vec3(.7),vec3(1.3)),.35);
  vec3 c = albedo * licht * lichtfarbe * kontakt * (1.-.12*fase);
  // A soft window reflection is independent of the tile's diffuse colour.
  float fresnel = .035 + .10*pow(1.-clamp((bild.y-520.)/650.,0.,1.),5.);
  c += pow(raum, vec3(2.2)) * smoothstep(.28, .62, luminanz) * (fresnel + uGlanz) * kontakt;
  // Match the fine photographic grain of the surrounding room without blurring the finish.
  c *= 1.+(zufall(floor(bild))-.5)*.012;
  farbe = vec4(pow(max(c, vec3(0.)), vec3(1. / 2.2)), maske);
}`;

  function shader(gl, typ, quelle) {
    const s = gl.createShader(typ); gl.shaderSource(s, quelle); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function textur(gl, quelle, mip) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3); // eigene Einheit zum Hochladen, damit Raum, Maske und Muster gebunden bleiben
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, quelle);
    if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso && mip) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  }

  // Holz-Platzhalter für Vinyl: Maserung als Bild erzeugen
  function holzBild(hell, dunkel) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 1536;
    const g = c.getContext("2d");
    g.fillStyle = hell; g.fillRect(0, 0, c.width, c.height);
    let s = 7; const zuf = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      const x0 = zuf() * c.width, breite = 0.6 + zuf() * 2.2, welle = 3 + zuf() * 9, f = 0.002 + zuf() * 0.004;
      g.strokeStyle = dunkel; g.globalAlpha = 0.14 + zuf() * 0.32; g.lineWidth = breite;
      g.beginPath();
      for (let y = 0; y <= c.height; y += 12) { const x = x0 + Math.sin(y * f + i) * welle; y ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 0.18; g.fillStyle = dunkel;
    for (let i = 0; i < 5; i++) { const y = zuf() * c.height; g.beginPath(); g.ellipse(zuf() * c.width, y, 6 + zuf() * 8, 18 + zuf() * 20, 0, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    return c;
  }

  function ladeBild(src) {
    return new Promise((ok, nein) => { const i = new Image(); i.decoding = "async"; i.onload = () => ok(i); i.onerror = () => nein(new Error("Bild fehlt: " + src)); i.src = src; });
  }

  // ---------- Engine ----------
  function Flaechen(leinwand, { W, H }) {
    const gl = leinwand.getContext("webgl2", { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: true });
    if (!gl) throw new Error("WebGL2 fehlt");
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const puffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, puffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = {}; for (const n of ["uRaum", "uMaske", "uTex", "uInv", "uBild", "uAbb", "uKachel", "uFuge", "uVersatz", "uDrehen", "uTexAspekt", "uLichtRef", "uGlanz", "uBeton", "uFugeFarbe"]) U[n] = gl.getUniformLocation(prog, n);
    gl.uniform1i(U.uRaum, 0); gl.uniform1i(U.uMaske, 1); gl.uniform1i(U.uTex, 2);
    gl.uniform2f(U.uBild, W, H);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const texturen = new Map();
    let raum = null; // { tex, quads: [{ flaeche, inv, maske, lichtRef }] }

    async function produktTextur(p) {
      if (texturen.has(p.textur)) return texturen.get(p.textur);
      let quelle;
      if (p.textur.startsWith("holz:")) { const [, h, d] = p.textur.split(":"); quelle = holzBild(h, d); }
      else {
        quelle = await ladeBild(p.textur);
        if (p.ausschnitt) {
          const c = document.createElement('canvas');
          c.width = 512; c.height = 512;
          c.getContext('2d').drawImage(quelle, ...p.ausschnitt, 0, 0, 512, 512);
          quelle = c;
        }
      }
      const t = { tex: textur(gl, quelle, true), aspekt: quelle.width / quelle.height };
      texturen.set(p.textur, t);
      return t;
    }

    // Raumbild rastern (auch SVG), Masken und Licht-Referenz je Fläche berechnen
    async function setzeRaum(r) {
      const bild = await ladeBild(r.bild);
      const ras = document.createElement("canvas"); ras.width = W; ras.height = H;
      const g = ras.getContext("2d", { willReadFrequently: true });
      g.drawImage(bild, 0, 0, W, H);
      const original = g.getImageData(0,0,W,H).data;
      g.filter = 'blur(28px)'; g.drawImage(bild, 0, 0, W, H); g.filter = 'none';
      const lichtbild = g.getImageData(0, 0, W, H), daten = lichtbild.data;
      // Median rejects the old narrow grout lines while retaining reflected window detail
      // and the photographed shadow transitions, which a broad blur would erase.
      const nachbarn = [];
      for(let y=690;y<H;y++)for(let x=420;x<1460;x++){
        nachbarn.length=0;
        for(let dy=-3;dy<=3;dy+=3)for(let dx=-3;dx<=3;dx+=3){
          const i=(Math.min(H-1,Math.max(0,y+dy))*W+Math.min(W-1,Math.max(0,x+dx)))*4;
          nachbarn.push(i);
        }
        nachbarn.sort((a,b)=>(original[a]+original[a+1]+original[a+2])-(original[b]+original[b+1]+original[b+2]));
        const i=(y*W+x)*4,j=nachbarn[4];
        for(let c=0;c<3;c++)daten[i+c]=original[j+c]*.72+daten[i+c]*.28;
      }
      g.putImageData(lichtbild,0,0);
      const raumTex = textur(gl, ras, false);
      const quads = [];
      for (const fl of r.flaechen || []) {
        for (const q of fl.quads) {
          const [w, h] = q.groesse;
          const ebene = [[0, 0], [w, 0], [w, h], [0, h]];
          const inv = homografie(q.ecken, ebene);
          // Maske halbe Auflösung: Viereck minus Möbel
          const m = document.createElement("canvas"); m.width = W; m.height = H;
          const mg = m.getContext("2d", { willReadFrequently: true });
          mg.fillStyle = "#fff";
          mg.beginPath(); (q.umriss || q.ecken).forEach(([x, y], i) => (i ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); mg.fill();
          mg.globalCompositeOperation = "destination-out";
          for (const v of r.verdeckt || []) if (v.flaeche === fl.id) { mg.beginPath(); v.umriss.forEach(([x, y], i) => (i ? mg.lineTo(x, y) : mg.moveTo(x, y))); mg.closePath(); mg.fill(); }
          // mittlere Helligkeit der sichtbaren Fläche als Bezug fürs Licht
          const md = mg.getImageData(0, 0, m.width, m.height).data;
          let summe = 0, n = 0;
          for (let y = 0; y < m.height; y += 4) for (let x = 0; x < m.width; x += 4) {
            if (md[(y * m.width + x) * 4 + 3] < 200) continue;
            const i = (y * W + x) * 4;
            summe += (0.2126 * daten[i] + 0.7152 * daten[i + 1] + 0.0722 * daten[i + 2]) / 255; n++;
          }
          quads.push({ flaeche: fl.id, inv, maske: textur(gl, m, false), lichtRef: n ? summe / n : 0.7, flaecheM2: (w * h) / 10000 });
        }
      }
      if (raum) { gl.deleteTexture(raum.tex); raum.quads.forEach((q) => gl.deleteTexture(q.maske)); }
      raum = { tex: raumTex, quads };
      return bild;
    }

    // auswahl: { flaecheId: { produkt, format:[w,h], verband, fuge } }
    async function zeichne(auswahl) {
      const d = leinwand.width / W;
      gl.viewport(0, 0, leinwand.width, leinwand.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (!raum) return;
      const tex = {};
      for (const q of raum.quads) if (auswahl[q.flaeche]) tex[q.flaeche] = await produktTextur(auswahl[q.flaeche].produkt);
      gl.useProgram(prog);
      gl.uniform3f(U.uAbb, d, leinwand.height, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, raum.tex);
      for (const q of raum.quads) {
        const a = auswahl[q.flaeche];
        if (!a) continue;
        const t = tex[q.flaeche];
        const holz = a.produkt.textur.startsWith("holz:");
        const [kw, kh] = a.format;
        // Planken längs in die Tiefe legen (Format 20 x 120: lange Seite entlang der Ebene y)
        gl.uniform2f(U.uKachel, holz ? kw : kw, holz ? kh : kh);
        gl.uniform1f(U.uDrehen, holz ? 0 : 0);
        gl.uniform1f(U.uFuge, a.fuge ? 0.2 : 0);
        const ff = a.fuge ? a.fuge.farbe : "#000000";
        gl.uniform3f(U.uFugeFarbe, parseInt(ff.slice(1, 3), 16) / 255, parseInt(ff.slice(3, 5), 16) / 255, parseInt(ff.slice(5, 7), 16) / 255);
        gl.uniform1f(U.uVersatz, a.verband.versatz);
        gl.uniform1f(U.uTexAspekt, t.aspekt);
        gl.uniform1f(U.uLichtRef, q.lichtRef);
        gl.uniform1f(U.uGlanz, a.produkt.glanz || 0);
        gl.uniform1f(U.uBeton, a.produkt.id === 'beton' ? 1 : 0);
        gl.uniformMatrix3fv(U.uInv, false, new Float32Array([q.inv[0],q.inv[3],q.inv[6],q.inv[1],q.inv[4],q.inv[7],q.inv[2],q.inv[5],q.inv[8]]));
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, q.maske);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }

    const flaecheM2 = (id) => raum ? raum.quads.filter((q) => q.flaeche === id).reduce((s, q) => s + q.flaecheM2, 0) : 0;
    return { setzeRaum, zeichne, produktTextur, flaecheM2, homografie, anwenden };
  }

  global.Flaechen = Flaechen;
})(window);
