const {test}=require('node:test');
const assert=require('node:assert/strict');
const {viewsFor}=require('../js/catalog-media.js');
test('Die Galerie zeigt passende Hersteller- und generierte Oberflächenbilder',()=>{
  const product={name:'Testfliese',photo:'hersteller.webp',originalPhoto:'original.webp',reconstruction:'rekonstruktion.webp',manufacturerImage:{page:'https://example.com'}};
  const views=viewsFor(product);
  assert.deepEqual(views.map(view=>view.id),['decor','reconstruction']);
  assert.equal(views[0].src,product.photo);
  assert.equal(views[1].src,product.reconstruction);
  assert.equal(views[1].alt,'Testfliese – Oberflächenansicht');
});
test('Noch unbearbeitete Handyfotos gelangen nicht in die Shopgalerie',()=>{
  const views=viewsFor({name:'Ungeklärter Artikel',manufacturerImage:{photo:'bilder/katalog/eigene/original.webp'}});
  assert.deepEqual(views,[]);
});
test('Flavio Oxido hat Herstellerbilder und eine lokale Raumtextur',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const studio=require('../js/studio-core.js'),product=studio.additionalProducts['flavio-oxido'];
  const views=viewsFor(product);
  assert.deepEqual(views.map(view=>view.id),['finish','decor','installation']);
  assert.equal(views[0].src,product.photo);
  assert.match(views[2].note,/120 × 120 cm/);
  assert.equal(product.studioSample.size,120);
  for(const src of [...views.map(view=>view.src),studio.materialSample(product)]){
    assert.ok(fs.statSync(path.join(__dirname,'..',src)).size>1000,src);
  }
});
