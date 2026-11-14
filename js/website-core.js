((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisWebsite=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const rooms={
  bad:{name:'Badezimmer',title:'Das Bad. Ganz nach Ihnen.',kicker:'IHR PERSÖNLICHER RÜCKZUGSORT',copy:'Boden und Wand einzeln kombinieren. Materialien vergleichen und Ihre Idee mit in die Beratung nehmen.',image:'konfigurator-neu/assets/konfiguration/habitat-perla-120.png',alt:'Badansicht mit grauen Boden- und Wandfliesen'},
  wohnen:{name:'Wohnen & Vinyl',title:'Zuhause fängt am Boden an.',kicker:'WÄRME FÜR DEN ALLTAG',copy:'Holzoptik, ruhige Töne, ein neuer Look. Entdecken Sie den Boden, der zu Ihrem Leben passt.',image:'assets/website/wohnen.webp',alt:'Wohnzimmer mit natürlichem Boden in Holzoptik'},
  balkon:{name:'Balkon',title:'Ihr Lieblingsplatz. Draußen.',kicker:'EIN STÜCK MEHR ZUHAUSE',copy:'Ein neuer Boden für Ihren Platz im Freien. Wir besprechen Material, Aufbau und Eignung mit Ihnen.',image:'assets/website/balkon.webp',alt:'Balkon mit Steinoptik-Boden und Holzmöbeln'},
  kueche:{name:'Küchenwand',title:'Eine Wand. Viel Charakter.',kicker:'DIE KÜCHE WEITERDENKEN',copy:'Eine passende Rückwand verbindet Arbeitsfläche und Raum. Spielen Sie mit Farbe, Format und Oberfläche.',image:'assets/website/kueche.webp',alt:'Küche mit heller gefliester Rückwand und Arbeitsfläche in Holzoptik'},
  treppe:{name:'Treppenhaus',title:'Schritt für Schritt stimmig.',kicker:'MATERIAL MIT VERBINDUNG',copy:'Von der ersten Stufe bis zum Podest. Finden Sie eine Gestaltung, die Ihr Zuhause zusammenbringt.',image:'assets/website/treppe.webp',alt:'Treppenhaus mit hellen Fliesen auf Stufen und Podest'}
 };
 const clean=(v,max=2000)=>String(v??'').trim().slice(0,max);
 function inquiry(data,cartText=''){
  const d=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,clean(v)]));
  if(!d.name||!d.contact||!d.message)throw Error('Bitte Name, Rückkontakt und Ihre Idee oder Artikelliste ausfüllen.');
  if(d.delivery==='delivery'&&(!/^\d{5}$/.test(d.postcode)||!d.city))throw Error('Bitte Liefer-PLZ und Lieferort angeben.');
  const room=rooms[d.room]?.name||'Mehrere Bereiche / Materialliste';
  return ['Hallo Yabis Fliesenwelt,','ich möchte mein Projekt unverbindlich mit Ihnen besprechen.','',d.customerType==='trade'?'Gewerbeanfrage':'Privatanfrage',...(d.company?['Firma: '+d.company]:[]),'Bereich: '+room,'Name: '+d.name,'Rückkontakt: '+d.contact,...(d.quantity?['Menge / Fläche: '+d.quantity]:[]),...(d.date?['Wunschtermin: '+d.date]:[]),'',d.delivery==='delivery'?'Lieferung angefragt: '+d.postcode+' '+d.city+(d.address?' · '+d.address:''):'Abholung gewünscht',...(d.delivery==='delivery'?['Bitte Liefermöglichkeit und Lieferkosten individuell anbieten.']:[]),'','Meine Idee / Artikelliste:',d.message,...(cartText?['','Bereits ausgewählte Artikel:',clean(cartText,15000)]:[]),'','Bitte Verfügbarkeit, Menge, Eignung und Konditionen bestätigen. Dies ist eine Anfrage, keine Bestellung.'].join('\n');
 }
 return {rooms,inquiry};
});
