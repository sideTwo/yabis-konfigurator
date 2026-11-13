/* Shared, local-only product selection and enquiry basket. No checkout. */
(() => {
  'use strict';
  const products = [
    {id:'habitat-perla',name:'Habitat Perla',brand:'Prissmacer',finish:'Matt',kind:'Steinoptik',color:'Perlgrau',description:'Ruhige Betonoptik in einem sanften Perlgrau. Für einen zurückhaltenden, modernen Entwurf.',source:'38326039337010496',roughness:.74},
    {id:'bercy-terra',name:'Bercy Terra',brand:'Prissmacer',finish:'Matt',kind:'Steinoptik',color:'Terra',description:'Warmer Terraton mit feiner, mineralischer Struktur. Passt im Entwurf zu Holz und dunklen Armaturen.',source:'28858001587119088',roughness:.78},
    {id:'taj-mahal-beige',name:'Taj Mahal beige',brand:'Roca Tiles',finish:'Poliert',kind:'Marmoroptik',color:'Beige',description:'Beige Natursteinoptik mit fließender Zeichnung. Eine helle, warme Basis für das Bad.',source:'28610320668656655',roughness:.22},
    {id:'bianco-mare',name:'Bianco Mare',brand:'Prissmacer',finish:'Oberfläche auf Anfrage',kind:'Marmoroptik',color:'Weiß',description:'Heller Grund mit feiner grauer Aderung. Die genaue Oberfläche wird mit Yabis abgestimmt.',source:'28637104212594347',roughness:.27}
  ].map(p=>({...p,formats:[[60,120]],photo:`bilder/katalog/originale/${p.id}.jpg`,texture:`bilder/katalog/hersteller/${p.id}${p.id==='taj-mahal-beige'?'-textur':''}.jpg`,source:`https://wa.me/p/${p.source}/491786787724`}));
  for(const p of products){p.catalogPriceCents=p.id==='taj-mahal-beige'?4490:3990;p.catalogPriceDate='30.10.2026';p.catalogUnit=null;}
  const money=cents=>(cents/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  function estimateAssumingM2(id,area,waste,format){const p=find(id),q=calculate(area,waste,format);return p&&q&&p.formats.some(f=>f.join(',')===format.join(','))?Math.round(q.total*p.catalogPriceCents):null;}
  const key='yk-merkliste';
  const de=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:2});
  const validArea=n=>Number.isFinite(Number(n))&&Number(n)>=.01&&Number(n)<=100000;
  const validWaste=n=>Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=30;
  const validFormat=f=>Array.isArray(f)&&f.length===2&&f.every(n=>Number.isFinite(Number(n))&&Number(n)>=10&&Number(n)<=320);
  const find=id=>products.find(p=>p.id===id);
  function calculate(area,waste,format){
    if(!validArea(area)||!validWaste(waste)||!validFormat(format))return null;
    const total=Math.ceil(Number(area)*(1+Number(waste)/100)*100-1e-8)/100;
    return {area:Number(area),waste:Number(waste),total,pieces:Math.ceil(total/(format[0]*format[1]/10000)-1e-8)};
  }
  function getCart(){
    try{const data=JSON.parse(localStorage.getItem(key));return Array.isArray(data)?data.filter(p=>p&&validFormat(p.format)).map((p,i)=>({...p,id:p.id||`legacy-${i}`,waste:validWaste(p.waste)?Number(p.waste):0})):[];}catch{return [];}
  }
  function saveCart(items){localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new CustomEvent('yabis-cart-change'));}
  const heightLabel=value=>value==='120'?'Bis 1,20 m, mit Abschlussprofil; Dusche raumhoch':value==='full'?'Raumhoch gefliest':'';
  function item({product,area,waste=10,format=[60,120],surface='Projektfläche',pattern='Nach Absprache',grout='',requested=false,wallHeight=null}){
    const p=find(product);if(!p||!calculate(area,waste,format))throw Error('Bitte Fläche, Verschnitt und Format prüfen.');
    if(wallHeight!==null&&!heightLabel(wallHeight))throw Error('Bitte eine gültige Fliesenhöhe auswählen.');
    return {id:crypto.randomUUID(),produkt:p.id,name:p.name,quelle:p.source,format:format.map(Number),m2:Number(area),waste:Number(waste),flaeche:surface,raum:'Bad / Projekt',verband:pattern,fuge:grout,...(wallHeight?{wallHeight}:{}),requested:requested||!p.formats.some(f=>f.join(',')===format.join(','))};
  }
  function add(items){saveCart([...getCart(),...items]);}
  function lines(cart){return cart.map((p,i)=>{const q=calculate(p.m2,p.waste,p.format);if(!q)throw Error('Bitte alle Flächen und Mengen im Anfragekorb prüfen.');return `${i+1}. ${p.name} · ${p.flaeche||'Projektfläche'}\nFormat: ${p.format.join(' × ')} cm${p.requested?' (Formatwunsch, bitte Verfügbarkeit bestätigen)':''}${heightLabel(p.wallHeight)?'\nWandhöhe: '+heightLabel(p.wallHeight):''}\nFläche: ${de(p.m2)} m² + ${p.waste} % Verschnitt = ${de(q.total)} m² Bedarf\nRechnerisch ${q.pieces} Fliesen, Verpackungseinheiten bitte berücksichtigen.\nVerlegung: ${p.verband||'Nach Absprache'}${p.fuge?'; Fuge: '+p.fuge:''}${find(p.produkt)?'\nKatalogrichtpreis im Format 60 × 120 cm: '+money(find(p.produkt).catalogPriceCents)+' (Preiseinheit nicht bestätigt; Stand '+find(p.produkt).catalogPriceDate+').':''}${p.quelle?'\nYabis-Katalog: '+p.quelle:''}`;}).join('\n\n');}
  function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  window.YabisShop={money,estimateAssumingM2,products,find,de,calculate,validArea,validWaste,validFormat,getCart,saveCart,item,add,lines,download,key,heightLabel};
})();
