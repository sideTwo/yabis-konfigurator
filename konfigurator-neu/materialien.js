// Yabis catalogue photos remain unchanged as product evidence. The room uses
// matching manufacturer graphics, not the lighting baked into showroom photos.
(() => {
const products=[
 {id:'habitat-perla',name:'Habitat Perla',detail:'Matt · 60 × 120 cm',finish:'Matt',group:'Matt 60x120',photo:'../bilder/katalog/originale/habitat-perla.jpg',source:'https://wa.me/p/38326039337010496/491786787724'},
 {id:'bercy-terra',name:'Bercy Terra',detail:'Matt · 60 × 120 cm',finish:'Matt',group:'Matt 60x120',photo:'../bilder/katalog/originale/bercy-terra.jpg',source:'https://wa.me/p/28858001587119088/491786787724'},
 {id:'taj-mahal-beige',name:'Taj Mahal beige',detail:'Poliert · 60 × 120 cm',finish:'Poliert',group:'Poliert 60x120',photo:'../bilder/katalog/originale/taj-mahal-beige.jpg',source:'https://wa.me/p/28610320668656655/491786787724'},
 {id:'bianco-mare',name:'Bianco Mare',detail:'60 × 120 cm · Oberfläche bestätigen',finish:'Lappato / poliert – bestätigen',group:'Lappato (Teilpoliert)',photo:'../bilder/katalog/originale/bianco-mare.jpg',source:'https://wa.me/p/28637104212594347/491786787724'}
];
const manufacturers={
 'habitat-perla':{name:'Prissmacer',url:'https://www.prissmacer.es/fr/serie/ess-habitat/'},
 'bercy-terra':{name:'Prissmacer',url:'https://www.prissmacer.es/serie/ess-bercy/'},
 'bianco-mare':{name:'Prissmacer',url:'https://www.prissmacer.es/serie/lab-bianco-mare/'},
 'taj-mahal-beige':{name:'Roca Tiles',url:'https://www.rocatiles.com/export/products/taj-mahal-beige-pulido-F6E0E54041-en/'}
};
for(const product of products){
 product.texture=`../bilder/katalog/hersteller/${product.id}${product.id==='taj-mahal-beige'?'-textur':''}.jpg`;
 product.roughness=product.finish==='Matt'?.76:.24;product.crop=[0,0,1,1];product.rotate=true;product.manufacturer=manufacturers[product.id];
}
window.BadMaterials={products,floor:products.map(p=>({...p,base:'stein',swatch:p.texture,formats:['60,120']})),wall:products.map(p=>({...p,base:'hell',swatch:p.texture,formats:['60,120']})),checked:'2026-11-12',bestseller:null};
})();
