(() => {
'use strict';
const $=s=>document.querySelector(s), W=1920,H=1080;
const products=[{id:'marmor',name:'Marmoroptik · Hell',textur:'../bilder/muster/marmor-hell.webp',glanz:.08},{id:'stein',name:'Steinoptik · Grau',textur:'../bilder/muster/stein-grau.webp',glanz:0},{id:'beton',name:'Betonoptik · Dunkel',textur:'../bilder/muster/beton-dunkel.webp',ausschnitt:[40,100,180,180],glanz:0}];
const patterns={kreuz:{name:'Kreuzfuge',versatz:0},halb:{name:'Halbverband',versatz:.5},drittel:{name:'Drittelverband',versatz:1/3}};
const grouts={hell:{name:'Sand / Hell',farbe:'#d5c9b5'},grau:{name:'Grau',farbe:'#8e8a83'},dunkel:{name:'Anthrazit',farbe:'#3a3c40'}};
const defaults={product:'stein',format:'60,120',pattern:'kreuz',grout:'grau',area:'',waste:'10'};
// Calibrate from four visible intersections in the ORIGINAL floor, rather than
// fitting an arbitrary rectangle around the visible room outline. The 60 x 120
// module is an illustrative scale; the photograph supplies no surveyed dimensions.
const floorCalibration={
  groesse:[60,120],
  ecken:[[735,760],[946,763],[947,950],[574,942]],
  umriss:[[422,910],[708,695],[1046,690],[1110,704],[1197,810],[1457,812],[1457,1080],[422,1080]]
};
let state={...defaults};try {const saved=JSON.parse(localStorage.getItem('yabis-bad-v1'));if(saved){for(const k of Object.keys(defaults))if(typeof saved[k]==='string')state[k]=saved[k];}}catch{}
if(!products.some(p=>p.id===state.product))state.product=defaults.product;
if(!['60,120','60,60','120,120'].includes(state.format))state.format=defaults.format;
if(!patterns[state.pattern])state.pattern=defaults.pattern;if(!grouts[state.grout])state.grout=defaults.grout;
if(!['0','5','10','15'].includes(state.waste))state.waste='10';
const video=$('#flight'),canvas=$('#floor'),dialog=$('#request'),form=$('#request-form');
let engine,ready=false,mode='intro',compare=false,revision=0,renderQueue=Promise.resolve();
const product=()=>products.find(p=>p.id===state.product);
const area=()=>Number(state.area),validArea=()=>Number.isFinite(area())&&area()>=.1&&area()<=10000;
const total=()=>Math.ceil(area()*(1+Number(state.waste)/100)*100-1e-8)/100;
const de=n=>n.toLocaleString('de-DE',{maximumFractionDigits:2});
function save(){try{localStorage.setItem('yabis-bad-v1',JSON.stringify(state));}catch{}}
function step(n){for(let i=1;i<=3;i++){const e=$('#step'+i);if(i===n)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');}}
function update(){for(const b of document.querySelectorAll('.material'))b.setAttribute('aria-pressed',String(b.dataset.product===state.product));$('#quantity').textContent=validArea()?`${de(area())} m² + ${state.waste} % Verschnitt = ca. ${de(total())} m² Bedarf`:'Tragen Sie die Fläche Ihres eigenen Bads ein.';}
function draw(){const seq=++revision;renderQueue=renderQueue.then(async()=>{if(!ready||seq!==revision)return;await engine.zeichne({boden:{produkt:product(),format:state.format.split(',').map(Number),verband:patterns[state.pattern],fuge:grouts[state.grout]}});}).catch(()=>{$('#status').textContent='Die Materialvorschau konnte nicht aktualisiert werden. Bitte neu laden.';});return renderQueue;}
function dimensions(){const width=$('#stage').offsetWidth;const pixels=Math.min(4096,Math.max(1920,Math.ceil(width*Math.max(devicePixelRatio||1,2))));if(canvas.width!==pixels){canvas.width=pixels;canvas.height=Math.round(pixels*H/W);}draw();}
async function configure(){video.pause();mode='edit';video.hidden=true;$('#intro').hidden=true;$('#flight-controls').hidden=true;$('#scene-controls').hidden=false;$('#editor').hidden=false;document.body.classList.add('configuring');$('.aside-top p').textContent='Wählen Sie Dekor, Format und Fugenfarbe für Ihren Badboden.';step(2);update();await draw();}
async function fly(){document.body.classList.remove('floor-detail');$('#zoom').setAttribute('aria-pressed','false');$('#zoom').textContent='Boden vergrößern';mode='flight';compare=false;canvas.hidden=false;$('#compare').setAttribute('aria-pressed','false');$('#intro').hidden=true;$('#scene-controls').hidden=true;$('#flight-controls').hidden=false;$('#editor').hidden=true;video.hidden=false;video.muted=true;video.currentTime=0;$('#pause').textContent='Pause';step(1);try{await video.play();}catch{$('#status').textContent='Die Kamerafahrt konnte nicht starten. Die Fliesenauswahl ist direkt verfügbar.';configure();}}
$('#enter').onclick=fly;$('#replay').onclick=fly;$('#skip').onclick=configure;$('#end-flight').onclick=configure;video.onended=configure;
$('#pause').onclick=async()=>{if(video.paused){try{await video.play();$('#pause').textContent='Pause';}catch{configure();}}else{video.pause();$('#pause').textContent='Fortsetzen';}};
video.onerror=()=>{$('#status').textContent='Die Kamerafahrt ist nicht verfügbar. Sie können direkt zur Auswahl wechseln.';$('#enter').disabled=true;};
$('#zoom').onclick=()=>{const active=document.body.classList.toggle('floor-detail');$('#zoom').setAttribute('aria-pressed',String(active));$('#zoom').textContent=active?'Ganzer Raum':'Boden vergrößern';};
$('#compare').onclick=()=>{compare=!compare;canvas.hidden=compare;$('#compare').setAttribute('aria-pressed',String(compare));$('#compare').textContent=compare?'Zurück zu Ihrer Auswahl':'Original vergleichen';};
for(const p of products){const b=document.createElement('button');b.type='button';b.className='material';b.dataset.product=p.id;b.setAttribute('aria-label',p.name);const sw=document.createElement('span');sw.className='swatch';sw.style.backgroundImage=`url("${p.textur}")`;const text=document.createElement('span'),name=document.createElement('strong'),sub=document.createElement('small');name.textContent=p.name;sub.textContent='Beispieldekor · Matt';text.append(name,sub);b.append(sw,text);b.onclick=()=>{state.product=p.id;compare=false;canvas.hidden=false;$('#compare').setAttribute('aria-pressed','false');$('#compare').textContent='Original vergleichen';save();update();draw();};$('#materials').append(b);}
for(const key of ['format','pattern','grout','area','waste']){const input=$('#'+key);input.value=state[key];input.addEventListener(key==='area'?'input':'change',()=>{state[key]=input.value;save();update();if(key!=='area'&&key!=='waste'){compare=false;canvas.hidden=false;$('#compare').setAttribute('aria-pressed','false');$('#compare').textContent='Original vergleichen';draw();}});}
function summaryText(){return [`Badboden (ohne Duschfläche)`,`Beispieldekor: ${product().name}`,`Formatwunsch: ${state.format.split(',').join(' × ')} cm`,`${patterns[state.pattern].name}, Fuge: ${grouts[state.grout].name}`,`Kundenfläche: ${de(area())} m²`,`Verschnitt: ${state.waste} %; geschätzter Bedarf: ${de(total())} m²`,`Bitte passenden Artikel, verfügbare Formate, Eignung, Verpackungseinheiten, Menge und Preis bestätigen.`].join('\n');}
$('#review').onclick=()=>{if(!validArea()||!$('#area').checkValidity()){$('#status').textContent='Bitte geben Sie Ihre tatsächliche Badfläche ein (0,1 bis 10.000 m²).';$('#area').focus();$('#area').reportValidity();return;}$('#status').textContent='';$('#summary').replaceChildren();for(const line of summaryText().split('\n')){const p=document.createElement('div');p.textContent=line;$('#summary').append(p);}step(3);dialog.showModal();};
$('#close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>step(2));
form.elements.delivery.onchange=()=>{const required=form.elements.delivery.value==='Lieferung';form.elements.zip.required=required;$('#zip-note').textContent=required?'(erforderlich)':'(optional)';};
function inquiry(){const f=new FormData(form);return `Hallo Yabi’s Fliesenwelt,\nbitte erstellen Sie mir ein unverbindliches Angebot für meinen Badboden.\n\n${summaryText()}\n\nName: ${f.get('name')}\nRückkontakt: ${f.get('contact')}\n${f.get('delivery')}${f.get('zip')?' · PLZ '+f.get('zip'):''}\nNachricht: ${f.get('message')||'–'}\n\nAus dem Bad-Studio: unverbindliche Visualisierung mit Beispieldekor, kein verbindlich ausgewählter Katalogartikel.`;}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const text=inquiry();if(e.submitter?.value==='email'){location.href=`mailto:info@yabisfliesenwelt.de?subject=${encodeURIComponent('Anfrage Badboden – Yabi’s Raumstudio')}&body=${encodeURIComponent(text)}`;}else{window.open(`https://wa.me/491786787724?text=${encodeURIComponent(text)}`,'_blank','noopener');}$('#form-status').textContent='Ihr Anfrageentwurf wurde vorbereitet. Bitte im geöffneten Programm prüfen und selbst absenden. Falls nichts geöffnet wurde, können Sie die Anfrage als Text speichern.';};
$('#download').onclick=()=>{if(!form.reportValidity())return;download(new Blob([inquiry()],{type:'text/plain;charset=utf-8'}),'yabis-bad-anfrage.txt');$('#form-status').textContent='Anfrage als Textdatei vorbereitet. Es wurde noch nichts versendet.';};
$('#save-image').onclick=async()=>{await draw();const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage($('#room'),0,0,W,H);g.drawImage(canvas,0,0,W,H);g.fillStyle='#14291fd9';g.fillRect(0,H-74,W,74);g.fillStyle='white';g.font='24px sans-serif';g.fillText(`Yabi’s · ${product().name} · ${state.format.split(',').join(' × ')} cm · ${patterns[state.pattern].name} · Beispieldekor`,30,H-30);c.toBlob(blob=>{if(blob)download(blob,'yabis-mein-bad.jpg');},'image/jpeg',.94);};
async function init(){try{engine=Flaechen(canvas,{W,H});await engine.setzeRaum({bild:'assets/bad-ende.png',flaechen:[{id:'boden',quads:[floorCalibration]}]});await Promise.all(products.map(p=>engine.produktTextur(p)));ready=true;dimensions();update();}catch(e){$('#status').textContent='Die interaktive Vorschau benötigt WebGL 2. Bitte einen aktuellen Browser mit Grafikbeschleunigung verwenden.';$('#review').disabled=true;}}
new ResizeObserver(dimensions).observe($('#stage'));init();
})();
