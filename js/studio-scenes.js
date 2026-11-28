/* Photographic anchors in canvas pixels. Dimensions are visual reference sizes in cm. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisStudioScenes=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 // Four intersections of the photographed joints in the lower foreground.
 const livingCorners=[[464,708],[1312,773],[1318,898],[331,812]];
 // The counter and shelf are the lower and upper edges of the same wall.
 const kitchenCorners=[[337,293],[1672,210],[1672,664],[337,572]];
 const kitchenWall=[[337,293],[753,270],[1672,210],[1672,664],[1428,646],[750,596],[337,572]];
 const kitchenFixtures=[
  [[350,574],[355,455],[375,447],[376,431],[383,416],[400,414],[410,405],[410,376],[414,369],[430,367],[434,378],[426,411],[432,414],[452,415],[462,421],[464,461],[473,485],[481,477],[490,475],[494,481],[480,507],[484,526],[486,548],[532,547],[542,552],[539,582],[522,588],[424,587]],
  [[1013,487],[1013,461],[1019,442],[1027,430],[1040,423],[1051,421],[1119,421],[1134,425],[1145,435],[1151,450],[1152,551],[1158,551],[1158,569],[1189,570],[1190,524],[1197,524],[1197,570],[1205,579],[1206,591],[1200,598],[1158,596],[1159,636],[1126,635],[1126,551],[1134,551],[1134,466],[1130,451],[1120,441],[1046,441],[1037,452],[1032,467],[1032,487]],
  [[1429,650],[1430,585],[1443,581],[1506,582],[1517,586],[1518,613],[1528,609],[1536,592],[1544,589],[1549,580],[1561,581],[1568,594],[1584,597],[1591,593],[1604,592],[1610,583],[1620,583],[1628,591],[1637,595],[1643,612],[1672,618],[1672,669]]
 ];
 const balconyFloor=[[277,562],[660,438],[1543,492],[1523,941],[1112,941],[279,787]];
 const balconyCorners=[[656,437],[1543,492],[1920,1075],[-100,752]];
 const balconyFixtures=[
  [[392,349],[400,342],[431,336],[534,336],[560,342],[569,349],[562,365],[568,385],[568,433],[561,479],[552,511],[540,533],[520,544],[487,551],[452,550],[426,546],[414,539],[401,518],[393,492],[389,461],[389,403],[392,376],[398,363]],
  [[660,427],[670,425],[670,440],[660,442]],
  [[719,376],[747,379],[739,420],[726,505],[721,511],[708,510],[711,486]],
  [[803,377],[820,377],[804,464],[799,473],[788,474],[789,461]],
  [[878,328],[901,326],[905,494],[899,528],[892,530],[890,539],[874,540]],
  [[948,363],[975,360],[978,487],[962,488],[961,480],[948,482]],
  [[1195,400],[1248,399],[1248,532],[1244,567],[1229,570],[1228,512],[1220,510],[1219,567],[1201,569],[1198,543]],
  [[1417,402],[1439,402],[1456,512],[1454,520],[1436,520],[1428,483]],
  [[1452,391],[1476,398],[1503,541],[1494,553],[1487,556],[1480,533],[1471,481]]
 ];
 const entranceLanding=[[80,683],[211,629],[385,608],[437,579],[686,575],[686,578],[861,578],[885,537],[949,537],[955,534],[1284,534],[1294,544],[1449,545],[1512,583],[1672,583],[1672,682]];
 const entranceRiser=[[80,684],[1672,682],[1672,733],[80,735]];
 const entrancePath=[[239,734],[1672,733],[1672,941],[25,941]];
 // Each row locates the back of the tread, its lip and the foot of its riser.
 const stairs=[
  [[656,998,146],[650,1137,160],[650,1135,220]],
  [[650,1135,220],[625,1161,229],[625,1159,294]],
  [[625,1159,294],[594,1189,308],[594,1188,379]],
  [[594,1188,379],[558,1224,402],[558,1220,477]],
  [[558,1220,477],[519,1265,512],[520,1260,597]],
  [[520,1260,597],[473,1310,648],[475,1308,743]],
  [[475,1308,743],[423,1370,818],[425,1366,923]],
  [[425,1366,923],[411,1381,941]]
 ];
 const stairFixtures=[[[674,128],[837,128],[827,143],[811,151],[764,151],[754,156],[711,159],[686,155],[678,151]]];
 const band=([l0,r0,y0],[l1,r1,y1])=>[[l0,y0],[r0,y0],[r1,y1],[l1,y1]];
 function face(grid,id,surface,corners,[maxU,maxV],polygons=[corners]){
  const field=[[0,0],[maxU,0],[maxU,maxV],[0,maxV]];
  const inverse=grid.homography(corners,field);
  const visible=polygons.flat().map(point=>grid.project(inverse,point));
  const u=visible.map(point=>point[0]),v=visible.map(point=>point[1]);
  const plane={surface,minU:Math.min(0,...u),maxU:Math.max(maxU,...u),
   minV:Math.min(0,...v),maxV:Math.max(maxV,...v),matrix:grid.homography(field,corners)};
  return {id,surface,polygons,maxV:plane.maxV,plane,inverse};
 }
 function scene(id,grid,living){
  const floor=(name,corners,size,polygons)=>face(grid,name,'floor',corners,size,polygons);
  switch(id){
   case 'wohnen':{
    const livingFloor=floor('living-floor',livingCorners,[240,60],living.photoFloor||living.floor);
    livingFloor.plane.longAcross=true;
    return {faces:[livingFloor],holes:living.occlusions};
   }
   case 'kueche':return {faces:[face(grid,'backsplash','wall',kitchenCorners,[260,60],[kitchenWall])],holes:kitchenFixtures};
   case 'balkon':{
    const balcony=floor('balcony-floor',balconyCorners,[320,280],[balconyFloor]);
    balcony.plane.catalogFormat=true;
    return {faces:[balcony],holes:balconyFixtures,matte:balconyMatte};
   }
   case 'eingang':{
    const faces=[
    floor('entry-landing',[[469,534],[1380,533],[1672,682],[80,683]],[480,190],[entranceLanding]),
    {...floor('entry-riser',entranceRiser,[480,17]),progress:190},
    {...floor('entry-path',[[80,735],[1672,733],[1990,941],[-238,941]],[480,205],[entrancePath]),progress:207}
    ];
    for(const {plane} of faces){plane.catalogFormat=true;plane.longAcross=true;}
    return {faces,holes:[]};
   }
   case 'treppe':{
    let distance=0;
    const faces=stairs.flatMap(([back,lip,foot],i)=>{
     const depth=i===0?90:29;
     const tread={...floor('tread-'+i,band(back,lip),[120,depth]),variant:2*i+1,progress:distance};
     distance+=depth;
     if(!foot)return [tread];
     const riser={...floor('riser-'+i,band(lip,foot),[120,18]),variant:2*i+2,progress:distance};
     distance+=18;
     return [tread,riser];
    });
    return {faces,holes:stairFixtures,slabs:true};
   }
   default:return null;
  }
 }
 const mattes=new WeakMap();
 function balconyMatte(ctx,base){
  if(mattes.has(base))return mattes.get(base);
  const mask=ctx.canvas.ownerDocument.createElement('canvas');
  mask.width=ctx.canvas.width;mask.height=ctx.canvas.height;
  const g=mask.getContext('2d',{willReadFrequently:true});
  g.drawImage(base,0,0);
  const rgba=g.getImageData(0,0,mask.width,mask.height),pixels=rgba.data;
  // Blurred olive leaves in front of the balcony need a soft matte. Their
  // yellow-green colour separates them from the neutral slabs behind them.
  for(let y=0,p=0;y<mask.height;y++)for(let x=0;x<mask.width;x++,p+=4){
   const chroma=pixels[p+1]-pixels[p+2];
   pixels[p+3]=x>1335&&y>520?Math.max(0,Math.min(255,(chroma-17)*16)):0;
  }
  g.putImageData(rgba,0,0);mattes.set(base,mask);
  return mask;
 }
 return {scene};
});
