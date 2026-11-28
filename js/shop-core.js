/* Shared, local-only product selection and enquiry basket. No checkout. */
(() => {
  'use strict';
  const products = [
    {id:'habitat-perla',name:'Habitat Perla',brand:'Prissmacer',finish:'Matt',kind:'Steinoptik',color:'Perlgrau',description:'Ruhige Betonoptik in einem sanften Perlgrau. Für einen zurückhaltenden, modernen Entwurf.',source:'38326039337010496',roughness:.74},
    {id:'bercy-terra',name:'Bercy Terra',brand:'Prissmacer',finish:'Matt',kind:'Steinoptik',color:'Terra',description:'Warmer Terraton mit feiner, mineralischer Struktur. Passt im Entwurf zu Holz und dunklen Armaturen.',source:'28858001587119088',roughness:.78},
    {id:'taj-mahal-beige',name:'Taj Mahal beige',brand:'Roca Tiles',finish:'Poliert',kind:'Marmoroptik',color:'Beige',description:'Beige Natursteinoptik mit fließender Zeichnung. Eine helle, warme Basis für das Bad.',source:'28610320668656655',roughness:.22},
    {id:'bianco-mare',name:'Bianco Mare',brand:'Prissmacer',finish:'',kind:'Marmoroptik',color:'Weiß',description:'Heller Grund mit feiner grauer Aderung. Die genaue Oberfläche wird mit Yabis abgestimmt.',source:'28637104212594347',roughness:.27}
  ].map(p=>({...p,formats:[[60,120]],photo:`bilder/katalog/originale/${p.id}.jpg`,texture:`bilder/katalog/hersteller/${p.id}${p.id==='taj-mahal-beige'?'-textur':''}.jpg`,source:`https://wa.me/p/${p.source}/491786787724`}));
  for(const p of products){p.catalogPriceCents=p.id==='taj-mahal-beige'?4490:3990;p.catalogPriceDate='30.10.2026';p.catalogUnit=null;}
  if(Array.isArray(window.YabisCatalog))products.splice(0,products.length,...window.YabisCatalog,...Object.values(window.YabisStudio?.additionalProducts||{}));
  const formatLabel=product=>product.formats.length?product.formats.map(format=>format.join(' × ')+' cm').join(' / '):'Format auf Anfrage';
  const priceUnit=product=>product.catalogUnit==='m2'?'m²':product.catalogUnit||'m²';
  const priceLabel=product=>Number.isInteger(product.catalogPriceCents)?money(product.catalogPriceCents)+' / '+priceUnit(product):'Preis auf Anfrage';
  // Verfügbarkeit aus der Verwaltung. Ohne Angabe gilt „auf Anfrage“, nie „sofort“.
  const AVAILABILITY={sofort:'Sofort verfügbar',bestellung:'Auf Bestellung',anfrage:'Verfügbarkeit auf Anfrage',nicht:'Zurzeit nicht lieferbar'};
  const availability=product=>Object.hasOwn(AVAILABILITY,product?.availability)?product.availability:'anfrage';
  const availabilityLabel=product=>{const key=availability(product);return AVAILABILITY[key]+(key==='bestellung'&&product.deliveryTime?' · '+product.deliveryTime:'');};
  const money=cents=>(cents/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  // Formatpreise laut Yabis (WhatsApp 23./24.11.2026), Euro pro m²:
  // 120 × 120 cm poliert 52,90, matt und teilpoliert 47,90 · 60 × 120 cm poliert 44,90, matt und teilpoliert 39,90.
  // 60 × 60 cm folgt. Gilt für Fliesen, wenn das gewählte Format nicht das Katalogformat des Artikels ist.
  // Sonst und ohne Formatpreis bleibt der Katalogpreis der Richtwert.
  // Gepflegt in /verwaltung (daten/katalog.js). Die Werte hier gelten nur, wenn die Datei fehlt.
  const FORMAT_PREISE=window.YabisFormatPrices||{
   '120,120':{'Poliert':5290,'Matt':4790,'Lappato (Teilpoliert)':4790},
   '60,120':{'Poliert':4490,'Matt':3990,'Lappato (Teilpoliert)':3990}
  };
  function priceCentsFor(product,format){
   if(!product||!Number.isInteger(product.catalogPriceCents))return null;
   const key=Array.isArray(format)?format.join(','):'',catalogFormat=product.formats.some(f=>f.join(',')===key);
   const tile=!['Vinyl','Holzoptik','Terrassenplatten'].includes(product.kind);
   return (!catalogFormat&&tile&&FORMAT_PREISE[key]?.[product.finish])||product.catalogPriceCents;
  }
  const priceLabelFor=(product,format)=>{const cents=priceCentsFor(product,format);return cents===null?'Preis auf Anfrage':money(cents)+' / '+priceUnit(product);};
  // Richtwert = Bedarf in m² × Preis pro m² für das gewählte Format (Katalogpreis, wenn es keinen Formatpreis gibt)
  function estimateAssumingM2(id,area,waste,format){const p=find(id),q=calculate(area,waste,null),cents=priceCentsFor(p,format);return q&&cents!==null&&priceUnit(p)==='m²'?Math.round(q.total*cents):null;}
  const key='yk-merkliste';
  const de=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:2});
  const validArea=n=>Number.isFinite(Number(n))&&Number(n)>=.01&&Number(n)<=100000;
  const validWaste=n=>Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=30;
  const validFormat=f=>Array.isArray(f)&&f.length===2&&f.every(n=>Number.isFinite(Number(n))&&Number(n)>=10&&Number(n)<=320);
  const find=id=>products.find(p=>p.id===id)||(Object.hasOwn(window.YabisStudio?.additionalProducts||{},id)?window.YabisStudio.additionalProducts[id]:undefined);
  function calculate(area,waste,format){
    if(!validArea(area)||!validWaste(waste)||(format!==null&&!validFormat(format)))return null;
    const total=Math.ceil(Number(area)*(1+Number(waste)/100)*100-1e-8)/100;
    return {area:Number(area),waste:Number(waste),total,pieces:format===null?null:Math.ceil(total/(format[0]*format[1]/10000)-1e-8)};
  }
  function getCart(){
    try{const data=JSON.parse(localStorage.getItem(key));return Array.isArray(data)?data.filter(p=>p&&(p.format===null||validFormat(p.format))).map((p,i)=>({...p,id:p.id||`legacy-${i}`,waste:validWaste(p.waste)?Number(p.waste):0})):[];}catch{return [];}
  }
  function saveCart(items){localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new CustomEvent('yabis-cart-change'));}
  const heightLabel=value=>value==='120'?'Bis 1,20 m, mit Abschlussprofil; Dusche raumhoch':value==='full'?'Raumhoch gefliest':'';
  function item({product,area,waste=10,format=[60,120],surface='Projektfläche',pattern='Nach Absprache',grout='',requested=false,wallHeight=null,room='Bad / Projekt',applicationNote=''}){
    const p=find(product);if(!p||!calculate(area,waste,format))throw Error('Bitte Fläche, Verschnitt und Format prüfen.');
    if(wallHeight!==null&&!heightLabel(wallHeight))throw Error('Bitte eine gültige Fliesenhöhe auswählen.');
    return {id:crypto.randomUUID(),produkt:p.id,name:window.YabisStudio?.choiceName(p)||p.name,quelle:p.source||p.manufacturerSource,format:format===null?null:format.map(Number),m2:Number(area),waste:Number(waste),flaeche:surface,raum:String(room).trim().slice(0,80)||'Bad / Projekt',...(applicationNote?{applicationNote:String(applicationNote).trim().slice(0,350)}:{}),verband:pattern,fuge:grout,...(wallHeight?{wallHeight}:{}),requested:requested||format===null||!p.formats.some(f=>f.join(',')===format.join(','))};
  }
  function add(items){saveCart([...getCart(),...items]);}
  function lines(cart){return cart.map((position,index)=>{
    const quantity=calculate(position.m2,position.waste,position.format);
    if(!quantity)throw Error('Bitte alle Flächen und Mengen im Anfragekorb prüfen.');
    const product=find(position.produkt);
    return [
      (index+1)+'. '+position.name+' · '+(position.flaeche||'Projektfläche'),
      position.raum?'Bereich: '+position.raum:'',
      position.applicationNote?'Eignung / Ausführung: '+position.applicationNote:'',
      position.format?'Format: '+position.format.join(' × ')+' cm'+(position.requested?' (Formatwunsch, bitte Verfügbarkeit bestätigen)':''):'Format auf Anfrage – keine Stückzahl berechnet.',
      heightLabel(position.wallHeight)?'Wandhöhe: '+heightLabel(position.wallHeight):'',
      'Fläche: '+de(position.m2)+' m² + '+position.waste+' % Verschnitt = '+de(quantity.total)+' m² Bedarf',
      quantity.pieces!==null?'Rechnerisch '+quantity.pieces+' '+(product?.kind==='Vinyl'||product?.kind==='Holzoptik'?'Stück':'Fliesen')+', Verpackungseinheiten bitte berücksichtigen.':'Verpackung und Stückzahl bitte anbieten.',
      'Verlegung: '+(position.verband||'Nach Absprache')+(position.fuge?'; Fuge: '+position.fuge:''),
      Number.isInteger(product?.catalogPriceCents)?'Richtpreis'+(priceCentsFor(product,position.format)!==product.catalogPriceCents?' für '+position.format.join(' × ')+' cm':'')+': '+priceLabelFor(product,position.format)+' inkl. MwSt.'+(product.catalogUnit?'':' (m² als Richtwert, Preiseinheit im Angebot bestätigen)')+(product.catalogPriceDate?' · Stand '+product.catalogPriceDate:'')+'.':'Preis auf Anfrage.',
      product?'Verfügbarkeit laut Shop: '+availabilityLabel(product):'',
      position.quelle?'Yabis-Katalog: '+position.quelle:''
    ].filter(Boolean).join('\n');}).join('\n\n');}
  function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  window.YabisShop={money,availability,availabilityLabel,priceLabel,priceLabelFor,priceCentsFor,formatLabel,estimateAssumingM2,products,find,de,calculate,validArea,validWaste,validFormat,getCart,saveCart,item,add,lines,download,key,heightLabel};
})();
