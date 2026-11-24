/* Render the selected materials into each room's calibrated image. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),S=window.YabisShop,C=window.YabisStudio,G=window.YabisTileGrid,R=window.YabisRoomPreview,W=window.YabisLivingFloor,T=window.YabisStudioTextures;
 const params=new URLSearchParams(location.search),id=C.roomId(params.get('raum')),room=C.rooms[id];
 const materials=C.materialsFor(id);
 document.body.dataset.room=id;document.title=room.name+' · Raumstudio · Yabi’s Fliesenwelt';
 $('room-title').textContent=room.title;$('room-note').textContent=room.note;
 $('room-kicker').textContent='RAUMSTUDIO / '+room.name.toLocaleUpperCase('de-DE');
 document.querySelectorAll('[data-studio-room]').forEach(link=>{
  if(link.dataset.studioRoom!==id)return;
  link.setAttribute('aria-current','page');
  const nav=link.parentElement;
  if(nav.scrollWidth<=nav.clientWidth)return;
  const viewport=nav.getBoundingClientRect(),tab=link.getBoundingClientRect();
  if(tab.left<viewport.left||tab.right>viewport.right)nav.scrollLeft+=(tab.left+tab.right-viewport.left-viewport.right)/2;
 });
 function basket(){$('basket-count').textContent=S.getCart().length;}
 window.addEventListener('yabis-cart-change',basket);window.addEventListener('pageshow',basket);window.addEventListener('storage',event=>{if(event.key===S.key)basket();});
 basket();
 if(!materials.length){
  $('skip-to-controls').href='#exterior-advice';$('skip-to-controls').textContent='Zur Naturstein-Anfrage';
  $('auswahl').hidden=true;$('exterior-advice').hidden=false;
  $('scene-actions').hidden=true;$('scene-footer').hidden=true;$('image-status').hidden=true;
  $('stage').setAttribute('aria-busy','false');
  const image=$('room-fallback');
  image.alt='Hauseingang mit Podest und Stufe';
  image.src='../'+room.image;
  if(document.documentElement?.classList.contains('room-arrival')){
   const reveal=()=>window.dispatchEvent(new CustomEvent('yabis-room-ready'));
   image.decode().then(reveal,reveal);
  }
  return;
 }
 const scene=window.YabisStudioScenes.scene(id,G,W);
 const slabSteps=scene?.slabs===true;
 const imageVersion='format-2',key='yabis-studio-v1-'+id,cache=new Map(),canvas=$('room-preview'),ctx=canvas.getContext('2d');
 const isBath=id==='bad';
 const active=room.separateWalls?['floor','wall']:[room.surface],motion=matchMedia('(prefers-reduced-motion: reduce)');
 const compactView=matchMedia('(max-width: 767px)'),display=$('room-display'),stage=$('stage');
 let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{};}catch{}
 const state=C.initial(id,saved,params.get('product'));
 if(id==='kueche'&&['light','dark'].includes(params.get('fronten')))state.cabinetTone=params.get('fronten');
 for(const surface of ['floor','wall']){
  const selected=state[surface],remembered=saved[surface]===selected;
  state[surface+'Format']=remembered?G.format(saved[surface+'Format']):C.demoFormat(selected);
  state[surface+'FormatChosen']=Boolean(remembered&&saved[surface+'FormatChosen']);
  state[surface+'Grout']=Object.hasOwn(G.grouts,saved[surface+'Grout'])?saved[surface+'Grout']:'light';
  state[surface+'Grain']=C.grainMode(saved[surface+'Grain']);
  state[surface+'GrainSeed']=C.grainSeed(saved[surface+'GrainSeed']);
 }
 let revision=0,ready=false,fade=null;
 function fitPreview(){
  const width=Math.min(R.width,Math.round(stage.clientWidth*(window.devicePixelRatio||1)));
  const surface=compactView.matches&&width>0?display.getContext('2d'):null;
  display.hidden=!surface;
  stage.classList.toggle('is-scaled',Boolean(surface));
  if(!surface)return canvas;
  // Resample the small screen preview so fine diagonal joints stay continuous.
  display.width=width;display.height=Math.round(width*R.height/R.width);
  surface.imageSmoothingQuality='high';
  surface.drawImage(canvas,0,0,display.width,display.height);
  return display;
 }
 if(typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(()=>{if(ready)fitPreview();});
  observer.observe(stage);
 }
 $('selection-note').textContent=room.separateWalls?'Wand und Boden einzeln kombinieren.':'Materialien für '+room.surfaceName+' vergleichen.';
 $('quantity-note').textContent=(room.separateWalls?'Nur die geflieste Fläche einschließlich Dusche eintragen; Boden ohne Duschwanne. ':'Bitte Ihre tatsächlich geflieste Fläche eintragen. ')+(room.approval||'Verpackungseinheiten, Eignung und Verfügbarkeit bestätigt Yabis im Angebot.');
 if(params.has('product')&&!materials.includes(params.get('product'))){$('linked-note').hidden=false;$('linked-note').textContent='Für diesen Artikel ist in diesem Raum keine Vorschau verfügbar.';}
 $('height-control').hidden=!room.separateWalls;$('height-note').hidden=!room.separateWalls;
 const roomBase=selection=>C.scenePhoto(id,selection.cabinetTone);
 $('room-fallback').src='../'+roomBase(state)+'?v='+imageVersion;
 $('room-fallback').alt=room.name+' – realistische Gestaltungsvorschau';
 $('scene-caption').textContent='Raumvisualisierung · Muster und Farben können abweichen';
 function snapshot(){const data={...state};for(const surface of active){for(const field of ['Area','Waste'])data[surface+field]=$(`${surface}-${field.toLowerCase()}`).value;data[surface+'Included']=$('include-'+surface).checked;}return data;}
 function save(){try{localStorage.setItem(key,JSON.stringify(snapshot()));}catch{}}
 function load(src,roomImage=true){if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>{if(roomImage&&(image.naturalWidth!==R.width||image.naturalHeight!==R.height)){cache.delete(src);reject(Error('Diese Raumansicht passt nicht zur Raumvorlage.'));return;}resolve(image);};image.onerror=()=>{cache.delete(src);reject(Error('Die Materialansicht konnte nicht geladen werden. Bitte erneut auswählen.'));};image.src=src+'?v='+imageVersion;}));return cache.get(src);}
 const heightName=()=>state.wallHeight==='full'?'raumhoch':'1,20 m · Dusche raumhoch';
 function describe(){
  const surfaces=active.map(surface=>{
   const label=isBath?(surface==='floor'?'Boden':'Wand'):room.surfaceName;
   const format=slabSteps?'Durchgehende Stufen':C.isVinyl(state[surface])?'Fischgrät':state[surface+'Format'].join(' × ')+' cm · '+G.grouts[state[surface+'Grout']].label;
   return `${label}: ${C.choiceName(S.find(state[surface]))} · ${format}`+(isBath&&surface==='wall'?' · '+heightName():'');
  });
  return surfaces.join(' / ')+(id==='kueche'?' · Fronten: '+(state.cabinetTone==='dark'?'Anthrazit':'Hell'):'');
 }
 async function texture(surface,selection){
  const product=S.find(selection[surface]),vinyl=C.isVinyl(product.id);
  const src=vinyl?'assets/studio/texturen/'+product.id+'.webp':C.materialSample(product);
  const partialGloss=/Lappato/.test(product.finish)||product.id==='fiordi-bosco-sand-2';
  const gloss=product.finish==='Poliert' ? .22 : partialGloss ? .1 : 0;
  return [surface,{id:product.id,finish:product.finish,image:await load('../'+src,false),vinyl,gloss,
   sampleSize:product.studioSample?.size}];
 }
 async function draw(){
  const request=++revision,selection={...state};ready=false;$('add-to-cart').disabled=true;$('save-image').disabled=true;$('enlarge-view').disabled=true;
  $('stage').setAttribute('aria-busy','true');$('image-status').hidden=false;$('image-status').textContent='Materialansicht wird geladen …';
  try{
   if(!ctx)throw Error('Die Bildvorschau wird von diesem Browser nicht unterstützt. Bitte nutzen Sie den Shop.');
   const [entries,base]=await Promise.all([
    Promise.all(active.map(surface=>texture(surface,selection))),load('../'+roomBase(selection))
   ]);
   if(request!==revision)return;
   const assets=Object.fromEntries(entries);
   canvas.width=R.width;canvas.height=R.height;
   T.render(ctx,{room:id,base,selection,assets,photoLighting:true,scene,geometryApis:{bath:R,grid:G,living:W}});
   if(!assets.floor?.vinyl)G.draw(ctx,selection,R,base,true,scene);
   canvas.dataset.renderer='image';
   if(fade){fade.cancel();fade=null;}canvas.hidden=false;$('room-fallback').hidden=true;
   const visible=fitPreview();
   if(!motion.matches&&typeof visible.animate==='function')fade=visible.animate([{opacity:.8},{opacity:1}],{duration:240,easing:'ease-out'});
   canvas.setAttribute('aria-label',room.name+' · '+describe());$('combination').textContent=describe();
   $('stage').setAttribute('aria-busy','false');$('image-status').hidden=true;ready=true;$('save-image').disabled=false;$('enlarge-view').disabled=false;$('add-to-cart').disabled=false;save();
   if(document.documentElement?.classList.contains('room-arrival')){
    window.dispatchEvent(new CustomEvent('yabis-room-ready'));
   }
  }catch(error){if(request!==revision)return;$('stage').setAttribute('aria-busy','false');$('image-status').textContent=error.message;$('image-status').hidden=false;}
 }
 motion.addEventListener('change',()=>{if(fade)fade.cancel();});
 function sampleImage(product,alt=''){
  const image=new Image();
  image.src='../'+C.materialSample(product);image.alt=alt;image.loading='lazy';
  return image;
 }
 function sources(){
  $('product-sources').replaceChildren();
  for(const product of new Set(active.map(surface=>state[surface]))){
   const p=S.find(product),block=document.createElement('div'),sample=document.createElement('div');
   block.className='source-product';sample.className='source-sample';
   sample.append(sampleImage(p,C.choiceName(p)));
   const text=document.createElement('div'),title=document.createElement('strong');
   title.textContent=C.choiceName(p);text.append(title);
   if(S.availabilityLabel){const avail=document.createElement('small');avail.className='source-availability availability--'+S.availability(p);avail.textContent=S.availabilityLabel(p);text.append(avail);}
   block.append(sample,text);$('product-sources').append(block);
  }
 }
 function chooseMaterial(surface,product){
  if(state[surface]===product)return;
  state[surface]=product;
  state[surface+'Format']=C.demoFormat(product);
  state[surface+'FormatChosen']=false;
 }
 function showChoice(surface){
  const row=$(`${surface}-materials`);
  if(row.scrollWidth<=row.clientWidth)return;
  const selected=row.querySelector('[data-product="'+state[surface]+'"]');
  row.scrollLeft=Math.max(0,selected.offsetLeft-row.firstElementChild.offsetLeft);
 }
 const presetButtons=C.presetsFor(id).map(({id:presetId,name,...values})=>{
  const button=document.createElement('button'),previews=document.createElement('span');
  const copy=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');
  const products=active.map(surface=>S.find(values[surface]));
  button.type='button';button.className='preset';button.dataset.preset=presetId;
  previews.className='preset-swatches';previews.setAttribute('aria-hidden','true');
  for(const product of products)previews.append(sampleImage(product));
  if(values.cabinetTone){
   const tone=document.createElement('span');tone.className='front-tone front-tone-'+values.cabinetTone;previews.append(tone);
  }
  title.textContent=name;
  detail.textContent=products.map(C.choiceName).concat(values.cabinetTone?[values.cabinetTone==='dark'?'Fronten Anthrazit':'Helle Fronten']:[]).join(' / ');
  copy.append(title,detail);button.append(previews,copy);
  button.addEventListener('click',()=>{
   for(const surface of active)chooseMaterial(surface,values[surface]);
   Object.assign(state,values);
   update();
   for(const surface of active)showChoice(surface);
  });
  $('preset-choices').append(button);
  return {button,values};
 });
 $('presets').hidden=!presetButtons.length;
 function update(){
  if(id==='kueche')for(const tone of ['light','dark'])$('fronts-'+tone).setAttribute('aria-pressed',String(state.cabinetTone===tone));
  for(const {button,values} of presetButtons)button.setAttribute('aria-pressed',String(Object.entries(values).every(([key,value])=>state[key]===value)));
  for(const surface of active){
   for(const button of $(`${surface}-materials`).querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.product===state[surface]));
   $(`${surface}-format`).value=state[surface+'Format'].join(',');$(`${surface}-grout`).value=state[surface+'Grout'];
   const vinyl=C.isVinyl(state[surface]);
   $(`${surface}-options`).hidden=vinyl||slabSteps;
   $(`${surface}-grain-options`).hidden=vinyl;
   $(`${surface}-grain`).value=state[surface+'Grain'];
  }
  $('wall-height').value=state.wallHeight;$('height-note').textContent=state.wallHeight==='120'?'Darüber weiß gestrichen, mit Abschlussprofil. Dusche immer raumhoch.':'Alle Wandflächen bis zur Decke gefliest.';
  $('format-note').textContent=slabSteps
   ?'Tritt- und Setzstufen aus einem Stück. Maße und Zuschnitt stimmt Yabis im Angebot mit Ihnen ab.'
   :C.isVinyl(state[room.surface])
   ?'Fischgrät ohne Fliesenfuge. Dielenmaß und Ausführung bestätigt Yabis im Angebot.'
   :'Kreuzfuge · 3 mm in der Vorschau. Die verfügbaren Formate bestätigt Yabis im Angebot.';
  sources();quantities();draw();
 }
 for(const surface of ['floor','wall']){
  const included=active.includes(surface);$(`${surface}-fieldset`).hidden=!included;$(`${surface}-quantity-row`).hidden=!included;
  $(`include-${surface}`).checked=included&&(typeof saved[surface+'Included']!=='boolean'||saved[surface+'Included']);
  if(!included){$(`${surface}-area`).disabled=true;$(`${surface}-waste`).disabled=true;continue;}
  if(!room.separateWalls){$(`${surface}-legend`).textContent=room.surfaceName;$(`include-${surface}-label`).textContent=room.surfaceName+' anfragen';}
  if(S.validArea(saved[surface+'Area']))$(`${surface}-area`).value=saved[surface+'Area'];
  if(['0','5','10','15','20'].includes(String(saved[surface+'Waste'])))$(`${surface}-waste`).value=saved[surface+'Waste'];
  const row=$(`${surface}-materials`);
  row.classList.toggle('materials--scroll',materials.length>3);
  for(const product of materials){
   const p=S.find(product),button=document.createElement('button'),title=document.createElement('strong'),detail=document.createElement('small');
   button.type='button';button.className='material';button.dataset.product=product;
   button.setAttribute('aria-label',(surface==='floor'?'Boden':'Wand')+': '+C.choiceName(p));
   title.textContent=C.choiceName(p);detail.textContent=C.isVinyl(product)?'Vinyl · Fischgrät':p.finish;
   button.append(sampleImage(p),title,detail);
   button.addEventListener('click',()=>{
    if(state[surface]===product){if(!ready)draw();return;}
    chooseMaterial(surface,product);
    update();
   });
   row.append(button);
  }
  showChoice(surface);
  for(const field of ['area','waste'])$(`${surface}-${field}`).addEventListener('input',()=>{quantities();save();});
  $(`include-${surface}`).addEventListener('change',()=>{quantities();save();});
  $(`${surface}-format`).addEventListener('change',()=>{state[surface+'Format']=G.format($(`${surface}-format`).value);state[surface+'FormatChosen']=true;update();});
  $(`${surface}-grout`).addEventListener('change',()=>{state[surface+'Grout']=$(`${surface}-grout`).value;update();});
  $(`${surface}-grain`).addEventListener('change',()=>{
   state[surface+'Grain']=C.grainMode($(`${surface}-grain`).value);
   draw();
  });
  $(`${surface}-grain-shuffle`).addEventListener('click',()=>{
   state[surface+'GrainSeed']=(state[surface+'GrainSeed']+1)&0x7fffffff;
   draw();
  });
 }
 $('kitchen-fronts').hidden=id!=='kueche';
 if(id==='kueche')for(const tone of ['light','dark'])$('fronts-'+tone).addEventListener('click',()=>{state.cabinetTone=tone;update();});
 $('wall-height').addEventListener('change',()=>{state.wallHeight=$('wall-height').value==='full'?'full':'120';update();});
 function requestFormat(surface){
  const product=S.find(state[surface]),format=state[surface+'Format'];
  if(slabSteps||C.isVinyl(product.id))return null;
  if(state[surface+'FormatChosen'])return format;
  return product.formats.some(f=>f.join(',')===format.join(','))?format:null;
 }
 function quantities(){for(const surface of active){const included=$('include-'+surface).checked;$(`${surface}-area`).disabled=!included;$(`${surface}-waste`).disabled=!included;const q=S.calculate($(`${surface}-area`).value,$(`${surface}-waste`).value,requestFormat(surface));$(`${surface}-quantity`).textContent=!included?'Wird nicht angefragt.':q?`${S.de(q.total)} m² inkl. Verschnitt`+(q.pieces===null?' · Format auf Anfrage':` · rechnerisch ${q.pieces} Fliesen`):'Bitte Ihre Fläche eintragen.';}$('cart-status').textContent='';$('to-cart').hidden=true;}
 $('request-selection').addEventListener('submit',event=>{
  event.preventDefault();if(!ready){$('cart-status').textContent='Bitte warten, bis Ihre gewählte Materialansicht geladen ist.';return;}
  const selected=active.filter(surface=>$('include-'+surface).checked);if(!selected.length){$('cart-status').textContent='Bitte mindestens eine Fläche für Ihre Anfrage auswählen.';return;}
  try{
   const items=selected.map(surface=>{
    const product=state[surface],vinyl=C.isVinyl(product);
    return S.item({product,area:$(`${surface}-area`).value,waste:$(`${surface}-waste`).value,format:requestFormat(surface),
     surface:room.separateWalls?(surface==='floor'?'Boden (ohne Duschwanne)':'Wand'):room.surfaceName,room:room.name,
     applicationNote:room.approval||'',pattern:slabSteps?'Durchgehende Stufen':vinyl?'Fischgrät':'Kreuzfuge',
     grout:vinyl||slabSteps?'':G.grouts[state[surface+'Grout']].label,
     wallHeight:room.separateWalls&&surface==='wall'?state.wallHeight:null});
   });
   S.add(items);$('cart-status').textContent='Ihre Auswahl für '+room.name+' liegt im Anfragekorb.';$('to-cart').hidden=false;save();
  }catch(error){$('cart-status').textContent=error.message;}
 });
 $('save-image').addEventListener('click',()=>{if(!ready)return;canvas.toBlob(blob=>{if(!blob){$('image-status').hidden=false;$('image-status').textContent='Das Bild konnte nicht gespeichert werden.';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Yabis-${id}-${active.map(surface=>surface+'-'+state[surface]).join('-')}${room.separateWalls?'-'+state.wallHeight:''}${id==='kueche'?(state.cabinetTone==='dark'?'-fronten-anthrazit':'-fronten-hell'):''}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');});
 update();
})();
