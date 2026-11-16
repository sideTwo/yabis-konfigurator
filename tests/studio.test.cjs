const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../js/studio-core.js'),grid=require('../konfigurator-neu/tile-grid.js');
const root=path.join(__dirname,'..');
test('Studio-Auswahl bleibt unabhängig vom Shop und ungültige Links bleiben im Bad',()=>{
 assert.deepEqual(C.materials,['habitat-perla','bercy-terra']);assert.equal(C.roomId('__proto__'),'bad');assert.equal(C.roomId('unknown'),'bad');assert.equal(C.materialId('bianco-mare'),'habitat-perla');
 assert.equal(C.href('eingang','bercy-terra'),'studio/index.html?raum=eingang&product=bercy-terra');assert.equal(C.href('unknown','bianco-mare'),'studio/index.html?raum=bad');
 assert.equal(C.initial('kueche',{},'bercy-terra').wall,'bercy-terra');
});
test('Alle sechs Einstiege, Bilder und lokalen Studio-Assets sind vorhanden',()=>{
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const id of Object.keys(C.rooms)){
  assert.match(home,new RegExp('href="studio/index.html\\?raum='+id+'" data-studio-entry="'+id+'"'));
  assert.ok(fs.existsSync(path.join(root,C.rooms[id].image)),C.rooms[id].image);
  if(id!=='bad')for(const material of C.materials)assert.ok(fs.existsSync(path.join(root,C.plate(id,material))));
 }
 assert.equal(C.motionAllowed({reduced:true}),false);assert.equal(C.motionAllowed({saveData:true}),false);assert.equal(C.motionAllowed(),true);
});
function app(room='bad',{saved=new Map(),defer=false,product='',fronts=''}={}){
 const elements=new Map(),events={},sources=[],pending=[],draws=[];
 class Element{
  constructor(id=''){this.id=id;this.value='';this.checked=true;this.disabled=false;this.hidden=false;this.dataset={};this.children=[];this.attributes={};this.events={};this.style={};this.naturalWidth=1536;this.naturalHeight=1024;}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelectorAll(){return this.children;}
  fire(type){for(const fn of this.events[type]||[])fn({preventDefault(){}});}
  getContext(){return {drawImage(image){draws.push(image._src);}};}
  toBlob(fn){fn({});}
  click(){this.fire('click');}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
 for(const surface of ['floor','wall']){get(surface+'-waste').value='10';}
 const window={YabisStudio:C,YabisRoomPreview:{width:1672,height:941,render(ctx,s){draws.push({...s});}},YabisTileGrid:{...grid,draw(ctx,s){draws.push(JSON.parse(JSON.stringify(s)));}},addEventListener(type,fn){events[type]=fn;},dispatchEvent(e){events[e.type]?.(e);}};
 class Image extends Element{set src(src){this._src=src;if(src.includes('assets/studio/bad-')){this.naturalWidth=1672;this.naturalHeight=941;}sources.push(src);if(defer)pending.push(this);else queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
 const context={window,document:{body:{dataset:{}},title:'',getElementById:get,createElement:tag=>new Element(tag),querySelectorAll(){return [];}},matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},location:{search:'?raum='+room+(product?'&product='+product:'')+(fronts?'&fronten='+fronts:'')},Image,URLSearchParams,URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL(){}},setTimeout(){},CustomEvent:class{constructor(type){this.type=type;}},crypto:crypto.webcrypto};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/shop-core.js'),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(path.join(root,'studio/studio.js'),'utf8'),context);
 return {get,window,sources,pending,draws,saved,shop:window.YabisShop,settle:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('Jeder Raum wechselt das Bild und übernimmt nur seine tatsächlichen Flächen in den Korb',async()=>{
 for(const id of Object.keys(C.rooms)){
  const a=app(id);await a.settle();assert.equal(a.get('add-to-cart').disabled,false,id);
  const room=C.rooms[id],surface=room.surface;
  a.get(surface+'-materials').children[1].click();await a.settle();
  a.get(surface+'-area').value='12.5';a.get(surface+'-area').fire('input');
  if(room.separateWalls){a.get('wall-area').value='18';a.get('wall-area').fire('input');}
  a.get('request-selection').fire('submit');const cart=a.shop.getCart();assert.equal(cart.length,room.separateWalls?2:1,id);
  assert.equal(cart[0].raum,room.name);assert.equal(cart.find(x=>x.flaeche.includes(room.separateWalls?'Boden':room.surfaceName)).produkt,'bercy-terra');
  assert.match(a.shop.lines(cart),new RegExp('Bereich: '+room.name));assert.match(a.shop.lines(cart),/13,75 m²/);
  if(room.approval)assert.ok(a.shop.lines(cart).includes(room.approval));
  if(id!=='bad'){assert.ok(a.draws.at(-1).endsWith(`${id}-bercy-terra.webp`));assert.equal(a.get((surface==='floor'?'wall':'floor')+'-area').disabled,true);}
 }
});
test('Bad behält separate Formate, Fugen, Höhe und Mengen; andere Räume erben keine Bad-Einstellungen',async()=>{
 const a=app();await a.settle();a.get('floor-format').value='60,60';a.get('floor-format').fire('change');a.get('floor-grout').value='dark';a.get('floor-grout').fire('change');a.get('wall-height').value='full';a.get('wall-height').fire('change');await a.settle();
 a.get('floor-area').value='12';a.get('wall-area').value='25';a.get('request-selection').fire('submit');const cart=a.shop.getCart();assert.equal(cart[0].fuge,'Anthrazit');assert.equal(cart[0].format.join(','),'60,60');assert.equal(cart[0].requested,true);assert.equal(cart[1].wallHeight,'full');assert.match(a.shop.lines(cart),/37 Fliesen/);
 const restored=app('bad',{saved:a.saved});await restored.settle();assert.equal(restored.get('floor-format').value,'60,60');assert.equal(restored.get('wall-height').value,'full');
 const kitchen=app('kueche',{saved:a.saved,product:'bercy-terra'});await kitchen.settle();assert.equal(kitchen.get('wall-format').value,'60,120');assert.equal(kitchen.get('height-control').hidden,true);
 assert.ok(a.sources.filter(src=>src.includes('assets/studio/bad-')).length<=4,'Es werden nur benötigte Bad-Platten geladen');assert.equal(a.shop.products.length,4,'Shop bleibt vollständig');
});
test('Eine verspätete Bildantwort überschreibt niemals die zuletzt gewählte Fliese',async()=>{
 const a=app('eingang',{defer:true});a.get('floor-materials').children[1].click();
 const latest=a.pending.find(image=>image._src.includes('eingang-bercy-terra.webp'));latest.onload();await a.settle();
 assert.ok(a.draws.at(-1).endsWith('eingang-bercy-terra.webp'));
 for(const image of a.pending.filter(image=>image._src.includes('eingang-habitat-perla.webp')))image.onload?.();await a.settle();assert.ok(a.draws.at(-1).endsWith('eingang-bercy-terra.webp'));
});
test('Bei einem fehlgeschlagenen Materialbild wird keine unsichtbare Konfiguration angefragt',async()=>{
 const a=app('wohnen',{defer:true});const initial=a.pending.find(image=>image._src.includes('wohnen-habitat-perla.webp'));initial.onload();await a.settle();
 a.get('floor-materials').children[1].click();const failing=a.pending.find(image=>image._src.includes('wohnen-bercy-terra.webp'));failing.onerror();await a.settle();
 assert.equal(a.get('add-to-cart').disabled,true);a.get('floor-area').value='10';a.get('request-selection').fire('submit');assert.equal(a.shop.getCart().length,0);assert.match(a.get('image-status').textContent,/erneut auswählen/);
});
test('Neue Badbilder mit falschen Abmessungen werden vor dem Rendern abgewiesen',async()=>{
 const a=app('bad',{defer:true}),badImage=a.pending.find(image=>image._src.includes('bad-basis.webp'));
 badImage.naturalWidth=1536;badImage.naturalHeight=1024;
 for(const image of a.pending)image.onload?.();await a.settle();
 assert.equal(a.get('add-to-cart').disabled,true);assert.match(a.get('image-status').textContent,/passt nicht zur Raumvorlage/);assert.equal(a.draws.length,0);
});
test('Helle und dunkle Küchenfronten lassen sich unabhängig von beiden Fliesen wählen und wiederherstellen',async()=>{
 for(const material of C.materials)for(const tone of ['light','dark'])assert.ok(fs.existsSync(path.join(root,C.plate('kueche',material,tone))));
 const a=app('kueche');await a.settle();assert.equal(a.get('kitchen-fronts').hidden,false);
 a.get('wall-materials').children[1].click();await a.settle();a.get('fronts-dark').click();await a.settle();
 assert.ok(a.draws.at(-1).endsWith('kueche-bercy-terra-dunkel.webp'));assert.match(a.get('combination').textContent,/Bercy Terra.*Anthrazit/);
 a.get('wall-area').value='6';a.get('request-selection').fire('submit');const cart=a.shop.getCart();assert.equal(cart.length,1);assert.equal(cart[0].produkt,'bercy-terra');assert.equal(cart[0].flaeche,'Küchenrückwand');
 a.get('wall-materials').children[0].click();await a.settle();assert.ok(a.draws.at(-1).endsWith('kueche-habitat-perla-dunkel.webp'));
 const restored=app('kueche',{saved:a.saved});await restored.settle();assert.equal(restored.get('fronts-dark').attributes['aria-pressed'],'true');
 restored.get('fronts-light').click();await restored.settle();assert.ok(restored.draws.at(-1).endsWith('kueche-habitat-perla.webp'));
 const linked=app('kueche',{fronts:'dark',product:'bercy-terra'});await linked.settle();assert.ok(linked.draws.at(-1).endsWith('kueche-bercy-terra-dunkel.webp'));
 assert.equal(app('bad').get('kitchen-fronts').hidden,true);assert.equal(C.initial('bad',{cabinetTone:'dark'}).cabinetTone,undefined);
});
