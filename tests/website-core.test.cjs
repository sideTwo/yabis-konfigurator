const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inquiry}=require('../js/website-core.js');

const base={name:'Demo',contact:'demo@example.test',message:'35 m² Boden, bitte Verfügbarkeit klären.',room:'bad',delivery:'pickup',customerType:'private'};
test('Projektanfrage bleibt unverbindlich und übernimmt Raum und Artikel',()=>{
 const text=inquiry(base,'Habitat Perla · 35 m² + 10 % Verschnitt');
 assert.match(text,/Bereich: Badezimmer/);
 assert.match(text,/Abholung gewünscht/);
 assert.match(text,/Habitat Perla · 35 m² \+ 10 % Verschnitt/);
 assert.match(text,/Anfrage, keine Bestellung/);
 assert.doesNotMatch(text,/Lieferkosten/);
});
test('Lieferanfrage benötigt gültige PLZ und Ort',()=>{
 for(const data of [{postcode:'1234',city:'Duisburg'},{postcode:'abcde',city:'Duisburg'},{postcode:'47228',city:''}])
  assert.throws(()=>inquiry({...base,delivery:'delivery',...data}),/Liefer-PLZ und Lieferort/);
 const text=inquiry({...base,customerType:'trade',company:'Demo GmbH',room:'mehrere',delivery:'delivery',postcode:'47228',city:'Duisburg',address:'Zufahrt für LKW',quantity:'120 m²',date:'Ab März'});
 for(const expected of ['Gewerbeanfrage','Firma: Demo GmbH','Mehrere Bereiche / Materialliste','120 m²','Ab März','47228 Duisburg · Zufahrt für LKW','Lieferkosten individuell anbieten'])
  assert.ok(text.includes(expected),expected);
});
test('Unvollständige Kontaktdaten erzeugen keine Anfrage',()=>{
 for(const key of ['name','contact','message'])assert.throws(()=>inquiry({...base,[key]:'  '}),/Name, Rückkontakt/);
});
