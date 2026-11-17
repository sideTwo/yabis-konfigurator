/* The studio shortlist is intentionally independent of the complete shop. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisStudio=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const materials=Object.freeze(['habitat-perla','bercy-terra']);
 const bathAssets=Object.freeze({base:'assets/studio/bad-og-basis-glas.webp',fixtures:'assets/studio/bad-og-basis-glas.webp',poster:'assets/studio/bad-og-vorschau-glas.webp'});
 function bathPlate(product){const id=typeof product==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(product)?product:materials[0];return `assets/studio/bad-og-${id}.webp`;}
 const rooms=Object.freeze({
  bad:{name:'Bad',title:'Ihr Bad. Ihre Kombination.',surface:'floor',surfaceName:'Boden',separateWalls:true,image:bathAssets.poster,note:'Wand und Boden unabhängig gestalten. Bei 1,20 m bleiben die oberen Wände weiß; die Dusche ist immer raumhoch gefliest.'},
  wohnen:{name:'Wohnen',title:'Ein neuer Boden fürs Zuhause.',surface:'floor',surfaceName:'Wohnbereich · Boden',image:'assets/website/wohnen.webp',note:'Vergleichen Sie zwei Fliesen in Ihrem Wohnbereich. Vinyl ergänzen wir mit der nächsten Produktauswahl.'},
  balkon:{name:'Balkon',title:'Ihr Platz unter freiem Himmel.',surface:'floor',surfaceName:'Balkon · Boden',image:'assets/website/balkon.webp',approval:'Außeneignung, Rutschhemmung und Aufbau durch Yabis bestätigen lassen.',note:'Gestaltungsvorschau. Ob der gewählte Artikel für Ihren Balkon geeignet ist, klären wir vor dem Angebot.'},
  kueche:{name:'Küche',title:'Die Küche weiterdenken.',surface:'wall',surfaceName:'Küchenrückwand',image:'assets/website/kueche.webp',note:'Kombinieren Sie die Rückwand mit hellen oder anthrazitfarbenen Küchenfronten. Die Fronten dienen der Raumansicht; Ihre Anfrage umfasst die Fliesen.'},
  treppe:{name:'Treppenhaus',title:'Schritt für Schritt stimmig.',surface:'floor',surfaceName:'Treppe · Stufen & Podest',image:'assets/website/treppe.webp',approval:'Stufenkanten, Zuschnitte, Aufbau und Rutschhemmung durch Yabis bestätigen lassen.',note:'Die Fläche umfasst Trittflächen, Setzstufen und Podeste. Stufenmaße und Kanten stimmen wir im Angebot ab.'},
  eingang:{name:'Außenfliesen',title:'Willkommen beginnt vor der Tür.',surface:'floor',surfaceName:'Außenfliesen · Weg & Podest',image:'assets/studio/eingang-habitat-perla.webp',approval:'Außeneignung, Frostbeständigkeit, Rutschhemmung und Aufbau durch Yabis bestätigen lassen.',note:'Gestaltungsvorschau für Weg, Podest und Stufe. Außeneignung und Aufbau werden vor dem Angebot bestätigt.'}
 });
 function roomId(value){return Object.hasOwn(rooms,value)?value:'bad';}
 function materialId(value){return materials.includes(value)?value:materials[0];}
 function href(room='bad',product){const params=new URLSearchParams({raum:roomId(room)});if(materials.includes(product))params.set('product',product);return 'studio/index.html?'+params;}
 function plate(room,product,cabinetTone='light'){room=roomId(room);if(room==='bad')throw Error('Das Bad verwendet getrennte Flächen.');return `assets/studio/${room}-${materialId(product)}${room==='kueche'&&cabinetTone==='dark'?'-dunkel':''}.webp`;}
 function initial(room,saved={},product){room=roomId(room);const r=rooms[room],state={floor:materialId(saved.floor),wall:materialId(saved.wall),wallHeight:saved.wallHeight==='full'?'full':'120'};if(room==='kueche')state.cabinetTone=saved.cabinetTone==='dark'?'dark':'light';if(materials.includes(product))state[r.surface]=product;return state;}
 function motionAllowed({reduced=false,saveData=false}={}){return !reduced&&!saveData;}
 return {materials,bathAssets,bathPlate,rooms,roomId,materialId,href,plate,initial,motionAllowed};
});
