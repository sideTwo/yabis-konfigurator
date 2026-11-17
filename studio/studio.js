/* Fixed photographic views. Only the selected room/material is loaded. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),S=window.YabisShop,C=window.YabisStudio,G=window.YabisTileGrid,R=window.YabisRoomPreview,W=window.YabisLivingFloor;
 const params=new URLSearchParams(location.search),id=C.roomId(params.get('raum')),room=C.rooms[id];
 const imageVersion='format-2',key='yabis-studio-v1-'+id,cache=new Map(),canvas=$('room-preview'),ctx=canvas.getContext('2d');
 const active=room.separateWalls?['floor','wall']:[room.surface],motion=matchMedia('(prefers-reduced-motion: reduce)');
 let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{};}catch{}
 const state=C.initial(id,saved,params.get('product'));
 if(id==='kueche'&&['light','dark'].includes(params.get('fronten')))state.cabinetTone=params.get('fronten');
 for(const surface of ['floor','wall']){
  state[surface+'Format']=room.separateWalls?G.format(saved[surface+'Format']):[60,120];
  state[surface+'Grout']=room.separateWalls&&Object.hasOwn(G.grouts,saved[surface+'Grout'])?saved[surface+'Grout']:'light';
 }
 let revision=0,ready=false,fade=null;
 document.body.dataset.room=id;document.title=room.name+' · Raumstudio · Yabi’s Fliesenwelt';
 $('room-title').textContent=room.title;$('room-note').textContent=room.note;
 $('room-kicker').textContent='RAUMSTUDIO / '+room.name.toLocaleUpperCase('de-DE');
 $('selection-note').textContent=room.separateWalls?'Wand und Boden einzeln kombinieren.':'Zwei Materialien im Raum vergleichen.';
 $('format-note').textContent=room.separateWalls?'Kreuzfuge · 3 mm. 60 × 120 cm ist im Katalog belegt. Andere Formate sind Wünsche und werden angefragt.':'Bildvariante in 60 × 120 cm mit heller Kreuzfuge. Weitere Formate und Fugenfarben stimmen wir für diesen Bereich persönlich ab.';
 $('quantity-note').textContent=(room.separateWalls?'Nur die geflieste Fläche einschließlich Dusche eintragen; Boden ohne Duschwanne. ':'Bitte Ihre tatsächlich geflieste Fläche eintragen. ')+(room.approval||'Verpackungseinheiten, Eignung und Verfügbarkeit bestätigt Yabis im Angebot.');
 document.querySelectorAll('[data-studio-room]').forEach(a=>{if(a.dataset.studioRoom===id)a.setAttribute('aria-current','page');});
 if(params.has('product')&&!C.materials.includes(params.get('product'))){$('linked-note').hidden=false;$('linked-note').textContent='Dieser Shopartikel ist noch nicht in der Studio-Auswahl. Hier vergleichen Sie Habitat Perla und Bercy Terra.';}
 $('height-control').hidden=!room.separateWalls;$('height-note').hidden=!room.separateWalls;
 $('room-fallback').src='../'+(id==='bad'?C.bathAssets.poster:id==='wohnen'?W.base:C.plate(id,state[room.surface],state.cabinetTone))+'?v='+imageVersion;
 $('room-fallback').alt=room.name+' – realistische Gestaltungsvorschau';
 function snapshot(){const data={...state};for(const surface of active){for(const field of ['Area','Waste'])data[surface+field]=$(`${surface}-${field.toLowerCase()}`).value;data[surface+'Included']=$('include-'+surface).checked;}return data;}
 function save(){try{localStorage.setItem(key,JSON.stringify(snapshot()));}catch{}}
 function load(src){if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>{if(image.naturalWidth!==R.width||image.naturalHeight!==R.height){cache.delete(src);reject(Error('Diese Raumansicht passt nicht zur Raumvorlage. Bitte ein Bild im freigegebenen Format verwenden.'));return;}resolve(image);};image.onerror=()=>{cache.delete(src);reject(Error('Die Materialansicht konnte nicht geladen werden. Bitte erneut auswählen.'));};image.src=src+'?v='+imageVersion;}));return cache.get(src);}
 const heightName=()=>state.wallHeight==='full'?'raumhoch':'1,20 m · Dusche raumhoch';
 function describe(){return active.map(surface=>`${room.separateWalls?(surface==='floor'?'Boden':'Wand'):room.surfaceName}: ${S.find(state[surface]).name}${room.separateWalls?' · '+state[surface+'Format'].join(' × ')+' cm · '+G.grouts[state[surface+'Grout']].label+(surface==='wall'?' · '+heightName():''):''}`).join(' / ')+(id==='kueche'?' · Fronten: '+(state.cabinetTone==='dark'?'Anthrazit':'Hell'):'');}
 async function draw(){
  const request=++revision,selection={...state};ready=false;$('add-to-cart').disabled=true;$('save-image').disabled=true;
  $('stage').setAttribute('aria-busy','true');$('image-status').hidden=false;$('image-status').textContent='Materialansicht wird geladen …';
  try{
   if(!ctx)throw Error('Die Bildvorschau wird von diesem Browser nicht unterstützt. Bitte nutzen Sie den Shop.');
   if(room.separateWalls){
    const [base,floor,wall,fixtures]=await Promise.all([load('../'+C.bathAssets.base),load('../'+C.bathPlate(selection.floor)),load('../'+C.bathPlate(selection.wall)),load('../'+C.bathAssets.fixtures)]);
    if(request!==revision)return;
    canvas.width=R.width;canvas.height=R.height;R.render(ctx,{base,floor,wall,wallHeight:selection.wallHeight,fixtures,wallRegistration:C.bathRegistration(selection.wall)});G.draw(ctx,selection,R,base);
   }else if(id==='wohnen'){
    const image=await load('../'+W.base);if(request!==revision)return;
    canvas.width=W.width;canvas.height=W.height;W.render(ctx,{image,material:selection.floor});
   }else{
    const image=await load('../'+C.plate(id,selection[room.surface],selection.cabinetTone));if(request!==revision)return;
    canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;ctx.drawImage(image,0,0);
   }
   if(fade){fade.cancel();fade=null;}canvas.hidden=false;$('room-fallback').hidden=true;
   if(!motion.matches&&typeof canvas.animate==='function')fade=canvas.animate([{opacity:.8},{opacity:1}],{duration:240,easing:'ease-out'});
   canvas.setAttribute('aria-label',room.name+' · '+describe());$('combination').textContent=describe();
   $('stage').setAttribute('aria-busy','false');$('image-status').hidden=true;ready=true;$('save-image').disabled=false;$('add-to-cart').disabled=false;save();
  }catch(error){if(request!==revision)return;$('stage').setAttribute('aria-busy','false');$('image-status').textContent=error.message;$('image-status').hidden=false;}
 }
 motion.addEventListener('change',()=>{if(fade)fade.cancel();});
 function sources(){
  $('product-sources').replaceChildren();
  for(const product of new Set(active.map(surface=>state[surface]))){const p=S.find(product),block=document.createElement('div');block.className='source-product';const image=new Image();image.src='../'+p.photo;image.alt='Originalartikel '+p.name;image.loading='lazy';const text=document.createElement('div'),title=document.createElement('strong');title.textContent=p.name;text.append(title);for(const [label,href] of [['Yabis-WhatsApp-Katalog',p.source],['Herstellermuster ansehen','../'+p.texture]]){const link=document.createElement('a');link.textContent=label;link.href=href;link.target='_blank';link.rel='noopener';text.append(link);}block.append(image,text);$('product-sources').append(block);}
 }
 function update(){
  if(id==='kueche')for(const tone of ['light','dark'])$('fronts-'+tone).setAttribute('aria-pressed',String(state.cabinetTone===tone));
  for(const surface of active){for(const button of $(`${surface}-materials`).querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.product===state[surface]));$(`${surface}-format`).value=state[surface+'Format'].join(',');$(`${surface}-grout`).value=state[surface+'Grout'];}
  $('wall-height').value=state.wallHeight;$('height-note').textContent=state.wallHeight==='120'?'Darüber weiß gestrichen, mit Abschlussprofil. Dusche immer raumhoch.':'Alle Wandflächen bis zur Decke gefliest.';
  sources();quantities();draw();
 }
 for(const surface of ['floor','wall']){
  const included=active.includes(surface);$(`${surface}-fieldset`).hidden=!included;$(`${surface}-quantity-row`).hidden=!included;$(`${surface}-options`).hidden=!room.separateWalls;
  $(`include-${surface}`).checked=included&&(typeof saved[surface+'Included']!=='boolean'||saved[surface+'Included']);
  if(!included){$(`${surface}-area`).disabled=true;$(`${surface}-waste`).disabled=true;continue;}
  if(!room.separateWalls){$(`${surface}-legend`).textContent=room.surfaceName;$(`include-${surface}-label`).textContent=room.surfaceName+' anfragen';}
  if(S.validArea(saved[surface+'Area']))$(`${surface}-area`).value=saved[surface+'Area'];
  if(['0','5','10','15','20'].includes(String(saved[surface+'Waste'])))$(`${surface}-waste`).value=saved[surface+'Waste'];
  for(const product of C.materials){const p=S.find(product),button=document.createElement('button'),image=new Image(),title=document.createElement('strong'),detail=document.createElement('small');button.type='button';button.className='material';button.dataset.product=product;button.setAttribute('aria-label',(surface==='floor'?'Boden':'Wand')+': '+p.name);image.src='../'+p.texture;image.alt='';title.textContent=p.name;detail.textContent=p.finish+' · '+p.color;button.append(image,title,detail);button.addEventListener('click',()=>{state[surface]=product;update();});$(`${surface}-materials`).append(button);}
  for(const field of ['area','waste'])$(`${surface}-${field}`).addEventListener('input',()=>{quantities();save();});
  $(`include-${surface}`).addEventListener('change',()=>{quantities();save();});
  $(`${surface}-format`).addEventListener('change',()=>{state[surface+'Format']=G.format($(`${surface}-format`).value);update();});
  $(`${surface}-grout`).addEventListener('change',()=>{state[surface+'Grout']=$(`${surface}-grout`).value;update();});
 }
 $('kitchen-fronts').hidden=id!=='kueche';
 if(id==='kueche')for(const tone of ['light','dark'])$('fronts-'+tone).addEventListener('click',()=>{state.cabinetTone=tone;update();});
 $('wall-height').addEventListener('change',()=>{state.wallHeight=$('wall-height').value==='full'?'full':'120';update();});
 function quantities(){for(const surface of active){const included=$('include-'+surface).checked;$(`${surface}-area`).disabled=!included;$(`${surface}-waste`).disabled=!included;const q=S.calculate($(`${surface}-area`).value,$(`${surface}-waste`).value,state[surface+'Format']);$(`${surface}-quantity`).textContent=!included?'Wird nicht angefragt.':q?`${S.de(q.total)} m² inkl. Verschnitt · rechnerisch ${q.pieces} Fliesen`:'Bitte Ihre Fläche eintragen.';}$('cart-status').textContent='';$('to-cart').hidden=true;}
 function basket(){$('basket-count').textContent=S.getCart().length;}
 window.addEventListener('yabis-cart-change',basket);window.addEventListener('pageshow',basket);window.addEventListener('storage',event=>{if(event.key===S.key)basket();});
 $('request-selection').addEventListener('submit',event=>{
  event.preventDefault();if(!ready){$('cart-status').textContent='Bitte warten, bis Ihre gewählte Materialansicht geladen ist.';return;}
  const selected=active.filter(surface=>$('include-'+surface).checked);if(!selected.length){$('cart-status').textContent='Bitte mindestens eine Fläche für Ihre Anfrage auswählen.';return;}
  try{const items=selected.map(surface=>S.item({product:state[surface],area:$(`${surface}-area`).value,waste:$(`${surface}-waste`).value,format:state[surface+'Format'],surface:room.separateWalls?(surface==='floor'?'Boden (ohne Duschwanne)':'Wand'):room.surfaceName,room:room.name,applicationNote:room.approval||'',pattern:'Kreuzfuge',grout:room.separateWalls?G.grouts[state[surface+'Grout']].label:'Hellgrau · Bildvariante',wallHeight:room.separateWalls&&surface==='wall'?state.wallHeight:null}));S.add(items);$('cart-status').textContent='Ihre Auswahl für '+room.name+' liegt im Anfragekorb.';$('to-cart').hidden=false;save();}catch(error){$('cart-status').textContent=error.message;}
 });
 $('save-image').addEventListener('click',()=>{if(!ready)return;canvas.toBlob(blob=>{if(!blob){$('image-status').hidden=false;$('image-status').textContent='Das Bild konnte nicht gespeichert werden.';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Yabis-${id}-${active.map(surface=>surface+'-'+state[surface]).join('-')}${room.separateWalls?'-'+state.wallHeight:''}${id==='kueche'?(state.cabinetTone==='dark'?'-fronten-anthrazit':'-fronten-hell'):''}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');});
 basket();update();
})();
