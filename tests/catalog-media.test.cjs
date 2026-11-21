const {test}=require('node:test');
const assert=require('node:assert/strict');
const {viewsFor}=require('../js/catalog-media.js');
test('Herstellerdekor und Oberflächenansicht nutzen getrennte Bilder',()=>{
  const product={name:'Testfliese',photo:'hersteller.webp',originalPhoto:'original.webp',reconstruction:'rekonstruktion.webp',manufacturerImage:{page:'https://example.com'}};
  const views=viewsFor(product);
  assert.equal(views.length,2);assert.equal(views[0].id,'decor');assert.equal(views[0].src,product.photo);
  assert.equal(views[1].id,'reconstruction');assert.equal(views[1].src,product.reconstruction);
  assert.equal(views[1].alt,'Testfliese – Oberflächenansicht');
});
test('Noch unbearbeitete Handyfotos gelangen nicht in die Shopgalerie',()=>{
  const views=viewsFor({name:'Ungeklärter Artikel',photo:'original.webp'});
  assert.deepEqual(views,[]);
});
test('Flavio Oxido zeigt Streiflicht, Dekor und Hersteller-Verlegebeispiel aus lokalen Dateien',()=>{
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
