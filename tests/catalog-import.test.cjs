const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function setup(){
  let stored='[]';
  const context={window:{dispatchEvent(){}},localStorage:{getItem(){return stored;},setItem(key,value){stored=value;}},CustomEvent:class {},crypto:crypto.webcrypto};
  for(const file of ['daten/katalog.js','js/shop-core.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  return context.window.YabisShop;
}
test('Der WhatsApp-Bestand und die Terrassenplatten haben eindeutige Produkt-IDs',()=>{
  const shop=setup(),original=shop.products.filter(product=>product.kind!=='Terrassenplatten');
  assert.equal(original.length,284);assert.equal(new Set(shop.products.map(product=>product.id)).size,shop.products.length);
  for(const product of original){
    assert.ok(product.name);assert.ok(product.description);assert.match(product.source,/^https:\/\/wa.me\/[pc]\//);
    assert.equal(product.originalPhoto,undefined);
    if(product.photo){
      assert.match(product.photo,/^bilder\/katalog\/(hersteller-2026-11-18|eigene)\/[a-z0-9-]+\.webp$/);
      assert.ok(fs.statSync(path.join(root,product.photo)).size>1000);
    }
    if(product.reconstruction){
      assert.equal(product.reconstruction,`bilder/katalog/ki-produktbilder-2026-11-18/${product.id}.webp`);
      assert.ok(fs.statSync(path.join(root,product.reconstruction)).size>1000);
    }
    assert.equal(product.texture,product.photo);assert.equal(product.catalogUnit,null);
    assert.ok(product.formats.every(shop.validFormat));
  }
});
test('50 geprüfte Herstellerbilder ergänzen den Altbestand ohne Herstellernamen oder -links',()=>{
  const shop=setup(),matched=shop.products.filter(product=>product.kind!=='Terrassenplatten'&&product.manufacturerImage);
  assert.equal(matched.length,50);
  for(const product of matched){assert.ok(product.manufacturerImage.photo);for(const key of ['brand','page','source'])assert.equal(product.manufacturerImage[key],undefined);}
  for(const product of shop.products)assert.equal(product.brand,undefined);
  const text=fs.readFileSync(path.join(root,'daten/katalog.js'),'utf8');
  for(const name of ['Prissmacer','Roca Tiles','EKOFLOORS','prissmacer.es','ekofloors.nl'])assert.ok(!text.includes(name),name);
  for(const id of ['nordic-slate-blue','etna-gris','teide-silver'])assert.equal(shop.find(id).manufacturerImage,undefined);
  assert.equal(shop.find('ganges-visgraat').formats.length,0);
});
test('Der öffentliche Terrassenplattenkatalog enthält nur freigegebene Oberflächenansichten',()=>{
  const shop=setup(),terrace=shop.products.filter(product=>product.kind==='Terrassenplatten');
  const {viewsFor}=require('../js/catalog-media.js');
  assert.equal(terrace.length,29);
  for(const product of terrace){
    assert.equal(product.photo,undefined);
    assert.equal(product.texture,undefined);
    assert.equal(product.manufacturerImage,undefined);
    assert.equal(product.source,'');
    assert.equal(product.catalogUnit,'m2');
    const views=viewsFor(product);
    assert.equal(views.length,1);
    assert.equal(views[0].src,`bilder/katalog/ki-terrassenplatten-2026-11-25/${product.id}.webp`);
    assert.ok(fs.statSync(path.join(root,views[0].src)).size>10000);
    assert.equal(views[0].label,'Oberflächenansicht');
    assert.equal(views[0].alt,product.name+' – Oberflächenansicht');
    assert.equal(product.formats.length,1);
    assert.ok(shop.validFormat(product.formats[0]));
    assert.match(product.description,/2 cm stark/);
  }
  const miami=shop.find('terrassenplatte-miami');
  assert.equal(shop.formatLabel(miami),'80 × 80 cm');
  assert.equal(shop.priceCentsFor({...miami,catalogPriceCents:5990,finish:'Matt'},[60,120]),5990);
  const berlin=shop.find('terrassenplatte-berlin');
  assert.equal(shop.formatLabel(berlin),'50 × 100 cm');
  assert.match(berlin.description,/Presskante/);
  const pizarra=shop.find('terrassenplatte-pizarra');
  assert.equal(shop.formatLabel(pizarra),'25 × 90 cm');
  assert.equal(shop.calculate(10,10,pizarra.formats[0]).pieces,49);
  const radeburg=shop.find('terrassenplatte-radeburg');
  assert.equal(shop.formatLabel(radeburg),'120 × 40 cm');
  assert.match(radeburg.description,/Rutschhemmung R11\./);
  const unpriced={...miami,catalogPriceCents:null};
  assert.equal(shop.priceLabel(unpriced),'Preis auf Anfrage');
  assert.equal(shop.priceCentsFor(unpriced,[80,80]),null);
});
test('Die 18 Rand-Preise aus dem WhatsApp-Katalog sind als Euro übernommen (Bilal, 2026-11-24)',()=>{
  const shop=setup();
  assert.equal(shop.products.filter(product=>product.catalogCurrency!=='EUR').length,0);
  for(const id of ['motley-reading','glocal-ideal','terrazzo-rice'])assert.equal(shop.find(id).catalogPriceCents,3990,id);
  assert.equal(shop.find('zahara-whisper').catalogPriceCents,4490);
  assert.equal(shop.estimateAssumingM2('motley-reading',10,0,[60,120]),39900);
});
test('Artikel ohne Europreis bleiben „Preis auf Anfrage“ ohne Richtwert',()=>{
  const shop=setup(),ohne={...shop.find('motley-reading'),catalogPriceCents:null};
  assert.equal(shop.priceLabel(ohne),'Preis auf Anfrage');assert.equal(shop.priceCentsFor(ohne,[60,120]),null);
});
test('Offene Formate bleiben über Speichern und Anfragetext ohne erfundene Stückzahl erhalten',()=>{
  const shop=setup(),product=shop.products.find(value=>value.kind==='Vinyl'&&!value.formats.length);
  const position=shop.item({product:product.id,area:12.5,waste:10,format:null});shop.add([position]);
  assert.equal(shop.getCart().length,1);assert.equal(shop.getCart()[0].format,null);
  assert.equal(shop.calculate(12.5,10,null).total,13.75);assert.equal(shop.calculate(12.5,10,null).pieces,null);
  assert.match(shop.lines(shop.getCart()),/Format auf Anfrage/);assert.doesNotMatch(shop.lines(shop.getCart()),/Rechnerisch \d+ Stück/);
});
test('Gleichnamige Ausführungen und bestehende Pilot-IDs bleiben getrennt erhalten',()=>{
  const shop=setup();assert.equal(shop.products.filter(product=>product.name==='Fiordi bosco Sand').length,2);
  for(const id of ['habitat-perla','bercy-terra','taj-mahal-beige','bianco-mare'])assert.ok(shop.find(id));
  assert.equal(shop.find('taj-mahal-beige').catalogPriceCents,4490);
});
