/* Fixed camera calibration. Material and grout renderers share these exact faces. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisRoomPreview=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const width=1672,height=941,calibration='bad-og-1672x941-v6';
 // Photo calibration: one common room height, with floor/finish/ceiling datums.
 // The AI reference is not a surveyed projective photograph. Its three datum
 // lines must all agree with the centimetre grid before extrapolating courses.
 const wallCalibration=Object.freeze({height:249,datum:120,planes:{
  left:{finish:[[498,366],[135,268]],ceiling:[[424,0],[498,80]]},
  back:{finish:[[498,366],[1168,366]],ceiling:[[498,80],[1168,80]]},
  right:{finish:[[1168,366],[1672,234]],ceiling:[[1168,80],[1247,0]]}
 }});
 const floor=[[[135,941],[498,639],[888,639],[923,641],[1008,721],[1275,721],[1275,698],[1672,941]]];
 const left120=[[0,231],[498,366],[498,639],[135,941],[0,941]];
 const leftFull=[[0,0],[424,0],[498,80],[498,639],[135,941],[0,941]];
 // The new window has a sill, so the entire wall beneath it is configurable.
 const back120=[[498,366],[888,366],[888,639],[498,639]];
 const backFull=[[498,80],[888,80],[888,639],[498,639]];
 const outerRight120=[[1275,338],[1672,234],[1672,941],[1275,698]];
 const outerRightFull=[[1275,0],[1672,0],[1672,941],[1275,698]];
 // Includes the tile visible THROUGH the left glass pane. Only its reflected
 // window and hardware are fixed, not the surrounding strip of background wall.
 const showerBack=[[888,80],[1168,80],[1168,633],[1008,633],[945,639],[888,639]];
 const showerRight=[[1168,80],[1247,0],[1275,0],[1275,697],[1168,633]];
 const backWalls={'120':[back120],full:[backFull]};
 const face=(id,surface,plane,polygons,maxV)=>({id,surface,plane,polygons,maxV});
 const faceSets={};
 for(const mode of ['120','full']){
  const full=mode==='full';
  faceSets[mode]=[
   face('floor','floor','floor',floor,300),
   face('left-wall','wall','left',[full?leftFull:left120],full?249:120),
   face('window-wall','wall','back',backWalls[mode],full?249:120),
   face('shower-back','wall','back',[showerBack],249),
   face('shower-right','wall','right',[showerRight],249),
   face('right-wall','wall','right',[full?outerRightFull:outerRight120],full?249:120)
  ];
 }
 const faces=mode=>faceSets[mode==='full'?'full':'120'];
 const walls120=faces('120').filter(f=>f.surface==='wall').flatMap(f=>f.polygons);
 const wallsFull=faces('full').filter(f=>f.surface==='wall').flatMap(f=>f.polygons);
 const fixtureOcclusions=[[[250,456],[453,456],[570,452],[572,453],[572,604],[463,670],[250,670]]];
 // Window frame, glazing and the separate stone sill are fixed components.
 // Nothing below y=373 is a fixed window strip any more.
 const windowOcclusions=[[[530,116],[888,116],[888,365],[891,365],[891,373],[523,373],[523,365],[530,365]]];
 const reflectedWindow=[[[958,100],[1006,100],[1006,367],[958,367]]];
 const floorOcclusions=[[[1350,601],[1428,599],[1450,600],[1468,605],[1485,610],[1501,615],[1518,620],[1550,630],[1578,640],[1589,647],[1585,653],[1614,661],[1616,666],[1616,680],[1615,700],[1613,720],[1610,740],[1606,760],[1602,780],[1597,800],[1594,812],[1500,814],[1450,813],[1400,805],[1380,798],[1350,784],[1330,762],[1320,743],[1311,721],[1303,701],[1296,681],[1292,671],[1289,660],[1287,639],[1287,621],[1288,614],[1291,609],[1307,604],[1330,602]]];
 const tray=[[[923,641],[1008,721],[1275,721],[1275,697],[1168,633],[1008,633],[945,639]]];
 const basin=[[[331,410],[516,411],[520,417],[516,449],[506,455],[340,455],[334,448]]];
 const tap=[[[309,365],[353,365],[353,349],[404,349],[435,374],[435,394],[365,394],[363,404],[309,403]]];
 const mirror=[[[260,5],[441,147],[441,342],[260,288]]];
 const flushplate=[[[1513,375],[1619,366],[1619,458],[1513,457]]];
 function area(points){return points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0);}
 const positive=points=>area(points)<0?points.slice().reverse():points;
 function circle(x,y,r){return Array.from({length:16},(_,i)=>[x+Math.cos(i*Math.PI/8)*r,y+Math.sin(i*Math.PI/8)*r]);}
 function stroke(points,lineWidth){const result=points.map(([x,y])=>circle(x,y,lineWidth/2));for(let i=1;i<points.length;i++){const [x,y]=points[i-1],[u,v]=points[i],length=Math.hypot(u-x,v-y);if(!length)continue;const dx=-(v-y)/length*lineWidth/2,dy=(u-x)/length*lineWidth/2;result.push(positive([[x+dx,y+dy],[u+dx,v+dy],[u-dx,v-dy],[x-dx,y-dy]]));}return result;}
 const hardware=[
  [[1004,0],[1012,0],[1012,725],[1004,725]],
  [[1070,100],[1110,56],[1138,56],[1099,102]],
  ...stroke([[1094,383],[1232,383]],9),
  ...[[1026,406,8],[1065,406,8],[1097,407,7]].map(p=>circle(...p)),
  ...stroke([[1065,414],[1058,451],[1058,480],[1064,502],[1080,509],[1095,504],[1103,490],[1101,466],[1096,429],[1097,413]],5),
  // Small glass hinges on the left fixed panel.
  [[921,193],[930,190],[930,214],[921,219]],
  [[920,577],[929,573],[929,597],[920,600]]
 ];
 const trim120=[
  [[0,229],[498,364],[498,368],[0,233]],
  [[498,363],[524,363],[524,368],[498,368]],
  [[1275,335],[1672,232],[1672,237],[1275,341]]
 ];
 // Fine hardware keeps the shading already present in the selected room plate.
 // Its generous grout exclusion must NOT copy a grey rectangular background.
 const fixedBase=[...windowOcclusions,...reflectedWindow,...floorOcclusions,...tray,...basin,...mirror].map(positive);
 const fixedMasks=mode=>mode==='full'?fixedBase:[...fixedBase,...trim120.map(positive)];
 const groutOcclusions=mode=>[...fixedMasks(mode),...fixtureOcclusions,...basin,...tap,...hardware,...mirror,...flushplate].map(positive);
 function trace(ctx,polygons){for(const raw of polygons){const points=positive(raw);ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);ctx.closePath();}}
 function layer(ctx,image,polygons,holes=[]){if(!polygons.length)return;ctx.save();ctx.beginPath();trace(ctx,polygons);ctx.clip();if(holes.length){ctx.beginPath();ctx.rect(0,0,width,height);trace(ctx,holes);ctx.clip('evenodd');}ctx.drawImage(image,0,0,width,height);ctx.restore();}
 function render(ctx,{base,floor:floorImage,wall,wallHeight,fixtures}){
  ctx.clearRect(0,0,width,height);ctx.drawImage(base,0,0,width,height);
  for(const f of faces(wallHeight))layer(ctx,f.surface==='floor'?floorImage:wall,f.polygons);
  layer(ctx,base,fixedMasks(wallHeight));
  if(fixtures)layer(ctx,fixtures,fixtureOcclusions);
 }
 return {width,height,calibration,wallCalibration,faces,floor,walls120,wallsFull,backWalls,floorOcclusions,fixtureOcclusions,windowOcclusions,reflectedWindow,fixedMasks,groutOcclusions,trace,render};
});
