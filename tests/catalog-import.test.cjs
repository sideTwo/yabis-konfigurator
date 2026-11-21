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
  for(const file of ['catalog-products.js','catalog-images.js','catalog-reconstructions.js','shop-core.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
  return context.window.YabisShop;
}
test('Alle 284 erfassten Einträge haben eindeutige IDs und Quellen ohne Handyfoto-Pfade',()=>{
  const shop=setup();assert.equal(shop.products.length,284);assert.equal(new Set(shop.products.map(product=>product.id)).size,284);
  for(const product of shop.products){
    assert.ok(product.name);assert.ok(product.description);assert.match(product.source,/^https:\/\/wa.me\/[pc]\//);
    assert.equal(product.originalPhoto,undefined);
    if(product.photo){
      assert.match(product.photo,/^bilder\/katalog\/hersteller-2026-11-18\/[a-z0-9-]+\.webp$/);
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
test('50 geprüfte Herstellerbilder ergänzen die Produktdaten ohne Verkaufsdaten umzudeuten',()=>{
  const shop=setup(),matched=shop.products.filter(product=>product.manufacturerImage);
  assert.equal(matched.length,50);
  for(const product of matched){assert.match(product.manufacturerImage.page,/^https:\/\//);assert.ok(product.manufacturerImage.source);}
  for(const id of ['nordic-slate-blue','etna-gris','teide-silver'])assert.equal(shop.find(id).manufacturerImage,undefined);
  assert.equal(shop.find('ganges-visgraat').formats.length,0);
});
test('Fremdwährungsfehler werden nicht als Europreise oder Nullpreise berechnet',()=>{
  const shop=setup(),unclear=shop.products.filter(product=>product.catalogCurrency==='ZAR');
  assert.equal(unclear.length,18);
  for(const product of unclear){assert.equal(product.catalogPriceCents,null);assert.equal(shop.priceLabel(product),'Preis auf Anfrage');assert.equal(shop.estimateAssumingM2(product.id,10,0,[60,120]),null);}
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
