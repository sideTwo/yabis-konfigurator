((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisCatalogMedia=api;})(typeof window==='object'?window:this,()=>{
  'use strict';
  function viewsFor(product){
    const reconstruction=product.reconstruction?{
      id:'reconstruction',label:product.kind==='Terrassenplatten'?'Oberflächenansicht':'Oberfläche',src:product.reconstruction,
      alt:product.name+' – Oberflächenansicht',
      note:'Farbe, Maserung und Lichtwirkung können vom gelieferten Stück abweichen.'
    }:null;
    if(product.kind==='Terrassenplatten')return reconstruction?[reconstruction]:[];

    const views=[],manufacturer=product.manufacturerImage;
    if(manufacturer?.surface)views.push({
      id:'finish',label:'Oberfläche',src:manufacturer.surface,
      alt:product.name+' – Herstellerdetail im Streiflicht',
      note:'Herstellerdetail im Streiflicht. Der Glanz verändert sich mit dem Lichteinfall.'
    });
    const decor=manufacturer&&(manufacturer.photo||product.photo);
    if(decor&&!decor.startsWith('bilder/katalog/eigene/'))views.push({
      id:'decor',label:'Dekor',src:decor,alt:'Herstellermuster '+product.name,
      contain:Boolean(manufacturer.surface),
      note:'Original-Herstellermuster. Dekorbeispiel, keine farbverbindliche Wiedergabe.'
    });
    if(reconstruction)views.push(reconstruction);
    if(manufacturer?.installation)views.push({
      id:'installation',label:'Verlegt',src:manufacturer.installation,
      alt:product.name+' verlegt auf Boden und Akzentwand',contain:true,
      note:'Herstellerbeispiel auf Boden und Akzentwand'+(manufacturer.installationFormat?' · '+manufacturer.installationFormat:'.')
    });
    return views;
  }
  return {viewsFor};
});
