const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const grid=require('../konfigurator-neu/tile-grid.js');
function app(storage=new Map()) {
  class Element {
    constructor(id){this.id=id;this.value='';this.checked=true;this.dataset={};this.children=[];this.events={};this.attributes={};}
    addEventListener(type,handler){this.events[type]=handler;}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(){this.children=[];}
    querySelectorAll(){return this.children;}
    setAttribute(k,v){this.attributes[k]=v;}
    getContext(){return {};}
    toBlob(fn){fn({});}
    click(){if(this.download)downloads.push(this.download);}
    fire(type){this.events[type]({preventDefault(){}});}
  }
  const elements=new Map(),downloads=[],draws=[],sources=[];
  const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
  for(const s of ['floor','wall']){get(`${s}-area`).value=s==='floor'?'12':'25';get(`${s}-waste`).value='10';}
  const window={addEventListener(){},dispatchEvent(){},YabisRoomPreview:{render(){}},YabisTileGrid:{...grid,draw(ctx,state){draws.push(JSON.parse(JSON.stringify(state)));}}};
  const context={window,document:{getElementById:get,createElement:tag=>new Element(tag)},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{search:''},URLSearchParams,URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL(){}},setTimeout(){},CustomEvent:class{},crypto:crypto.webcrypto,Image:class extends Element{set src(src){sources.push(src);if(this.onload)queueMicrotask(()=>this.onload());}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/shop-core.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../konfigurator-neu/standbild.js'),'utf8'),context);
  return {get,storage,draws,sources,downloads,shop:window.YabisShop};
}
test('Format- und Fugenregler steuern Vorschau, Stückzahlen, Anfragekorb und PNG unabhängig',async()=>{
  const a=app();await new Promise(resolve=>setImmediate(resolve));
  assert.match(a.get('floor-quantity').textContent,/19 Fliesen/);
  a.get('floor-format').value='60,60';a.get('floor-format').fire('change');
  a.get('floor-grout').value='dark';a.get('floor-grout').fire('change');
  assert.match(a.get('floor-quantity').textContent,/37 Fliesen/);
  assert.match(a.get('wall-quantity').textContent,/39 Fliesen/);
  a.get('wall-format').value='120,120';a.get('wall-format').fire('change');
  a.get('wall-grout').value='sand';a.get('wall-grout').fire('change');
  assert.match(a.get('wall-quantity').textContent,/20 Fliesen/);
  const last=a.draws.at(-1);assert.deepEqual(last.floorFormat,[60,60]);assert.deepEqual(last.wallFormat,[120,120]);
  assert.equal(last.floorGrout,'dark');assert.equal(last.wallGrout,'sand');
  a.get('request-selection').fire('submit');const cart=a.shop.getCart();
  assert.equal(cart.length,2);assert.equal(cart[0].fuge,'Anthrazit');assert.equal(cart[1].fuge,'Sand');
  assert.equal(cart[0].format.join(','),'60,60');assert.equal(cart[1].format.join(','),'120,120');
  assert.equal(cart[0].requested,true);assert.equal(cart[1].wallHeight,'120');
  a.get('save-image').fire('click');assert.match(a.downloads[0],/60x60-dark-Wand-habitat-perla-120x120-sand-120cm/);
  assert.equal(a.sources.filter(src=>src.startsWith('assets/konfiguration-fugenlos/')).length,8);
  const restored=app(a.storage);assert.equal(restored.get('floor-format').value,'60,60');assert.equal(restored.get('wall-grout').value,'sand');
});
