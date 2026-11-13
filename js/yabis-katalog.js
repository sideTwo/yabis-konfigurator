// Verified original products for the separate enquiry catalogue. No sales rank
// or price unit was supplied by the source, so neither is invented here.
(() => {
  const original=[
    ['habitat-perla','Habitat Perla','Matt · 60 × 120 cm','38326039337010496'],
    ['bercy-terra','Bercy Terra','Matt · 60 × 120 cm','28858001587119088'],
    ['taj-mahal-beige','Taj Mahal beige','Poliert · 60 × 120 cm','28610320668656655'],
    ['bianco-mare','Bianco Mare','60 × 120 cm · Oberfläche bestätigen','28637104212594347']
  ];
  window.YK.PRODUKTE=original.map(([id,name,oberflaeche,source])=>({id,name,oberflaeche,bereiche:['bad','innen'],formate:[[60,120]],textur:`bilder/katalog/originale/${id}.jpg`,original:true,quelle:`https://wa.me/p/${source}/491786787724`}));
})();
