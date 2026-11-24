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
test('Jeder exportierte Artikel hat eine gültige Verfügbarkeit, Standard ist „auf Anfrage“ (2026-11-24)',()=>{
  const shop=setup();
  for(const product of shop.products.filter(p=>!p.hidden))assert.ok(['sofort','bestellung','anfrage','nicht'].includes(shop.availability(product)),product.id);
  const ohneAngabe={...shop.products[0]};delete ohneAngabe.availability;
  assert.equal(shop.availability(ohneAngabe),'anfrage');
  assert.equal(shop.availabilityLabel({availability:'quatsch'}),'Verfügbarkeit auf Anfrage');
});
test('Lieferzeit erscheint nur bei „Auf Bestellung“',()=>{
  const shop=setup();
  assert.equal(shop.availabilityLabel({availability:'bestellung',deliveryTime:'ca. 2 Wochen'}),'Auf Bestellung · ca. 2 Wochen');
  assert.equal(shop.availabilityLabel({availability:'sofort',deliveryTime:'ca. 2 Wochen'}),'Sofort verfügbar');
  assert.equal(shop.availabilityLabel({availability:'nicht'}),'Zurzeit nicht lieferbar');
});
test('Die Anfrage nennt die Verfügbarkeit laut Shop',()=>{
  const shop=setup(),product=shop.products.find(p=>!p.hidden&&p.formats.length);
  const position=shop.item({product:product.id,area:10,waste:10,format:product.formats[0]});
  assert.match(shop.lines([position]),new RegExp('Verfügbarkeit laut Shop: '+shop.availabilityLabel(product)));
});
test('Shop bietet einen Verfügbarkeitsfilter mit allen vier Stufen',()=>{
  const html=fs.readFileSync(path.join(root,'katalog.html'),'utf8');
  assert.match(html,/data-facet="verfuegbarkeit"/);
  for(const key of ['sofort','bestellung','anfrage','nicht'])assert.match(html,new RegExp(`<option value="${key}">`));
});
