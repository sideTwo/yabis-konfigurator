(() => {
'use strict';
const S=YabisShop,$=s=>document.querySelector(s),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const kindButtons=[...document.querySelectorAll('[data-filter]')];
const filterFields=[...document.querySelectorAll('[data-facet]')];
const formatKey=([width,height])=>[Math.min(width,height),Math.max(width,height)].join('x');
const searchKey=value=>value.toLocaleLowerCase('de').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/(\d)\s*[×x]\s*(?=\d)/g,'$1x').trim();
const looks=[
  ['Marmoroptik',/marmor(?:optik|ierung|adern|-look)|onyx[- ]?optik/i],
  ['Steinoptik',/(?:naturstein|stein|travertin|schiefer|granit|kalkstein|sandstein)[- ]?optik|stein[- ]?look/i],
  ['Betonoptik',/beton[- ]?(?:optik|look|effekt)|zementoptik/i],
  ['Holzoptik',/holz[- ]?(?:optik|struktur|maserung|look)|eichenoptik|fischgr[äa]t/i],
  ['Terrazzo',/terrazzo/i]
];
// Ausgeblendete Artikel (z. B. ausverkauft) bleiben für Raumstudio und alte Anfragekörbe in den Daten, erscheinen aber nicht im Shop
const catalog=S.products.filter(product=>!product.hidden).map(product=>{
  const decor=[product.kind,product.name,product.description].filter(Boolean).join(' ');
  const optik=looks.filter(([,pattern])=>pattern.test(decor)).map(([name])=>name);
  const format=product.formats.map(formatKey);
  const oberflaeche=/lappato|teilpoliert/i.test(product.finish)?'Teilpoliert':product.finish;
  const type=['Vinyl','Terrassenplatten'].includes(product.kind)?product.kind:'Fliesen';
  return {product,type,facets:{optik,oberflaeche:oberflaeche?[oberflaeche]:[],format,verfuegbarkeit:[S.availability(product)]},
    search:searchKey([decor,type,product.finish,S.formatLabel(product),...format,...optik].filter(Boolean).join(' '))};
});
const alphabet=new Intl.Collator('de',{numeric:true,sensitivity:'base'});
let filter='alle',selected=null,toastTimer;
const isShop=Boolean($('#produktliste')),isCart=Boolean($('#korb'));
function toast(message,link){const box=$('#toast');if(!box)return;box.replaceChildren(el('span',message));if(link){const a=el('a',link.text,'toast-link');a.href=link.href;box.append(a);}box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.hidden=true,link?7000:4000);}
function persist(cart){try{S.saveCart(cart);return true;}catch{$('#korb-status').textContent='Speichern im Browser nicht möglich. Bitte Browser-Speicher freigeben.';return false;}}
function selectedFormat(){return $('#detail-format').value==='unknown'?null:$('#detail-format').value.split(',').map(Number);}
function formatOptions(product){
  const options=product.formats.map(format=>[format.join(','),format.join(' × ')+' cm · Katalogformat']);
  options.push(['unknown','Format mit Yabis abstimmen']);
  if(product.kind==='Terrassenplatten')return options;
  const requests=[[60,120],[60,60],[120,120]].filter(format=>!product.formats.some(known=>known.join(',')===format.join(',')));
  return [...options,...requests.map(format=>[format.join(','),format.join(' × ')+' cm · Formatwunsch'])];
}
function quantityLine(area,waste,format){const quantity=S.calculate(area,waste,format);return quantity?S.de(quantity.area)+' m² + '+quantity.waste+' % Verschnitt = '+S.de(quantity.total)+' m² Bedarf'+(quantity.pieces===null?' · Stückzahl nach Formatbestätigung':' · ca. '+quantity.pieces+' Stück'):'Bitte eine gültige Fläche und einen Verschnitt zwischen 0 und 30 % eingeben.';}
function updateDetail(){
  const format=selectedFormat(),known=format&&selected.formats.some(value=>value.join(',')===format.join(','));
  $('#format-note').textContent=known?'Dieses Format ist im Yabis-Katalog belegt.':format?'Formatwunsch: Verfügbarkeit für diesen Artikel bitte bestätigen.':'Das Format ist noch offen. Die Fläche kann bereits angefragt werden; wir erfinden keine Stückzahl.';
  $('#detail-quantity').textContent=$('#detail-area').value?quantityLine($('#detail-area').value,$('#detail-waste').value,format):'Geben Sie Ihre Fläche ein.';
  const cost=S.estimateAssumingM2(selected.id,$('#detail-area').value,$('#detail-waste').value,format);
  $('#detail-cost').textContent=$('#detail-estimate').checked?(cost!==null?'Ca. '+S.money(cost)+' inkl. MwSt. · ohne Kartonrundung und Lieferung.':'Für diesen Artikel gibt es keinen Preis pro m². Preis auf Anfrage.'):(Number.isInteger(selected.catalogPriceCents)?(S.priceCentsFor(selected,format)!==selected.catalogPriceCents?'Richtpreis für '+format.join(' × ')+' cm: ':'Katalogrichtpreis ')+S.priceLabelFor(selected,format)+' inkl. MwSt.':selected.catalogCurrency==='ZAR'?'Preis auf Anfrage. Die Währungsangabe im Quellkatalog wird geprüft.':'Preis auf Anfrage.');
}
const mediaFrame=el('div',null,'detail-media'),mediaControls=el('div',null,'media-controls'),mediaNote=el('p',null,'source-note');
if(isShop){$('#detail-photo').before(mediaFrame);mediaFrame.append($('#detail-photo'));}
mediaControls.setAttribute('role','group');mediaControls.setAttribute('aria-label','Produktbild auswählen');
mediaNote.setAttribute('role','status');
if(isShop)$('#detail-description').before(mediaControls,mediaNote);
// Beschreibung: am PC unter dem Bild, auf dem Handy direkt unter dem Produktnamen
const narrowDialog=matchMedia('(max-width:700px)'),placeDescription=()=>{const desc=$('#detail-description');if(narrowDialog.matches)$('#detail-name').after(desc);else mediaNote.after(desc);};
if(isShop){placeDescription();narrowDialog.addEventListener('change',placeDescription);}
function renderGallery(product){
  const views=YabisCatalogMedia.viewsFor(product),photo=$('#detail-photo');
  mediaControls.replaceChildren();
  mediaControls.hidden=views.length<2;
  const clear=()=>{
    photo.onerror=null;photo.removeAttribute('src');photo.alt='';mediaFrame.hidden=true;
    mediaNote.textContent='Eine Produktansicht ist derzeit nicht verfügbar.';
  };
  if(!views.length){clear();return;}
  const show=view=>{
    mediaFrame.hidden=false;
    mediaFrame.classList.toggle('is-original',Boolean(view.contain));
    photo.onerror=clear;
    photo.src=view.src;photo.alt=view.alt;mediaNote.textContent=view.note;
    for(const button of mediaControls.children)button.setAttribute('aria-pressed',String(button.dataset.view===view.id));
  };
  if(views.length>1)for(const view of views){
    const button=el('button',view.label);
    button.type='button';button.dataset.view=view.id;button.onclick=()=>show(view);mediaControls.append(button);
  }
  show(views[0]);
}
function openProduct(product){
  selected=product;
  $('#detail-name').textContent=product.name;
  $('#detail-brand').textContent=['Yabis-Katalog',product.kind].filter(Boolean).join(' · ');
  $('#detail-description').textContent=product.description||'';
  $('#detail-finish').textContent=[product.finish,S.formatLabel(product)].filter(Boolean).join(' · ')+' · '+S.priceLabel(product)+(Number.isInteger(product.catalogPriceCents)?' inkl. MwSt.':'');
  const availability=$('#detail-availability');availability.className='availability availability--'+S.availability(product);availability.textContent=S.availabilityLabel(product);
  renderGallery(product);
  const studioLink=window.YabisStudio.shoppingDestination(product.id);
  $('#detail-studio').hidden=!studioLink;
  if(studioLink)$('#detail-studio').href=studioLink;
  $('#product-form').reset();
  $('#detail-format').replaceChildren(...formatOptions(product).map(([value,label])=>{const option=el('option',label);option.value=value;return option;}));
  $('#product-error').textContent='';updateDetail();$('#product-dialog').showModal();
}
function renderProducts(){
  const terms=searchKey($('#suche').value).split(/\s+/).filter(Boolean);
  const facets=filterFields.filter(field=>field.value);
  const items=catalog.filter(item=>(filter==='alle'||item.type===filter)&&terms.every(term=>item.search.includes(term))&&facets.every(field=>item.facets[field.dataset.facet].includes(field.value)));
  if($('#sortierung').value==='name')items.sort((a,b)=>alphabet.compare(a.product.name,b.product.name));
  $('#treffer').textContent=items.length+' Artikel';
  $('#filter-reset').disabled=filter==='alle'&&!terms.length&&!facets.length&&!$('#sortierung').value;
  const cards=document.createDocumentFragment();
  for(const {product} of items){
    const card=el('article',null,'product-card'),preview=YabisCatalogMedia.viewsFor(product)[0];
    if(preview){
      const image=el('button',null,'product-image product-image--material'),photo=el('img');
      photo.src=preview.src;photo.alt=preview.alt;photo.loading='lazy';photo.decoding='async';
      photo.onerror=()=>image.remove();
      image.append(photo,el('span',product.kind,'image-tag'));
      if(product.finish)image.append(el('span',product.finish,'surface-tag'));
      image.setAttribute('aria-label',product.name+' ansehen');image.onclick=()=>openProduct(product);
      card.append(image);
    }
    const meta=el('div',null,'product-meta');meta.append(el('span','Yabis-Katalog'),el('span',S.formatLabel(product)));
    const button=el('button',null,'button');button.append(el('span','Menge & Angebot'),el('span','+'));button.setAttribute('aria-label',product.name+' anfragen');button.onclick=()=>openProduct(product);
    const priceNote=Number.isInteger(product.catalogPriceCents)?'Katalogrichtpreis · inkl. MwSt.':product.catalogCurrency==='ZAR'?'Währung im Katalog unklar':'';
    card.append(meta,el('h3',product.name),el('p',product.finish||''),el('p',S.availabilityLabel(product),'availability availability--'+S.availability(product)),el('strong',S.priceLabel(product),'product-price'));
    if(priceNote)card.append(el('p',priceNote,'price-note'));
    card.append(button);
    cards.append(card);
  }
  if(!items.length)cards.append(el('p','Keine passenden Artikel. Ändern Sie einen Filter oder den Suchbegriff.'));
  $('#produktliste').replaceChildren(cards);
}
function makeSelect(values,current,label){const select=el('select');select.setAttribute('aria-label',label);for(const [value,text]of values){const o=el('option',text);o.value=value;select.append(o);}select.value=current;return select;}
function field(text,control){const label=el('label',text);label.append(control);return label;}
function updateTotals(){if(!isCart){for(const e of document.querySelectorAll('[data-anzahl]'))e.textContent=S.getCart().length;return;}const cart=S.getCart(),quantities=cart.map(p=>S.calculate(p.m2,p.waste,p.format)),sum=k=>S.de(quantities.filter(Boolean).reduce((a,q)=>a+q[k],0));$('#cart-totals').replaceChildren();for(const [a,b]of [['Positionen',cart.length],['Fläche gesamt',sum('area')+' m²'],['Bedarf inkl. Verschnitt',quantities.every(Boolean)?sum('total')+' m²':'Mengen prüfen'],['Preis','Angebot auf Anfrage']]){const r=el('div',null,'cart-total');r.append(el('span',a),el('strong',String(b)));$('#cart-totals').append(r);}if(cart.length&&$('#estimate-toggle').checked){const known=cart.map(p=>S.estimateAssumingM2(p.produkt,p.m2,p.waste,p.format)).filter(x=>x!==null),r=el('div',null,'cart-total estimate-total');r.append(el('span',known.length===cart.length?'Richtwert':'Teilrichtwert'),el('strong',known.length?'ca. '+S.money(known.reduce((a,b)=>a+b,0))+' inkl. MwSt.':'Auf Anfrage'));$('#cart-totals').append(r);if(known.length<cart.length)$('#cart-totals').append(el('p','Weitere Positionen und Wunschformate auf Anfrage.','price-note'));}for(const e of document.querySelectorAll('[data-anzahl]'))e.textContent=cart.length;}
function renderCart(){
  if(!isCart){updateTotals();return;}
  const cart=S.getCart();$('#korb').replaceChildren();
  if(!cart.length){const empty=el('div',null,'empty-cart'),link=el('a','Zum Shop','text-link');link.href='katalog.html#produkte';empty.append(el('p','Ihr Anfragekorb ist noch leer. Wählen Sie Fliesen im Shop oder stellen Sie unten eine Schnellanfrage.'),link);$('#korb').append(empty);}
  for(const position of cart){
    const product=S.find(position.produkt),row=el('article',null,'cart-row'),body=el('div'),controls=el('div',null,'cart-controls');
    const preview=product&&YabisCatalogMedia.viewsFor(product)[0];
    if(preview){
      const media=el('div',null,'cart-media'),photo=el('img');
      photo.src=preview.src;photo.alt=preview.alt;photo.loading='lazy';
      photo.onerror=()=>{media.remove();row.classList.add('cart-row--text');};
      media.append(photo);
      row.append(media);
    }else row.classList.add('cart-row--text');
    const options=formatOptions(product||{formats:[]});
    if(position.format&&!options.some(([value])=>value===position.format.join(',')))options.push([position.format.join(','),position.format.join(' × ')+' cm · Wunsch']);
    const format=makeSelect(options,position.format?position.format.join(','):'unknown','Format '+position.name);
    const area=el('input');Object.assign(area,{type:'number',min:'.01',max:'100000',step:'.01',value:position.m2});area.setAttribute('aria-label','Fläche '+position.name);
    const wasteOptions=[0,5,10,15,20];if(!wasteOptions.includes(position.waste))wasteOptions.push(position.waste);
    const waste=makeSelect(wasteOptions.map(value=>[String(value),value+' %']),String(position.waste),'Verschnitt '+position.name);
    const result=el('p',null,'cart-result'),note=el('p',null,'source-note'),costLine=el('p',null,'price-note');
    const refresh=()=>{result.textContent=quantityLine(position.m2,position.waste,position.format);note.textContent=(position.requested?'Format und Verfügbarkeit bitte bestätigen.':'Katalogformat · Verpackung und Eignung werden bestätigt.')+(position.applicationNote?' '+position.applicationNote:'');const cost=S.estimateAssumingM2(position.produkt,position.m2,position.waste,position.format);costLine.textContent=$('#estimate-toggle').checked?(cost!==null?'Richtwert: ca. '+S.money(cost)+' inkl. MwSt.':'Preis auf Anfrage.'):'';};
    const change=()=>{const current=S.getCart(),index=current.findIndex(value=>value.id===position.id);if(index<0)return;current[index]=position;persist(current);refresh();updateTotals();};
    area.oninput=()=>{position.m2=Number(area.value);change();};waste.onchange=()=>{position.waste=Number(waste.value);change();};
    format.onchange=()=>{position.format=format.value==='unknown'?null:format.value.split(',').map(Number);position.requested=!position.format||!product?.formats.some(value=>value.join(',')===position.format.join(','));change();};
    controls.append(field('Format',format),field('Fläche in m²',area),field('Verschnitt',waste));
    const remove=el('button','Position entfernen','remove');remove.setAttribute('aria-label',position.name+' entfernen');remove.onclick=()=>{persist(S.getCart().filter(value=>value.id!==position.id));renderCart();$('#korb-status').textContent='Position aus dem Anfragekorb entfernt.';};
    const price=product?S.priceLabelFor(product,position.format):'Preis auf Anfrage';
    body.append(el('h3',position.name),el('p',(position.raum?position.raum+' · ':'')+(position.flaeche||'Projektfläche')+(S.heightLabel(position.wallHeight)?' · '+S.heightLabel(position.wallHeight):'')),el('p',Number.isInteger(product?.catalogPriceCents)?price+' inkl. MwSt. · Richtpreis':price,'price-note'),controls,result,costLine,note,remove);row.append(body);$('#korb').append(row);refresh();
  }
  updateTotals();
}
function selectType(type){
  filter=type;
  for(const button of kindButtons)button.setAttribute('aria-pressed',String(button.dataset.filter===type));
  renderProducts();
}
if(isShop){
const knownFormats=[...new Set(catalog.flatMap(item=>item.facets.format))].sort(alphabet.compare);
for(const format of knownFormats)$('#filter-format').add(new Option(format.replace('x',' × ')+' cm',format));
for(const button of kindButtons)button.onclick=()=>selectType(button.dataset.filter);
for(const field of [...filterFields,$('#sortierung')])field.onchange=renderProducts;
$('#suche').oninput=renderProducts;
$('#filter-reset').onclick=()=>{
  $('#suche').value='';$('#sortierung').value='';
  for(const field of filterFields)field.value='';
  selectType('alle');
};
$('#product-close').onclick=()=>$('#product-dialog').close();for(const id of ['detail-format','detail-waste','detail-area','detail-estimate'])$('#'+id).addEventListener('input',updateDetail);
$('#product-form').onsubmit=e=>{e.preventDefault();try{S.add([S.item({product:selected.id,area:$('#detail-area').value,waste:$('#detail-waste').value,format:selectedFormat(),surface:$('#detail-surface').value.trim()||'Projektfläche'})]);renderCart();$('#product-dialog').close();toast(`${selected.name} liegt in Ihrem Anfragekorb.`,{text:'Zum Anfragekorb →',href:'anfragekorb.html'});}catch(error){$('#product-error').textContent=error.message;}};
}
if(isCart){
const form=$('#kontaktformular');form.elements.weg.onchange=()=>{const delivery=form.elements.weg.value==='Lieferung';form.elements.plz.required=delivery;$('#zip-note').textContent=delivery?'(erforderlich)':'(optional)';};
form.onsubmit=e=>{e.preventDefault();$('#kontakt-fehler').textContent='';if(!form.reportValidity())return;const data=new FormData(form),cart=S.getCart();if(!cart.length&&!data.get('nachricht').trim()){$('#kontakt-fehler').textContent='Bitte wählen Sie mindestens einen Artikel oder beschreiben Sie Ihre Anfrage.';return;}let items;try{items=S.lines(cart);}catch(error){$('#kontakt-fehler').textContent=error.message;return;}const estimates=cart.map(p=>S.estimateAssumingM2(p.produkt,p.m2,p.waste,p.format)),known=estimates.filter(x=>x!==null),estimateText=$('#estimate-toggle').checked&&known.length?'\n\n'+(known.length===cart.length?'Richtwert':'Teilrichtwert')+' nach Quadratmeterpreisen: ca. '+S.money(known.reduce((a,b)=>a+b,0))+' inkl. MwSt. Kartoneinheiten, Lieferung und abweichende Formate bitte im Angebot berücksichtigen.':'';const text=`Hallo Yabi’s Fliesenwelt,\nbitte erstellen Sie mir ein unverbindliches Angebot.\n\n${items||'Schnellanfrage ohne Produktauswahl'}${estimateText}\n\nNachricht: ${data.get('nachricht')||'–'}\n\n${data.get('kundentyp')}\nFirma: ${data.get('firma')||'–'}\nName: ${data.get('name')}\nRückkontakt: ${data.get('rueckkontakt')}\n${data.get('weg')}${data.get('plz')?' · PLZ '+data.get('plz'):''}\n\nBitte Oberfläche, gewünschte Formate, Eignung, Verfügbarkeit, Verpackungseinheiten und Preise bestätigen. Dies ist eine Anfrage, keine Bestellung.`;if(e.submitter?.value==='download'){S.download(text,'yabis-produktanfrage.txt');$('#form-status').textContent='Anfrage als Textdatei vorbereitet. Es wurde nichts versendet.';}else if(e.submitter?.value==='mail'){location.href=`mailto:info@yabisfliesenwelt.de?subject=${encodeURIComponent('Fliesenanfrage – Yabi’s')}&body=${encodeURIComponent(text)}`;$('#form-status').textContent='E-Mail-Entwurf vorbereitet. Bitte selbst prüfen und absenden.';}else{window.open(`https://wa.me/491786787724?text=${encodeURIComponent(text)}`,'_blank','noopener');$('#form-status').textContent='WhatsApp-Entwurf vorbereitet. Bitte selbst prüfen und absenden.';}};
$('#estimate-toggle').onchange=renderCart;
}
addEventListener('storage',e=>{if(e.key===S.key)renderCart();});addEventListener('pageshow',renderCart);
if(isShop){const requestedType=new URLSearchParams(location.search).get('typ');
selectType(kindButtons.some(button=>button.dataset.filter===requestedType)?requestedType:'alle');}
renderCart();
})();
