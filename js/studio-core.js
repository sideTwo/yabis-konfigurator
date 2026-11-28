/* The studio shortlist is intentionally independent of the complete shop. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisStudio=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const materials=Object.freeze(['habitat-perla','bercy-terra']);
 const bestsellers=Object.freeze([
  'wonder-base','luna-offwhite','concept-white','nepal','origin-beige','habitat-marfil',
  'capitol-hueso','rijn-visgraat','donau-visgraat','ganges-visgraat','cesar-pul-beige',
  'flavio-oxido','fiordi-bosco-sand','fiordi-bosco-sand-2','marshall-desert'
 ]);
 const vinyl=Object.freeze(['rijn-visgraat','donau-visgraat','ganges-visgraat']);
 const ceramics=Object.freeze(bestsellers.filter(id=>!vinyl.includes(id)));
 const exteriorMaterials=Object.freeze(['cambridge','miami','lissabon','porto','radeburg'].map(id=>'terrassenplatte-'+id));
 const isTerracePlate=id=>exteriorMaterials.includes(id);
 const stairMaterials=Object.freeze([...materials,'luna-offwhite','habitat-marfil','origin-beige','fiordi-bosco-sand','marshall-desert']);
 const balconyMaterials=Object.freeze([...materials,...exteriorMaterials.filter(id=>id!=='terrassenplatte-radeburg')]);
 const roomMaterials=Object.freeze({bad:ceramics,wohnen:bestsellers,balkon:balconyMaterials,kueche:ceramics,treppe:stairMaterials,eingang:exteriorMaterials});
 const presets=Object.freeze({
  bad:[
   {id:'warm',name:'Warm und ruhig',floor:'marshall-desert',wall:'habitat-marfil',floorGrout:'sand',wallGrout:'light'},
   {id:'naturstein',name:'Heller Naturstein',floor:'capitol-hueso',wall:'nepal',floorGrout:'light',wallGrout:'light'},
   {id:'kontrast',name:'Dunkler Akzent',floor:'concept-white',wall:'flavio-oxido',floorGrout:'light',wallGrout:'dark'}
  ],
  kueche:[
   {id:'hell',name:'Hell und ruhig',wall:'wonder-base',cabinetTone:'light'},
   {id:'warm',name:'Warmer Stein',wall:'cesar-pul-beige',cabinetTone:'light'},
   {id:'kontrast',name:'Dunkler Akzent',wall:'flavio-oxido',cabinetTone:'dark'}
  ],
  wohnen:[
   {id:'eiche',name:'Warmes Fischgrät',floor:'rijn-visgraat'},
   {id:'stein',name:'Heller Stein',floor:'capitol-hueso',floorGrout:'light'},
   {id:'akzent',name:'Dunkler Stein',floor:'flavio-oxido',floorGrout:'dark'}
  ]
 });
 const emigres='https://tera-in.com/files/modules/1487/emigres-catalogo-cersaie-2025-baja-7887.pdf';
 const flavioImage=name=>'bilder/katalog/hersteller-2026-11-20/flavio-oxido-'+name+'.webp';
 const additionalProducts=Object.fromEntries([
  ['capitol-hueso','Capitol Hueso','Ecoceramic','Matt','https://www.ecoceramic.es/productos/60x60-ec-capitol-hueso/'],
  ['cesar-pul-beige','Cesar Pul Beige','Emigres','Poliert',emigres+'#page=12'],
  ['flavio-oxido','Flavio Oxido','Emigres','Lappato',emigres+'#page=17',{
   decor:flavioImage('dekor'),surface:flavioImage('lappato'),
   installation:flavioImage('verlegt'),installationFormat:'120 × 120 cm',
   studioSample:{photo:flavioImage('120x120'),size:120},
   description:'Dunkelbraune Steinoptik mit rostfarbenen Nuancen und partiell glänzender Lappato-Oberfläche.'
  }]
 ].map(([id,name,brand,finish,manufacturerSource,media])=>{
  const decor=media?.decor||'bilder/katalog/hersteller-2026-11-18/'+id+'.webp';
  const photo=media?.surface||decor;
  return [id,{id,name,brand,finish,manufacturerSource,photo,
   manufacturerImage:{photo:decor,brand,page:manufacturerSource,surface:media?.surface,
    installation:media?.installation,installationFormat:media?.installationFormat},
   studioSample:media?.studioSample,description:media?.description,
   kind:'Fliesen',formats:[],catalogPriceCents:null}];
 }));
 const isVinyl=id=>vinyl.includes(id);
 const choiceName=p=>p.name+(p.id==='fiordi-bosco-sand'?' · Matt':p.id==='fiordi-bosco-sand-2'?' · Leichter Glanz':'');
 const fiorSample={photo:'assets/studio/texturen/fiordi-bosco-sand.webp',page:'https://www.prissmacer.es/en/serie/fior-di-bosco/'};
 const studioSamples={
  'luna-offwhite':{photo:'assets/studio/texturen/luna-offwhite.webp',page:'https://www.qua.com.tr/en/tiles/interior-tiles/luna/luna-offwhite-60X120'},
  'concept-white':{photo:'assets/studio/texturen/concept-white.webp',page:'https://www.prissmacer.es/serie/gv-lab-concept-2/'},
  'fiordi-bosco-sand':fiorSample,'fiordi-bosco-sand-2':fiorSample,
  'marshall-desert':{photo:'assets/studio/texturen/marshall-desert.webp',page:'https://drevexceramics.com/colecciones/marshall/'}
 };
 const materialSample=p=>isTerracePlate(p.id)?'assets/studio/texturen/'+p.id+'.webp':
  p.studioSample?.photo||studioSamples[p.id]?.photo||p.manufacturerImage?.photo||p.reconstruction||p.photo;
 const sampleSource=p=>studioSamples[p.id]?.page||p.manufacturerImage?.page||p.manufacturerSource;
 const demoFormat=id=>id==='capitol-hueso'?[60,60]:[60,120];
 const usesTextures=room=>Object.hasOwn(rooms,room);
 const presetsFor=room=>Object.hasOwn(presets,room)?presets[room]:[];
 const grainMode=value=>value==='natural'?'natural':'continuous';
 const grainSeed=value=>Number.isInteger(value)&&value>=0&&value<=0x7fffffff?value:0;
 const bathAssets=Object.freeze({base:'assets/studio/bad-og-basis-glas.webp',fixtures:'assets/studio/bad-og-basis-glas.webp',poster:'assets/studio/bad-og-vorschau-glas.webp',photo:'assets/studio/bad-foto-neutral.webp'});
 // Photograph registration is separate from the metric tile grid. These are
 // the actual source-image ceiling edges, not desired grout positions.
 const bathRegistrations={
  'habitat-perla':[[414,0],[493,83],[1168,80],[1247,0]],
  'bercy-terra':[[390,0],[471,85],[1164,80],[1246,0]]
 };
 const bathRegistration=id=>bathRegistrations[id]||null;
 function bathPlate(product){const id=typeof product==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(product)?product:materials[0];return `assets/studio/bad-og-${id}.webp`;}
 const rooms=Object.freeze({
  bad:{name:'Bad',title:'Ihr Bad. Ihre Kombination.',surface:'floor',surfaceName:'Boden',separateWalls:true,image:bathAssets.poster,note:'Wand und Boden unabhängig gestalten. Bei 1,20 m bleiben die oberen Wände weiß; die Dusche ist immer raumhoch gefliest.'},
  wohnen:{name:'Wohnen',title:'Ein neuer Boden fürs Zuhause.',surface:'floor',surfaceName:'Wohnbereich · Boden',image:'assets/website/wohnen.webp',note:'Vergleichen Sie Fliesen und Fischgrätvinyl im selben Wohnraum.'},
  balkon:{name:'Balkon',title:'Ihr Platz unter freiem Himmel.',surface:'floor',surfaceName:'Balkon · Boden',image:'assets/website/balkon.webp',approval:'Außeneignung, Rutschhemmung und Aufbau durch Yabis bestätigen lassen.',note:'Gestaltungsvorschau. Ob der gewählte Artikel für Ihren Balkon geeignet ist, klären wir vor dem Angebot.'},
  kueche:{name:'Küche',title:'Die Küche weiterdenken.',surface:'wall',surfaceName:'Küchenrückwand',image:'assets/website/kueche.webp',note:'Kombinieren Sie die Rückwand mit hellen oder anthrazitfarbenen Küchenfronten. Die Fronten dienen der Raumansicht; Ihre Anfrage umfasst die Fliesen.'},
  treppe:{name:'Treppenhaus',title:'Schritt für Schritt stimmig.',surface:'floor',surfaceName:'Treppe · Stufen & Podest',image:'assets/studio/treppe-foto-neutral.webp',approval:'Stufenkanten, Zuschnitte, Aufbau und Rutschhemmung durch Yabis bestätigen lassen.',note:'Die Fläche umfasst Trittflächen, Setzstufen und Podeste. Stufenmaße und Kanten stimmen wir im Angebot ab.'},
  eingang:{name:'Außenbereich',title:'Terrassenplatten für draußen.',surface:'floor',surfaceName:'Außenbereich · Weg und Podest',image:'assets/studio/eingang-foto-neutral.webp',approval:'Aufbau, Frostbeständigkeit und Eignung am Einbauort bestätigt Yabis im Angebot.',note:'Vergleichen Sie Terrassenplatten auf Weg und Podest.'}
 });
 function roomId(value){return Object.hasOwn(rooms,value)?value:'bad';}
 function scenePhoto(room,cabinetTone){
  room=roomId(room);
  const dark=room==='kueche'&&cabinetTone==='dark'?'-dunkel':'';
  return `assets/studio/${room}${dark}-foto-neutral.webp`;
 }
 function materialsFor(room){return roomMaterials[roomId(room)]||materials;}
 function materialId(value,room){const choices=room===undefined?materials:materialsFor(room);return choices.includes(value)?value:choices[0];}
 function href(room='bad',product){const params=new URLSearchParams({raum:roomId(room)});if(materialsFor(room).includes(product))params.set('product',product);return 'studio/index.html?'+params;}
 function shoppingDestination(product){if(isTerracePlate(product))return href('eingang',product);return bestsellers.includes(product)?href(isVinyl(product)?'wohnen':'bad',product):null;}
 function plate(room,product,cabinetTone='light'){room=roomId(room);if(room==='bad')throw Error('Das Bad verwendet getrennte Flächen.');return `assets/studio/${room}-${materialId(product)}${room==='kueche'&&cabinetTone==='dark'?'-dunkel':''}.webp`;}
 function initial(room,saved={},product){room=roomId(room);const r=rooms[room],state={floor:materialId(saved.floor,room),wall:materialId(saved.wall,room),wallHeight:saved.wallHeight==='full'?'full':'120'};if(room==='kueche')state.cabinetTone=saved.cabinetTone==='dark'?'dark':'light';if(materialsFor(room).includes(product))state[r.surface]=product;return state;}
 function motionAllowed({reduced=false,saveData=false}={}){return !reduced&&!saveData;}
 return {materials,bestsellers,additionalProducts,isVinyl,isTerracePlate,choiceName,materialSample,sampleSource,demoFormat,usesTextures,materialsFor,shoppingDestination,presetsFor,grainMode,grainSeed,bathAssets,bathPlate,bathRegistration,rooms,roomId,materialId,href,plate,scenePhoto,initial,motionAllowed};
});
