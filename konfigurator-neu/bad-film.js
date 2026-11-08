(() => {
'use strict';
const $=s=>document.querySelector(s);
const scenes=BadMaterials.floor;
const walls=BadMaterials.wall;
const variants={
  'stein:original':{image:'assets/bad-ende.png',poster:'assets/bad-start.jpg',video:'assets/flur-bad-stumm.mp4'},
  'marmor:original':{image:'assets/bad-marmor-boden-ende.png',poster:'assets/bad-marmor-boden-start.jpg',video:'assets/bad-marmor-boden.mp4'},
  'stein:hell':{image:'assets/bad-wand-hell-ende.png',poster:'assets/bad-wand-hell-start.jpg',video:'assets/bad-wand-hell.mp4'},
  'marmor:hell':{image:'assets/bad-marmor-ende.png',poster:'assets/bad-marmor-start.jpg',video:'assets/bad-marmor-stumm.mp4'}
};
let saved={};try{saved=JSON.parse(localStorage.getItem('yabis-bad-v1'))||{};}catch{}
const formats=['30,60','60,60','60,120','120,120'];
const patterns={kreuz:'Kreuzfuge',halb:'Halbverband',drittel:'Drittelverband'};
const grouts={hell:'Sand / Hell',grau:'Grau',dunkel:'Anthrazit'};
const surfaceNames={boden:'Boden',wand:'Wand'};
function restoreSurface(key){
  const s=saved.surfaces?.[key]||{};
  return {format:formats.includes(s.format)?s.format:'60,120',pattern:patterns[s.pattern]?s.pattern:'kreuz',grout:grouts[s.grout]?s.grout:'grau',area:String(s.area??(key==='boden'?saved.area:saved.wallArea)??''),waste:['0','5','10','15'].includes(s.waste)?s.waste:(['0','5','10','15'].includes(saved.waste)?saved.waste:'10'),inquiry:s.inquiry!==false};
}
const state={product:scenes.some(s=>s.id===saved.product)?saved.product:'marmor',wall:walls.some(w=>w.id===saved.wall)?saved.wall:'original',target:saved.target==='wand'?'wand':'boden',surfaces:{boden:restoreSurface('boden'),wand:restoreSurface('wand')}};
const room=$('#room'),video=$('#flight'),dialog=$('#request'),form=$('#request-form');
const liveCanvas=$('#joint-preview');
let renderer=null,videoFrame=null,animationFrame=null;
try{renderer=LiveJoints(liveCanvas);}catch(e){console.error(e);$('#status').textContent='Die sichtbare Fliesenkonfiguration konnte nicht gestartet werden. Bitte neu laden.';}
let comparison=false,mode='intro';
const floor=()=>scenes.find(s=>s.id===state.product),wall=()=>walls.find(s=>s.id===state.wall);
const scene=()=>({...variants[`${floor().base}:${wall().base}`],name:`Boden: ${floor().name} · Wand: ${wall().name}`});
const de=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:2});
const surface=(key=state.target)=>state.surfaces[key];
const areaInput=key=>$(key==='boden'?'#area':'#wall-area');
const validArea=key=>areaInput(key).checkValidity()&&Number(surface(key).area)>=.1&&Number(surface(key).area)<=10000;
const total=key=>Math.ceil(Number(surface(key).area)*(1+Number(surface(key).waste)/100)*100-1e-8)/100;
const pieces=key=>Math.ceil(total(key)/(surface(key).format.split(',').map(Number).reduce((a,b)=>a*b)/10000)-1e-8);
function save(){try{localStorage.setItem('yabis-bad-v1',JSON.stringify(state));}catch{}}
function step(n){for(let i=1;i<=3;i++){const e=$('#step'+i);if(i===n)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');}}
function update(){
  for(const b of document.querySelectorAll('.material[data-product]'))b.setAttribute('aria-pressed',String(b.dataset.product===state.product));
  for(const b of document.querySelectorAll('.material[data-wall]'))b.setAttribute('aria-pressed',String(b.dataset.wall===state.wall));
  $('#quantity').replaceChildren();
  for(const key of ['boden','wand']){
    const s=surface(key),line=document.createElement('p');
    line.textContent=!s.inquiry?`${surfaceNames[key]}: nicht in der Anfrage.`:validArea(key)?`${surfaceNames[key]}: ${de(s.area)} m² + ${s.waste} % = ca. ${de(total(key))} m² Bedarf · rechnerisch ${pieces(key)} Fliesen.`:`${surfaceNames[key]}: Fläche für die Anfrage eingeben.`;
    $('#quantity').append(line);
  }
  save();
  renderCurrent();
}
function renderCurrent(time=video.currentTime){
  liveCanvas.hidden=!renderer||comparison||mode==='intro';
  if(liveCanvas.hidden)return;
  const source=mode==='flight'?video:room;
  if(source===room&&(!room.complete||!room.naturalWidth)){liveCanvas.hidden=true;return;}
  try{renderer.draw(source,state,mode==='flight'?time:5);}catch(e){liveCanvas.hidden=true;$('#status').textContent='Die Fliesenvorschau konnte nicht aktualisiert werden. Bitte neu laden.';console.error(e);}
}
function stopFrames(){if(videoFrame!==null&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(videoFrame);if(animationFrame!==null)cancelAnimationFrame(animationFrame);videoFrame=null;animationFrame=null;}
function startFrames(){
  stopFrames();
  if(video.requestVideoFrameCallback){const next=(_,info)=>{if(mode!=='flight')return;renderCurrent(info.mediaTime);videoFrame=video.requestVideoFrameCallback(next);};videoFrame=video.requestVideoFrameCallback(next);}
  else {let last=-1;const next=()=>{if(mode!=='flight')return;if(last!==video.currentTime){last=video.currentTime;renderCurrent(last);}animationFrame=requestAnimationFrame(next);};next();}
}
room.addEventListener('load',()=>renderCurrent());
new ResizeObserver(()=>renderCurrent()).observe($('#stage'));
function showScene(){
  liveCanvas.hidden=true;
  room.src=(comparison?variants['stein:original']:scene()).image;
  room.alt=comparison?'Originales Badezimmer':`Badezimmer · ${scene().name}`;
  $('#compare').setAttribute('aria-pressed',String(comparison));
  $('#compare').textContent=comparison?'Zurück zu Ihrer Auswahl':'Original vergleichen';
  renderCurrent();
}
function configure(){
  stopFrames();video.pause();video.hidden=true;mode='edit';$('#intro').hidden=true;
  $('#flight-controls').hidden=true;$('#scene-controls').hidden=false;$('#editor').hidden=false;
  document.body.classList.add('configuring');
  $('.aside-top p').textContent='Wählen Sie Wand und Boden getrennt. Die Kamerafahrt zeigt Ihre Kombination.';
  showScene();update();step(2);
}
async function fly(){
  comparison=false;showScene();mode='flight';
  document.body.classList.remove('floor-detail');$('#zoom').setAttribute('aria-pressed','false');$('#zoom').textContent='Boden vergrößern';
  $('#intro').hidden=true;$('#scene-controls').hidden=true;$('#editor').hidden=true;$('#flight-controls').hidden=false;
  const selected=scene();video.pause();video.src=selected.video;video.poster=selected.poster;video.muted=true;video.hidden=false;
  $('#pause').textContent='Pause';$('#status').textContent='';step(1);
  liveCanvas.hidden=true;
  try{await video.play();renderCurrent();startFrames();}catch{configure();$('#status').textContent='Die Kamerafahrt konnte nicht starten. Die gerenderte Endansicht ist verfügbar.';}
}
for(const s of scenes){
  const b=document.createElement('button');b.type='button';b.className='material';b.dataset.product=s.id;b.setAttribute('aria-label',s.name);
  const sw=document.createElement('span');sw.className='swatch';sw.style.backgroundImage=`url("${s.swatch}")`;sw.style.filter=s.filter||'none';
  const text=document.createElement('span'),name=document.createElement('strong'),sub=document.createElement('small');
  name.textContent=s.name;sub.textContent=s.detail;text.append(name,sub);b.append(sw,text);
  b.onclick=()=>{state.product=s.id;comparison=false;showScene();selectSurface('boden');};$('#materials').append(b);
}
for(const s of walls){
  const b=document.createElement('button');b.type='button';b.className='material';b.dataset.wall=s.id;b.setAttribute('aria-label',`Wand: ${s.name}`);
  const sw=document.createElement('span');sw.className='swatch';sw.style.backgroundImage=`url("${s.swatch}")`;sw.style.filter=s.filter||'none';
  const text=document.createElement('span'),name=document.createElement('strong'),sub=document.createElement('small');name.textContent=s.name;sub.textContent=s.detail;text.append(name,sub);b.append(sw,text);
  b.onclick=()=>{state.wall=s.id;comparison=false;showScene();selectSurface('wand');};$('#wall-materials').append(b);
}
function selectSurface(key){
  state.target=key;const s=surface(key),name=surfaceNames[key];
  for(const k of ['boden','wand']){
    $('#target-'+k).setAttribute('aria-pressed',String(k===key));
    areaInput(k).closest('label').hidden=k!==key;
  }
  $('#surface-format-title').textContent=`03 · Format & Verlegung – ${name}`;
  $('#surface-area-title').textContent=`04 · Fläche & Menge – ${name}`;
  $('#format-label').textContent=`${name}format`;
  $('#pattern-label').textContent=`Verlegung ${name}`;
  $('#grout-label').textContent=`Fugenfarbe ${name}`;
  $('#waste-label').textContent=`Verschnitt ${name}`;
  for(const id of ['format','pattern','grout','waste'])$('#'+id).value=s[id];
  update();
}
for(const key of ['boden','wand']){
  $('#target-'+key).onclick=()=>selectSurface(key);
  areaInput(key).value=surface(key).area;
  areaInput(key).oninput=e=>{surface(key).area=e.target.value;update();};
  $('#include-'+key).checked=surface(key).inquiry;
  $('#include-'+key).onchange=e=>{surface(key).inquiry=e.target.checked;update();};
}
for(const key of ['format','pattern','grout','waste'])$('#'+key).onchange=e=>{surface()[key]=e.target.value;if(key!=='waste'&&comparison){comparison=false;showScene();}update();};
$('#editor > .hint').textContent='Artikel, verfügbare Formate und Verpackungseinheiten werden im Angebot bestätigt. Die Stückzahl ist rechnerisch aus Ihrem Wunschformat ermittelt. Die Beispielszene ist kein Aufmaß.';
$('#enter').onclick=fly;$('#replay').onclick=fly;$('#skip').onclick=configure;$('#end-flight').onclick=configure;video.onended=configure;
video.onerror=()=>{if(mode==='flight'){configure();$('#status').textContent='Die Kamerafahrt konnte nicht geladen werden. Bitte neu laden.';}};
$('#pause').onclick=async()=>{if(video.paused){try{await video.play();$('#pause').textContent='Pause';}catch{configure();}}else{video.pause();$('#pause').textContent='Fortsetzen';}};
$('#zoom').onclick=()=>{const active=document.body.classList.toggle('floor-detail');$('#zoom').setAttribute('aria-pressed',String(active));$('#zoom').textContent=active?'Ganzer Raum':'Boden vergrößern';};
$('#compare').onclick=()=>{comparison=!comparison;showScene();};
function summary(){
  const lines=['Badfliesen – unverbindliche Anfrage'];
  for(const key of ['boden','wand'])if(surface(key).inquiry){
    const s=surface(key);lines.push('',`${surfaceNames[key]}${key==='boden'?' (ohne Duschfläche)':''}: ${key==='boden'?floor().name:wall().name}`,`Formatwunsch: ${s.format.split(',').join(' × ')} cm`,`Verlegung: ${patterns[s.pattern]}; Fugenfarbe: ${grouts[s.grout]}`,`Kundenfläche: ${de(s.area)} m²`,`Verschnitt: ${s.waste} %; Bedarf: ca. ${de(total(key))} m²`,`Rechnerische Stückzahl im Wunschformat: ${pieces(key)} Fliesen.`);
  }
  lines.push('','Die Visualisierung veranschaulicht die Auswahl; sie ersetzt kein Aufmaß oder eine Verlegeplanung.','Bitte passende Artikel, verfügbare Formate, Eignung, Verpackungseinheiten, Mengen und Preise bestätigen.');return lines.join('\n');
}
$('#review').onclick=()=>{
  const included=['boden','wand'].filter(key=>surface(key).inquiry);
  if(!included.length){$('#status').textContent='Bitte wählen Sie mindestens eine Fläche für die Anfrage aus.';$('#include-boden').focus();return;}
  for(const key of included)if(!validArea(key)){selectSurface(key);$('#status').textContent=`Bitte geben Sie die tatsächliche ${surfaceNames[key]}fläche ein (0,1 bis 10.000 m²).`;areaInput(key).focus();areaInput(key).reportValidity();return;}
  $('#status').textContent='';$('#summary').replaceChildren();for(const line of summary().split('\n')){const p=document.createElement('div');p.textContent=line;$('#summary').append(p);}
  $('#form-status').textContent='';step(3);dialog.showModal();
};
$('#close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>step(2));
form.elements.delivery.onchange=()=>{const required=form.elements.delivery.value==='Lieferung';form.elements.zip.required=required;$('#zip-note').textContent=required?'(erforderlich)':'(optional)';};
function inquiry(){const f=new FormData(form);return `Hallo Yabi’s Fliesenwelt,\nbitte erstellen Sie mir ein unverbindliches Angebot für die unten ausgewählten Badflächen.\n\n${summary()}\n\nName: ${f.get('name')}\nRückkontakt: ${f.get('contact')}\n${f.get('delivery')}${f.get('zip')?' · PLZ '+f.get('zip'):''}\nNachricht / weitere Formatwünsche: ${f.get('message')||'–'}\n\nAus dem Bad-Studio: unverbindliche KI-generierte Beispielszene, kein verbindlich ausgewählter Katalogartikel.`;}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
form.onsubmit=e=>{
  e.preventDefault();if(!form.reportValidity())return;const text=inquiry();
  if(e.submitter?.value==='email')location.href=`mailto:info@yabisfliesenwelt.de?subject=${encodeURIComponent('Anfrage Badboden – Yabi’s Raumstudio')}&body=${encodeURIComponent(text)}`;
  else window.open(`https://wa.me/491786787724?text=${encodeURIComponent(text)}`,'_blank','noopener');
  $('#form-status').textContent='Ihr Anfrageentwurf wurde vorbereitet. Bitte prüfen und selbst absenden. Falls nichts geöffnet wurde, können Sie die Anfrage als Text speichern.';
};
$('#download').onclick=()=>{if(!form.reportValidity())return;download(new Blob([inquiry()],{type:'text/plain;charset=utf-8'}),'yabis-bad-anfrage.txt');$('#form-status').textContent='Anfrage als Textdatei vorbereitet. Es wurde noch nichts versendet.';};
$('#save-image').onclick=async()=>{
  const selected=scene(),img=new Image();img.src=selected.image;
  try{await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d');if(renderer){renderer.draw(img,state,5);g.drawImage(liveCanvas,0,0,c.width,c.height);renderCurrent();}else g.drawImage(img,0,0);g.fillStyle='#14291fd9';g.fillRect(0,c.height-64,c.width,64);g.fillStyle='#fff';g.font='22px sans-serif';g.fillText(`Yabi’s · ${selected.name} · Beispielszene`,24,c.height-24);c.toBlob(blob=>{if(blob)download(blob,'yabis-mein-bad.jpg');},'image/jpeg',.95);}catch{$('#status').textContent='Das Vorschaubild konnte nicht gespeichert werden. Bitte erneut versuchen.';}
};
showScene();video.src=scene().video;video.poster=scene().poster;selectSurface(state.target);
})();
