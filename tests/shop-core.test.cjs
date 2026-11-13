const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('Eigene Formate und Fugenfarben bleiben in Mengen und Anfragetext erhalten',()=>{
  const s=setup();s.add([
    s.item({product:'habitat-perla',area:12,waste:10,format:[60,60],surface:'Boden',grout:'Anthrazit'}),
    s.item({product:'bercy-terra',area:25,waste:10,format:[120,120],surface:'Wand',grout:'Sand',wallHeight:'120'})
  ]);
  const cart=s.getCart();assert.equal(cart[0].fuge,'Anthrazit');assert.equal(cart[1].fuge,'Sand');
  assert.equal(s.calculate(cart[0].m2,cart[0].waste,cart[0].format).pieces,37);
  assert.equal(s.calculate(cart[1].m2,cart[1].waste,cart[1].format).pieces,20);
  const text=s.lines(cart);assert.match(text,/60 × 60 cm/);assert.match(text,/120 × 120 cm/);
  assert.match(text,/Anthrazit/);assert.match(text,/Sand/);assert.equal(cart[0].requested,true);
});
function setup(){let stored='[]';const context={window:{dispatchEvent(){}},localStorage:{getItem(){return stored},setItem(k,v){stored=v}},CustomEvent:class {},crypto:crypto.webcrypto};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/shop-core.js'),'utf8'),context);return context.window.YabisShop;}
test('Mengen berücksichtigen Verschnitt und runden auf ganze Fliesen',()=>{const s=setup();assert.equal(s.calculate(12.5,10,[60,120]).total,13.75);assert.equal(s.calculate(12.5,10,[60,120]).pieces,20);assert.equal(s.calculate(12,5,[60,120]).total,12.6);assert.equal(s.calculate(25,15,[60,120]).pieces,40);assert.equal(s.calculate(7.2,0,[60,120]).pieces,10);});
test('Ungültige Flächen, Formate und Verschnitt werden abgewiesen',()=>{const s=setup();for(const args of [[0,10,[60,120]],['NaN',10,[60,120]],[12,-5,[60,120]],[12,10,[0,120]],[100001,10,[60,120]]])assert.equal(s.calculate(...args),null);});
test('Wand und Boden bleiben getrennte Positionen mit eigenen Formatwünschen',()=>{const s=setup();s.add([s.item({product:'bercy-terra',area:12.5,waste:10,format:[60,120],surface:'Badboden'}),s.item({product:'bianco-mare',area:25,waste:15,format:[120,120],surface:'Badwand'})]);const cart=s.getCart();assert.equal(cart.length,2);assert.equal(cart[1].requested,true);const text=s.lines(cart);assert.match(text,/13,75 m²/);assert.match(text,/Formatwunsch/);assert.match(text,/Badwand/);assert.match(text,/wa.me\/p\//);assert.match(text,/Preiseinheit nicht bestätigt/);});
test('Richtpreise rechnen nur ausdrücklich mit angenommener m²-Einheit im Katalogformat',()=>{const s=setup();assert.equal(s.find('bercy-terra').catalogUnit,null);assert.equal(s.estimateAssumingM2('bercy-terra',12.5,10,[60,120]),54863);assert.equal(s.estimateAssumingM2('taj-mahal-beige',10,0,[60,120]),44900);assert.equal(s.estimateAssumingM2('bercy-terra',12.5,10,[60,60]),null);assert.equal(s.estimateAssumingM2('unknown',12,10,[60,120]),null);});
test('Wandhöhe bleibt je Position erhalten und erscheint in der Anfrage',()=>{const s=setup();s.add([s.item({product:'habitat-perla',area:12,surface:'Boden'}),s.item({product:'bercy-terra',area:18,surface:'Wand',wallHeight:'120'}),s.item({product:'bianco-mare',area:27,surface:'Wand',wallHeight:'full'})]);const cart=s.getCart();assert.equal(cart[0].wallHeight,undefined);assert.equal(cart[1].wallHeight,'120');assert.equal(cart[2].wallHeight,'full');const text=s.lines(cart);assert.match(text,/Wandhöhe: Bis 1,20 m, mit Abschlussprofil; Dusche raumhoch/);assert.match(text,/Wandhöhe: Raumhoch gefliest/);assert.throws(()=>s.item({product:'bercy-terra',area:12,wallHeight:'300'}),/Fliesenhöhe/);});
