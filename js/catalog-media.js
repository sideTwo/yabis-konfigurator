((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisCatalogMedia=api;})(typeof window==='object'?window:this,()=>{
  'use strict';
  function viewsFor(product){
    const views=[];
    const manufacturer=product.manufacturerImage;
    if(manufacturer?.surface)views.push({
      id:'finish',label:'Oberfläche',src:manufacturer.surface,alt:product.name+' – Herstellerdetail im Streiflicht',
      note:'Herstellerdetail im Streiflicht. Der Glanz verändert sich mit dem Lichteinfall.'
    });
    if(manufacturer)views.push({
      id:'decor',label:'Dekor',src:manufacturer.photo||product.photo,alt:'Herstellermuster '+product.name,
      contain:Boolean(manufacturer.surface),
      note:'Original-Herstellermuster. Dekorbeispiel, keine farbverbindliche Wiedergabe.'
    });
    if(product.reconstruction)views.push({
      id:'reconstruction',label:'Oberfläche',src:product.reconstruction,alt:product.name+' – Oberflächenansicht',
      note:'Farbe, Maserung und Lichtwirkung können vom gelieferten Stück abweichen.'
    });
    if(manufacturer?.installation)views.push({
      id:'installation',label:'Verlegt',src:manufacturer.installation,alt:product.name+' verlegt auf Boden und Akzentwand',
      contain:true,
      note:'Herstellerbeispiel auf Boden und Akzentwand'+(manufacturer.installationFormat?' · '+manufacturer.installationFormat:'.')
    });
    return views;
  }
  return {viewsFor};
});
