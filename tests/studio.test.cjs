const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../js/studio-core.js'),grid=require('../konfigurator-neu/tile-grid.js');
const scenes=require('../js/studio-scenes.js'),livingFloor=require('../js/living-floor.js');
const root=path.join(__dirname,'..');
test('Wandtexturen und Fugen teilen dieselbe Projektion ober- und unterhalb von 1,20 m',()=>{
 const {inverseWall}=require('../js/studio-textures.js');
 for(const key of ['left','back','right']){
  const plane=grid.planes[key].matrix,unproject=inverseWall(plane);
  for(const [u,v] of [[42,36],[120,120],[160,180],[230,225]]){
   const [x,y]=grid.project(plane,[u,v]),[U,V]=unproject(x,y);
   assert.ok(Math.abs(u-U)<1e-6&&Math.abs(v-V)<1e-6,key);
  }
 }
});
test('Studio-Auswahl bleibt unabhängig vom Shop und ungültige Links bleiben im Bad',()=>{
 assert.deepEqual(C.materials,['habitat-perla','bercy-terra']);assert.equal(C.roomId('__proto__'),'bad');assert.equal(C.roomId('unknown'),'bad');assert.equal(C.materialId('bianco-mare'),'habitat-perla');
 assert.equal(C.href('eingang','bercy-terra'),'studio/index.html?raum=eingang');assert.equal(C.href('unknown','bianco-mare'),'studio/index.html?raum=bad');
 assert.deepEqual(C.materialsFor('eingang'),['cambridge','miami','lissabon','porto','radeburg'].map(id=>'terrassenplatte-'+id));
 assert.equal(C.shoppingDestination('terrassenplatte-porto'),'studio/index.html?raum=eingang&product=terrassenplatte-porto');
 assert.deepEqual(C.materialsFor('balkon'),[...C.materials,...['cambridge','miami','lissabon','porto'].map(id=>'terrassenplatte-'+id)]);
 assert.equal(C.initial('balkon',{floor:'terrassenplatte-radeburg'},'terrassenplatte-radeburg').floor,'habitat-perla');
 assert.equal(C.materialsFor('treppe').length,7);
 assert.ok(C.materialsFor('treppe').includes('fiordi-bosco-sand'));
 assert.equal(C.initial('kueche',{},'flavio-oxido').wall,'flavio-oxido');
 assert.equal(C.initial('wohnen',{},'ganges-visgraat').floor,'ganges-visgraat');
 assert.equal(C.initial('bad',{},'ganges-visgraat').floor,'wonder-base');
 assert.equal(C.shoppingDestination('rijn-visgraat'),'studio/index.html?raum=wohnen&product=rijn-visgraat');
 assert.equal(C.shoppingDestination('bercy-terra'),null);
});
test('Alle sechs Einstiege, Bilder und lokalen Studio-Assets sind vorhanden',()=>{
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const id of Object.keys(C.rooms)){
  assert.match(home,new RegExp('href="studio/index.html\\?raum='+id+'" data-studio-entry="'+id+'"'));
  assert.ok(fs.existsSync(path.join(root,C.rooms[id].image)),C.rooms[id].image);
  if(id!=='bad')for(const material of C.materials)assert.ok(fs.existsSync(path.join(root,C.plate(id,material))));
 }
 for(const product of C.materialsFor('eingang'))assert.ok(fs.existsSync(path.join(root,'assets/studio/aussenansichten',product+'.webp')));
 assert.equal(C.motionAllowed({reduced:true}),false);assert.equal(C.motionAllowed({saveData:true}),false);assert.equal(C.motionAllowed(),true);
});
function app(room='bad',{saved=new Map(),defer=false,product='',fronts='',withoutCatalog=false}={}){
 const elements=new Map(),events={},sources=[],pending=[],draws=[];
 class Element{
  constructor(id=''){this.id=id;this.value='';this.checked=true;this.disabled=false;this.hidden=false;this.dataset={};this.children=[];this.attributes={};this.events={};this.style={};this.naturalWidth=1672;this.naturalHeight=941;this.offsetLeft=0;this.classList={toggle(){}};}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelectorAll(){return this.children;}
  querySelector(selector){return this.children.find(el=>selector.includes('"'+el.dataset.product+'"'));}
  get firstElementChild(){return this.children[0];}
  fire(type){for(const fn of this.events[type]||[])fn({preventDefault(){}});}
  getContext(){return {drawImage(image){draws.push(image._src);},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){}};}
  toBlob(fn){fn({});}
  click(){this.fire('click');}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
 for(const surface of ['floor','wall']){get(surface+'-waste').value='10';}
 const window={YabisLivingFloor:livingFloor,YabisStudioScenes:scenes,YabisStudio:C,YabisRoomPreview:{width:1672,height:941},YabisTileGrid:{...grid,draw(){}},YabisStudioTextures:{render(ctx,{room,base,selection,assets}){draws.push({room,base:base.src,...selection,assets});}},addEventListener(type,fn){events[type]=fn;},dispatchEvent(e){events[e.type]?.(e);}};
 class Image extends Element{set src(src){this._src=src;sources.push(src);if(defer)pending.push(this);else queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
 const context={window,document:{body:{dataset:{}},title:'',getElementById:get,createElement:tag=>new Element(tag),querySelectorAll(){return [];}},matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},location:{search:'?raum='+room+(product?'&product='+product:'')+(fronts?'&fronten='+fronts:'')},Image,URLSearchParams,URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL(){}},setTimeout(){},CustomEvent:class{constructor(type){this.type=type;}},crypto:crypto.webcrypto};
 for(const file of withoutCatalog?['js/shop-core.js']:['daten/katalog.js','js/shop-core.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(path.join(root,'studio/studio.js'),'utf8'),context);
 return {get,window,sources,pending,draws,saved,shop:window.YabisShop,settle:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('Räume mit Materialauswahl wechseln das Bild und übernehmen nur ihre tatsächlichen Flächen in den Korb',async()=>{
 for(const id of Object.keys(C.rooms).filter(id=>C.materialsFor(id).length)){
  const a=app(id);await a.settle();assert.equal(a.get('add-to-cart').disabled,false,id);
  assert.equal(a.get('room-preview').width,1672,id);assert.equal(a.get('room-preview').height,941,id);
  const room=C.rooms[id],surface=room.surface;
  a.get(surface+'-materials').children[1].click();await a.settle();
  a.get(surface+'-area').value='12.5';a.get(surface+'-area').fire('input');
  if(room.separateWalls){a.get('wall-area').value='18';a.get('wall-area').fire('input');}
  a.get('request-selection').fire('submit');const cart=a.shop.getCart();assert.equal(cart.length,room.separateWalls?2:1,id);
  assert.equal(cart[0].raum,room.name);assert.equal(cart.find(x=>x.flaeche.includes(room.separateWalls?'Boden':room.surfaceName)).produkt,C.materialsFor(id)[1]);
  assert.match(a.shop.lines(cart),new RegExp('Bereich: '+room.name));assert.match(a.shop.lines(cart),/13,75 m²/);
  if(room.approval)assert.ok(a.shop.lines(cart).includes(room.approval));
  if(id!=='bad'){
   if(id==='eingang'){
    assert.equal(a.get('room-preview').dataset.renderer,'photo');
    assert.ok(a.draws.at(-1).includes('aussenansichten/'+C.materialsFor(id)[1]+'.webp'));
    assert.ok(a.draws.at(-2).includes(C.scenePhoto(id)));
   }else{
    assert.equal(a.draws.at(-1)[surface],C.materialsFor(id)[1]);
    assert.ok(a.draws.at(-1).base.includes(C.scenePhoto(id)));
   }
   assert.equal(a.get((surface==='floor'?'wall':'floor')+'-area').disabled,true);
  }
 }
});
test('Bei fehlenden Katalogartikeln zeigt der Außenbereich die Projektanfrage',()=>{
 const a=app('eingang',{withoutCatalog:true});
 assert.equal(a.get('auswahl').hidden,true);
 assert.equal(a.get('exterior-advice').hidden,false);
 assert.equal(a.get('skip-to-controls').href,'#exterior-advice');
 assert.equal(a.get('room-fallback').src,'../'+C.rooms.eingang.image);
 assert.equal(a.draws.length,0);
});
test('Außenplatten verwenden feste Verlegebilder und das Katalogformat für die Anfrage',async()=>{
 const saved=new Map([['yabis-studio-v1-eingang',JSON.stringify({floorGrout:'dark',floorGrain:'natural',floorGrainChosen:true})]]);
 const a=app('eingang',{product:'terrassenplatte-radeburg',saved});
 await a.settle();
 assert.equal(a.get('floor-materials').children.length,5);
 assert.equal(a.get('floor-format-label').hidden,true);
 assert.equal(a.get('floor-options').hidden,true);
 assert.equal(a.get('floor-grain-options').hidden,true);
 assert.match(a.draws.at(-1),/aussenansichten\/terrassenplatte-radeburg\.webp/);
 const button=a.get('floor-materials').children.find(element=>element.dataset.product==='terrassenplatte-radeburg');
 assert.equal(button.children[0].src,'../'+a.shop.find('terrassenplatte-radeburg').reconstruction);
 assert.match(a.get('combination').textContent,/Radeburg.*120 × 40 cm/);
 const [landing]=scenes.scene('eingang',grid,livingFloor).faces;
 const joints=grid.joints(landing.plane,[40,120]);
 assert.equal(joints.find(joint=>joint.axis==='u'&&joint.position>0).position,120);
 assert.equal(joints.find(joint=>joint.axis==='v'&&joint.position>0).position,40);
 a.get('floor-area').value='10';a.get('request-selection').fire('submit');
 assert.equal(a.shop.getCart()[0].format.join(','),'120,40');
 assert.equal(a.shop.getCart()[0].fuge,'');
 assert.equal(a.shop.getCart()[0].verband,'');
 assert.match(a.shop.lines(a.shop.getCart()),/23 Fliesen/);
 const restored=app('eingang',{saved:a.saved});await restored.settle();
 assert.equal(restored.get('floor-options').hidden,true);
 assert.match(restored.draws.at(-1),/aussenansichten\/terrassenplatte-radeburg\.webp/);
});
test('Balkon übernimmt für Terrassenplatten Format, Fugenraster und Stückzahl aus dem Katalog',async()=>{
 const saved=new Map([['yabis-studio-v1-balkon',JSON.stringify({floor:'terrassenplatte-porto',floorFormat:[60,120],floorFormatChosen:true})]]);
 const a=app('balkon',{saved});await a.settle();
 assert.equal(a.get('floor-materials').children.length,6);
 assert.equal(a.get('floor-format-label').hidden,true);
 assert.equal(a.get('floor-grout').disabled,false);
 assert.equal(a.draws.at(-1).floorFormat.join(','),'60,90');
 assert.equal(a.draws.at(-1).assets.floor.terrace,true);
 const [floor]=scenes.scene('balkon',grid,livingFloor).faces;
 assert.equal(grid.joints(floor.plane,[60,90]).find(joint=>joint.axis==='u'&&joint.position>0).position,60);
 a.get('floor-area').value='10';a.get('request-selection').fire('submit');
 assert.equal(a.shop.getCart()[0].format.join(','),'60,90');
 assert.match(a.shop.lines(a.shop.getCart()),/21 Fliesen/);
 a.get('floor-materials').children[0].click();await a.settle();
 assert.equal(a.get('floor-format-label').hidden,false);
 assert.equal(a.draws.at(-1).floorFormat.join(','),'60,120');
});
test('Bad behält separate Formate, Fugen, Höhe und Mengen; andere Räume erben keine Bad-Einstellungen',async()=>{
 const a=app();await a.settle();a.get('floor-format').value='60,60';a.get('floor-format').fire('change');a.get('floor-grout').value='dark';a.get('floor-grout').fire('change');a.get('wall-height').value='full';a.get('wall-height').fire('change');await a.settle();
 a.get('floor-area').value='12';a.get('wall-area').value='25';a.get('request-selection').fire('submit');const cart=a.shop.getCart();assert.equal(cart[0].fuge,'Anthrazit');assert.equal(cart[0].format.join(','),'60,60');assert.equal(cart[0].requested,true);assert.equal(cart[1].wallHeight,'full');assert.match(a.shop.lines(cart),/37 Fliesen/);
 const restored=app('bad',{saved:a.saved});await restored.settle();assert.equal(restored.get('floor-format').value,'60,60');assert.equal(restored.get('wall-height').value,'full');
 const kitchen=app('kueche',{saved:a.saved,product:'flavio-oxido'});await kitchen.settle();assert.equal(kitchen.get('wall-format').value,'60,120');assert.equal(kitchen.get('height-control').hidden,true);
 assert.ok(a.sources.filter(src=>src.includes('assets/studio/bad-')).length<=4,'Es werden nur benötigte Bad-Platten geladen');assert.equal(a.shop.products.filter(product=>product.kind!=='Terrassenplatten').length,287,'Shopimport und drei Bestseller-Ergänzungen');
 assert.equal(a.shop.products.filter(product=>product.kind==='Terrassenplatten').length,29);
});
function pendingLoad(a,src){
 return a.pending.find(image=>image.onload&&image.src.split('?')[0]==='../'+src);
}
test('Eine verspätete Bildantwort überschreibt niemals die zuletzt gewählte Fliese',async()=>{
 const a=app('balkon',{defer:true});a.get('floor-materials').children[1].click();
 pendingLoad(a,C.scenePhoto('balkon')).onload();
 pendingLoad(a,C.materialSample(a.shop.find('bercy-terra'))).onload();await a.settle();
 assert.equal(a.draws.at(-1).floor,'bercy-terra');
 pendingLoad(a,C.materialSample(a.shop.find('habitat-perla'))).onload();await a.settle();
 assert.equal(a.draws.at(-1).floor,'bercy-terra');
});
test('Bei einem fehlgeschlagenen Materialbild wird keine unsichtbare Konfiguration angefragt',async()=>{
 const a=app('balkon',{defer:true});
 pendingLoad(a,C.scenePhoto('balkon')).onload();
 pendingLoad(a,C.materialSample(a.shop.find('habitat-perla'))).onload();await a.settle();
 a.get('floor-materials').children[1].click();
 pendingLoad(a,C.materialSample(a.shop.find('bercy-terra'))).onerror();await a.settle();
 assert.equal(a.get('add-to-cart').disabled,true);a.get('floor-area').value='10';a.get('request-selection').fire('submit');assert.equal(a.shop.getCart().length,0);assert.match(a.get('image-status').textContent,/erneut auswählen/);
});
test('Raumbilder mit falschen Abmessungen werden vor dem Rendern abgewiesen',async()=>{
 for(const id of Object.keys(C.rooms).filter(id=>C.materialsFor(id).length)){
  const a=app(id,{defer:true}),wrong=a.pending.find(image=>/^\.\.\/assets\/studio\/[^/]+\.webp$/.test(image._src.split('?')[0]));
  wrong.naturalWidth=1536;wrong.naturalHeight=1024;
  for(const image of a.pending)image.onload?.();await a.settle();
  assert.equal(a.get('add-to-cart').disabled,true,id);assert.match(a.get('image-status').textContent,/passt nicht zur Raumvorlage/);assert.equal(a.draws.length,0,id);
 }
});
test('Helle und dunkle Küchenfronten lassen sich unabhängig vom Dekor wählen und wiederherstellen',async()=>{
 for(const material of C.materials)for(const tone of ['light','dark'])assert.ok(fs.existsSync(path.join(root,C.plate('kueche',material,tone))));
 const a=app('kueche');await a.settle();assert.equal(a.get('kitchen-fronts').hidden,false);
 a.get('wall-materials').children[1].click();await a.settle();a.get('fronts-dark').click();await a.settle();
 assert.match(a.draws.at(-1).base,/kueche-dunkel-foto-neutral\.webp/);assert.match(a.get('combination').textContent,/Luna Offwhite.*Anthrazit/);
 a.get('wall-area').value='6';a.get('request-selection').fire('submit');const cart=a.shop.getCart();assert.equal(cart.length,1);assert.equal(cart[0].produkt,'luna-offwhite');assert.equal(cart[0].flaeche,'Küchenrückwand');
 a.get('wall-materials').children[0].click();await a.settle();assert.match(a.draws.at(-1).base,/kueche-dunkel-foto-neutral\.webp/);
 const restored=app('kueche',{saved:a.saved});await restored.settle();assert.equal(restored.get('fronts-dark').attributes['aria-pressed'],'true');
 restored.get('fronts-light').click();await restored.settle();assert.match(restored.draws.at(-1).base,/kueche-foto-neutral\.webp/);
 const linked=app('kueche',{fronts:'dark',product:'flavio-oxido'});await linked.settle();assert.equal(linked.draws.at(-1).wall,'flavio-oxido');assert.match(linked.draws.at(-1).base,/kueche-dunkel-foto-neutral\.webp/);
 assert.equal(app('bad').get('kitchen-fronts').hidden,true);assert.equal(C.initial('bad',{cabinetTone:'dark'}).cabinetTone,undefined);
});

test('Treppenanfragen übernehmen durchgehende Stufen ohne Fuge oder Fliesenformat',async()=>{
 const saved=new Map([['yabis-studio-v1-treppe',JSON.stringify({floor:'habitat-perla',floorFormat:[60,60],floorFormatChosen:true,floorGrout:'dark'})]]);
 const a=app('treppe',{saved});await a.settle();
 assert.equal(a.get('floor-options').hidden,true);
 assert.match(a.get('combination').textContent,/Durchgehende Stufen/);
 a.get('floor-area').value='6';a.get('request-selection').fire('submit');
 const [position]=a.shop.getCart();
 assert.equal(position.format,null);
 assert.equal(position.fuge,'');
 assert.equal(position.verband,'Durchgehende Stufen');
});

const nativeCanvas=process.env.YABIS_CANVAS_PACKAGE;
test('Die Raumfotomasken schützen Möbel, Treppenwand und Pflanzen beim Dekorwechsel',{skip:!nativeCanvas},async()=>{
 const {createCanvas,loadImage}=require(nativeCanvas);
 const bath=require('../konfigurator-neu/standbild-renderer.js'),textures=require('../js/studio-textures.js');
 const doc={createElement(){const canvas=createCanvas(1,1);canvas.ownerDocument=doc;return canvas;}};
 const canvas=doc.createElement();canvas.width=bath.width;canvas.height=bath.height;
 const ctx=canvas.getContext('2d'),image=createCanvas(120,60),brush=image.getContext('2d');
 brush.fillStyle='#594237';brush.fillRect(0,0,image.width,image.height);
 const asset={image,id:'bercy-terra',gloss:0};
 const pixel=([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data);
 const rooms={
  wohnen:{surface:'floor',tiled:[[800,850],[1424,544]],fixed:[[800,700],[1350,400],[1424,524],[1414,525]]},
  kueche:{surface:'wall',tiled:[[800,475]],fixed:[[1049,431],[800,625]]},
  balkon:{surface:'floor',tiled:[[700,700]],fixed:[[480,495],[1430,615]]},
  treppe:{surface:'floor',tiled:[[700,780],[700,870]],fixed:[[1400,500]]},
  eingang:{surface:'floor',tiled:[[950,620],[900,711],[900,840]],fixed:[[1100,500]]}
 };
 for(const [room,{surface,tiled,fixed}] of Object.entries(rooms)){
  const base=await loadImage(path.join(root,C.scenePhoto(room)));
  ctx.drawImage(base,0,0);
  const initial=tiled.map(pixel),objects=fixed.map(pixel);
  textures.render(ctx,{room,base,photoLighting:true,selection:{wallHeight:'120',[surface+'Format']:[60,120]},
   assets:{[surface]:asset},geometryApis:{bath,grid,living:livingFloor}});
  assert.deepEqual(fixed.map(pixel),objects,room);
  assert.ok(tiled.every((p,i)=>initial[i][0]-pixel(p)[0]>35),room);
  if(room==='treppe'){
   const snapshot=canvas.toBuffer('image/png');
   const scene=scenes.scene(room,grid,livingFloor),selection={floorFormat:[60,60],floorGrout:'dark'};
   textures.render(ctx,{room,base,selection,assets:{floor:asset},photoLighting:true,scene,
    geometryApis:{bath,grid,living:livingFloor}});
   grid.draw(ctx,selection,bath,base,true,scene);
   assert.deepEqual(canvas.toBuffer('image/png'),snapshot);
  }
 }
});

test('Ruhiger Fliesenboden übernimmt keine harten Plattengrenzen aus der Raumvorlage',{skip:!nativeCanvas},()=>{
 const {createCanvas}=require(nativeCanvas),textures=require('../js/studio-textures.js');
 const doc={createElement(){const canvas=createCanvas(1,1);canvas.ownerDocument=doc;return canvas;}};
 const canvas=doc.createElement();canvas.width=1672;canvas.height=941;
 const base=createCanvas(1672,941),b=base.getContext('2d'),image=createCanvas(120,60),g=image.getContext('2d');
 b.fillStyle='#ececec';b.fillRect(0,0,1672,941);
 b.fillStyle='#acacac';b.fillRect(900,0,772,941);
 g.fillStyle='#c8c8c8';g.fillRect(0,0,120,60);
 const ctx=canvas.getContext('2d');
 textures.render(ctx,{room:'wohnen',base,selection:{floorFormat:[60,120]},assets:{floor:{id:'luna-offwhite',image,gloss:0}},
  geometryApis:{grid,living:{floor:[[[0,650],[1672,650],[1672,941],[0,941]]],occlusions:[]}}});
 const [light,dark]=[899,900].map(x=>ctx.getImageData(x,830,1,1).data[0]);
 assert.ok(Math.abs(light-dark)<=2,[light,dark]);
 assert.ok(ctx.getImageData(750,830,1,1).data[0]>ctx.getImageData(1050,830,1,1).data[0]);
});

test('Fischgrät bildet rechteckige Dielen auch bei 15,8 × 76 cm ohne leere Bänder ab',()=>{
 const {plankAt}=require('../js/studio-textures.js'),sample={};
 for(const [width,length] of [[15,75],[15.8,76]]){
  for(let x=-150.1;x<=150;x+=2.47)for(let y=-150.7;y<=150;y+=2.39){
   const {edge,s,t,horizontal,band,index}=plankAt(x,y,width,length,sample);
   assert.ok(edge>=-1e-9);
   const originX=index*width+band*length,originY=index*width-band*length;
   assert.ok(Math.abs(x-(horizontal?originX+s*length:originX+length+t*width))<1e-9);
   assert.ok(Math.abs(y-(horizontal?originY+t*width:originY+width-s*length))<1e-9);
  }
 }
});
test('Presets übernehmen passende Materialien und Fugen. Die Maserung bleibt pro Fläche verstellbar.',async()=>{
 const a=app('bad');await a.settle();
 const warm=a.get('preset-choices').children.find(button=>button.dataset.preset==='warm');
 a.get('floor-area').value='8';
 warm.click();await a.settle();
 assert.equal(warm.attributes['aria-pressed'],'true');
 assert.equal(a.draws.at(-1).floor,'marshall-desert');
 assert.equal(a.draws.at(-1).wall,'habitat-marfil');
 assert.equal(a.get('floor-grout').value,'sand');
 assert.equal(a.get('floor-area').value,'8');
 a.get('wall-grain').value='continuous';a.get('wall-grain').fire('change');
 a.get('wall-grain-shuffle').click();await a.settle();
 const last=JSON.parse(a.saved.get('yabis-studio-v1-bad'));
 assert.equal(last.wallGrain,'continuous');assert.equal(last.wallGrainSeed,1);assert.equal(last.floorGrainSeed,0);
 const restored=app('bad',{saved:a.saved});await restored.settle();
 assert.equal(restored.get('wall-grain').value,'continuous');
 restored.get('floor-grout').value='dark';restored.get('floor-grout').fire('change');await restored.settle();
 assert.equal(restored.get('preset-choices').children[0].attributes['aria-pressed'],'false');
 const kitchen=app('kueche');await kitchen.settle();
 kitchen.get('preset-choices').children.find(button=>button.dataset.preset==='kontrast').click();await kitchen.settle();
 assert.equal(kitchen.draws.at(-1).wall,'flavio-oxido');
 assert.equal(kitchen.get('fronts-dark').attributes['aria-pressed'],'true');
 const vinyl=app('wohnen',{product:'rijn-visgraat'});await vinyl.settle();
 assert.equal(vinyl.get('floor-grain-options').hidden,true);
});

test('Durchlaufende Maserung ist Standard und neue manuelle Einstellungen werden pro Fläche gespeichert',async()=>{
 const saved=new Map([['yabis-studio-v1-bad',JSON.stringify({floorGrain:'natural',wallGrain:'natural'})]]);
 const a=app('bad',{saved});await a.settle();
 assert.equal(a.get('floor-grain').value,'continuous');
 assert.equal(a.get('wall-grain').value,'continuous');
 assert.equal(a.draws.at(-1).floorGrain,'continuous');
 a.get('wall-grain').value='natural';a.get('wall-grain').fire('change');
 const restored=app('bad',{saved});await restored.settle();
 assert.equal(restored.get('floor-grain').value,'continuous');
 assert.equal(restored.get('wall-grain').value,'natural');
 assert.equal(restored.draws.at(-1).wallGrain,'natural');
 const outdoor=app('eingang');await outdoor.settle();
 assert.equal(outdoor.get('floor-grain').value,'continuous');
});

test('Maserung ändert nur die Materialpixel und schützt die Armaturkontur',{skip:!nativeCanvas},async()=>{
 const {createCanvas,loadImage}=require(nativeCanvas),bath=require('../konfigurator-neu/standbild-renderer.js');
 const living=require('../js/living-floor.js'),textures=require('../js/studio-textures.js');
 const doc={createElement(){const canvas=createCanvas(1,1);canvas.ownerDocument=doc;return canvas;}};
 const canvas=doc.createElement();canvas.width=bath.width;canvas.height=bath.height;
 const ctx=canvas.getContext('2d');
 const [base,image]=await Promise.all([C.bathPlate('habitat-perla'),C.additionalProducts['flavio-oxido'].photo].map(file=>loadImage(path.join(root,file))));
 const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
 ctx.drawImage(base,0,0);
 const fixture=pixel(323,371),bareWall=pixel(403,376);
 const render=(mode,seed)=>{
  textures.render(ctx,{room:'bad',base,selection:{wallHeight:'full',floorFormat:[60,120],wallFormat:[60,120],wallGrain:mode,wallGrainSeed:seed},
   assets:{floor:{image,gloss:0},wall:{image,gloss:0}},geometryApis:{bath,grid,living}});
  assert.deepEqual(pixel(323,371),fixture);
  assert.notDeepEqual(pixel(403,376),bareWall);
  return crypto.createHash('sha256').update(ctx.getImageData(565,390,250,220).data).digest('hex');
 };
 const natural=render('natural',0);
 assert.equal(natural,render('natural',0));
 assert.notEqual(natural,render('natural',1));
 assert.notEqual(natural,render('continuous',0));
});

test('Fotovorschau übernimmt das Wanddekor auf der befliesten WC-Drückerplatte',{skip:!nativeCanvas},async()=>{
 const {createCanvas,loadImage}=require(nativeCanvas);
 const bath=require('../konfigurator-neu/standbild-renderer.js'),textures=require('../js/studio-textures.js');
 const doc={createElement(){const surface=createCanvas(1,1);surface.ownerDocument=doc;return surface;}};
 const canvas=doc.createElement();canvas.width=bath.width;canvas.height=bath.height;
 const ctx=canvas.getContext('2d'),base=await loadImage(path.join(root,C.bathAssets.base));
 const ceramic=p=>({id:p,image:createCanvas(128,64),gloss:0});
 const light=ceramic('wonder-base'),dark=ceramic('flavio-oxido');
 for(const [asset,color] of [[light,'#ded0be'],[dark,'#634738']]){
  const brush=asset.image.getContext('2d');brush.fillStyle=color;brush.fillRect(0,0,128,64);
 }
 const read=asset=>{
  textures.render(ctx,{room:'bad',base,selection:{wallHeight:'120',floorFormat:[60,120],wallFormat:[60,120]},
   assets:{floor:light,wall:asset},geometryApis:{bath,grid}});
  return ctx.getImageData(1558,415,1,1).data[0];
 };
 assert.ok(read(light)-read(dark)>70);
});

test('Neue Badvorlage überträgt Tageslicht und Kontaktschatten auf das gewählte Dekor',{skip:!nativeCanvas},async()=>{
 const {createCanvas,loadImage}=require(nativeCanvas);
 const bath=require('../konfigurator-neu/standbild-renderer.js'),textures=require('../js/studio-textures.js');
 const doc={createElement(){const canvas=createCanvas(1,1);canvas.ownerDocument=doc;return canvas;}};
 const canvas=doc.createElement();canvas.width=bath.width;canvas.height=bath.height;
 const ctx=canvas.getContext('2d'),base=await loadImage(path.join(root,C.bathAssets.photo));
 const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
 ctx.drawImage(base,0,0);
 const ceramic=pixel(1410,682);
 const render=color=>{
  const image=createCanvas(120,60),brush=image.getContext('2d');
  brush.fillStyle=color;brush.fillRect(0,0,image.width,image.height);
  const asset={image,id:'wonder-base',gloss:0};
  textures.render(ctx,{room:'bad',base,photoLighting:true,
   selection:{wallHeight:'120',floorFormat:[60,120],wallFormat:[60,120]},
   assets:{floor:asset,wall:asset},geometryApis:{bath,grid}});
  assert.ok(pixel(1508,922)[0]-pixel(1523,851)[0]>35,'Schatten unter dem WC');
  assert.ok(pixel(807,665)[0]-pixel(807,730)[0]>12,'Tageslicht auf dem Boden');
  assert.deepEqual(pixel(1410,682),ceramic);
  return pixel(1558,415)[0];
 };
 assert.ok(render('#ddd2c3')-render('#776759')>70,'Wanddekor auf der Drückerplatte');
});

test('Alle aktiven Raumfotos und Küchenfronten haben exakt das Badformat', {skip:!nativeCanvas},async()=>{
 const {loadImage}=require(nativeCanvas),files=new Set(Object.values(C.bathAssets));
 for(const id of Object.keys(C.rooms))for(const material of C.materials){
  files.add(id==='bad'?C.bathPlate(material):C.plate(id,material));
  if(id==='kueche')files.add(C.plate(id,material,'dark'));
 }
 for(const id of Object.keys(C.rooms))files.add(C.scenePhoto(id));
 files.add(C.scenePhoto('kueche','dark'));
 for(const file of files){const im=await loadImage(path.join(root,file));assert.equal(im.width,1672,file);assert.equal(im.height,941,file);}
 assert.equal(files.size,23);
});

test('Wohnbereich behält eine gemeinsame Fotovorlage bei allen Materialwechseln und beim Wiederherstellen',async()=>{
 const a=app('wohnen');await a.settle();a.get('floor-materials').children[1].click();await a.settle();
 assert.equal(a.draws.at(-1).floor,'luna-offwhite');assert.ok(a.draws.at(-1).base.includes('wohnen-foto-neutral.webp'));
 a.get('floor-materials').children[0].click();await a.settle();assert.equal(a.draws.at(-1).floor,'wonder-base');
 a.get('floor-materials').children[1].click();await a.settle();const restored=app('wohnen',{saved:a.saved});await restored.settle();assert.equal(restored.draws.at(-1).floor,'luna-offwhite');
 assert.ok(!a.sources.some(src=>src.includes('assets/studio/wohnen-bercy-terra.webp')),'Die abweichende KI-Verlegung wird nie geladen.');
});

test('Alle Bestseller haben lokale Muster und Fischgrät-Anfragen übernehmen die erfasste Fläche',async()=>{
 const a=app('wohnen',{product:'rijn-visgraat'});await a.settle();
 const products=C.bestsellers.map(id=>a.shop.find(id));
 assert.equal(new Set(products.map(product=>product.name)).size,14);
 for(const product of products)assert.ok(fs.existsSync(path.join(root,C.materialSample(product))),product.id);
 for(const product of products.filter(p=>C.isVinyl(p.id)))assert.ok(fs.existsSync(path.join(root,'assets/studio/texturen',product.id+'.webp')));
 assert.equal(a.draws.at(-1).assets.floor.vinyl,true);
 a.get('floor-area').value='12';a.get('request-selection').fire('submit');
 const [item]=a.shop.getCart();
 assert.equal(item.produkt,'rijn-visgraat');assert.equal(item.verband,'Fischgrät');assert.equal(item.format,null);
 assert.match(a.shop.lines([item]),/13,2 m²/);
 assert.match(a.shop.item({product:'fiordi-bosco-sand-2',area:10,format:null}).name,/Leichter Glanz/);
 const supplement=a.shop.item({product:'capitol-hueso',area:10,format:null});
 assert.equal(supplement.format,null);
 assert.match(supplement.quelle,/ecoceramic\.es/);
 assert.equal(a.shop.priceLabel(a.shop.find('capitol-hueso')),'Preis auf Anfrage');
});
