/* Render a product swatch in the calibrated plane of a fixed room image. */
((root,factory)=>{
 const api=factory(typeof module==='object'&&module.exports?require('./studio-scenes.js'):root.YabisStudioScenes);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.YabisStudioTextures=api;
})(typeof window==='object'?window:this,scenes=>{
 'use strict';
 const geometryCache=new WeakMap(), swatchCache=new WeakMap();
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 const mod=(v,n)=>((v%n)+n)%n;
 const luminance=(r,g,b)=>r*.2126+g*.7152+b*.0722;
 // How much of the broad tonal variation in a single swatch belongs to the
 // design. Small-scale texture remains intact even on the quietest products.
 const contrast={
  'wonder-base':.33,'luna-offwhite':.18,'concept-white':.22,
  nepal:.90,'origin-beige':.60,'habitat-marfil':.43,'capitol-hueso':.55,
  'cesar-pul-beige':.70,'flavio-oxido':.88,
  'fiordi-bosco-sand':.78,'fiordi-bosco-sand-2':.78,'marshall-desert':.55
 };
 const plankFormats={'rijn-visgraat':[15,75],'donau-visgraat':[15,75],'ganges-visgraat':[15.8,76]};
 const neutralPhotoTint=[5,0,-8];

 function canvasFor(ctx,w,h){
  const canvas=(ctx.canvas.ownerDocument||document).createElement('canvas');
  canvas.width=w;
  canvas.height=h;
  return canvas;
 }
 function path(ctx,polygons){
  ctx.beginPath();
  for(const points of polygons){
   ctx.moveTo(...points[0]);
   for(const point of points.slice(1))ctx.lineTo(...point);
   ctx.closePath();
  }
 }
 function inverseWall(plane){
  const [a,b,c,d,e,f,g,h,i]=plane.floor;
  const back=plane.axis==='back',side=plane.side;
  const xA=back?a:b,xB=back?c:a*side+c,zA=back?g:h,zB=back?i:g*side+i;
  const yA=back?d:e,yB=back?f:d*side+f;
  const line=(edge,x)=>edge[0][1]+(x-edge[0][0])*(edge[1][1]-edge[0][1])/(edge[1][0]-edge[0][0]);
  return (x,y)=>{
   const u=(xB-x*zB)/(x*zA-xA),floorY=(yA*u+yB)/(zA*u+zB);
   const finish=line(plane.finish,x),ceiling=line(plane.ceiling,x);
   return [u,y>=finish?(y-floorY)*plane.datum/(finish-floorY):
    plane.datum+(y-finish)*(plane.height-plane.datum)/(ceiling-finish)];
  };
 }
 function mapper(room,face,grid){
  if(room==='bad'){
   const plane=grid.planes[face.plane];
   if(plane.matrix.kind==='wall')return inverseWall(plane.matrix);
   const field=[[0,0],[300,0],[300,300],[0,300]];
   const inverse=grid.homography(field.map(p=>grid.project(plane.matrix,p)),field);
   return (x,y)=>grid.project(inverse,[x,y]);
  }
  return (x,y)=>grid.project(face.inverse,[x,y]);
 }
 function geometry(ctx,base,room,mode,geometryApis,photoLighting,scene){
  const {bath,grid,living}=geometryApis,{width,height}=ctx.canvas;
  let cache=geometryCache.get(base);
  if(!cache){cache=new Map();geometryCache.set(base,cache);}
  const key=room+'-'+mode+'-'+photoLighting;
  if(cache.has(key))return cache.get(key);
  const plan=scene||scenes.scene(room,grid,living);
  const faces=room==='bad'?bath.faces(mode):plan.faces;
  const holes=room==='bad'?bath.materialOcclusions(mode,false,photoLighting):plan.holes;
  const foreground=plan?.matte?.(ctx,base);
  const scratch=canvasFor(ctx,width,height),mask=scratch.getContext('2d',{willReadFrequently:true});
  const coverage=new Uint8Array(width*height),u=new Float32Array(width*height),v=new Float32Array(width*height);
  const faceIds=new Uint8Array(width*height);
  for(const [index,face] of faces.entries()){
   mask.clearRect(0,0,width,height);
   mask.fillStyle='#fff';
   path(mask,face.polygons);
   mask.fill();
   mask.globalCompositeOperation='destination-out';
   path(mask,holes);
   mask.fill();
   if(foreground)mask.drawImage(foreground,0,0);
   mask.globalCompositeOperation='source-over';
   const alpha=mask.getImageData(0,0,width,height).data;
   const locate=mapper(room,face,grid);
   for(let y=0,p=0;y<height;y++)for(let x=0;x<width;x++,p++){
    const amount=alpha[p*4+3];
    if(!amount||amount<coverage[p])continue;
    const uv=locate(x+.5,y+.5);
    if(!Number.isFinite(uv[0]+uv[1]))continue;
    coverage[p]=amount;
    u[p]=uv[0];
    v[p]=uv[1];
    faceIds[p]=index+1;
   }
  }
  let plate=null;
  if(room==='bad'&&!photoLighting&&bath.flushplate){
   mask.clearRect(0,0,width,height);
   path(mask,bath.flushplate);mask.fill();
   const pixels=mask.getImageData(0,0,width,height).data;
   plate=Uint8Array.from(coverage,(_,i)=>pixels[4*i+3]);
  }
  mask.clearRect(0,0,width,height);mask.drawImage(base,0,0,width,height);
  const pixels=mask.getImageData(0,0,width,height).data;
  const light=photoLighting?photoSurfaceLight(pixels,faceIds,faces,room==='bad'?bath.wallCalibration:null,width,height,mode):
   surfaceLight(pixels,faceIds,width,height,faces.length);
  const result={coverage,u,v,faceIds,faces,light,plate,slabs:plan?.slabs===true};
  cache.set(key,result);
  if(cache.size>1)cache.delete(cache.keys().next().value);
  return result;
 }
 function photoSurfaceLight(pixels,faceIds,faces,calibration,width,height,mode){
  // The neutral plate has no tiles or grout baked into it. Its local contrast
  // is the room light: preserve contact shadows, daylight and glass highlights.
  const light=new Float32Array(width*height);
  const tone=p=>luminance(pixels[4*p],pixels[4*p+1],pixels[4*p+2]);
  for(let y=0,p=0;y<height;y++)for(let x=0;x<width;x++,p++){
   const face=faces[faceIds[p]-1];
   if(!face)continue;
   light[p]=tone(p);
   if(!calibration||mode!=='full'||face.surface!=='wall'||face.id.startsWith('shower-'))continue;
   const [[x0,y0],[x1,y1]]=calibration.planes[face.plane].finish;
   const finish=Math.round(y0+(x-x0)*(y1-y0)/(x1-x0)),distance=y-finish;
   // Replace the old wainscot profile when tiles continue up to the ceiling.
   // Match the white paint to the neutral mineral undercoat before shading it.
   const paintOffset=26;
   if(distance<-11)light[p]-=paintOffset;
   else if(distance<=11){
    const above=(finish-12)*width+x,below=(finish+12)*width+x;
    const upper=faceIds[above]===faceIds[p]?tone(above)-paintOffset:tone(p)-paintOffset;
    const lower=faceIds[below]===faceIds[p]?tone(below):upper;
    light[p]=upper+(lower-upper)*(distance+12)/24;
   }
  }
  return light;
 }
 function surfaceLight(pixels,faceIds,width,height,faceCount){
  // Measure the reference through each material mask. Wide, overlapping
  // averages preserve the light direction while suppressing old tile edges.
  const step=8,columns=Math.ceil(width/step),rows=Math.ceil(height/step);
  const bins=Array.from({length:faceCount},()=>new Float64Array(columns*rows));
  const weights=bins.map(bin=>new Uint16Array(bin.length));
  for(let y=0,p=0;y<height;y++)for(let x=0;x<width;x++,p++){
   const face=faceIds[p]-1;
   if(face<0)continue;
   const i=p*4,k=Math.floor(y/step)*columns+Math.floor(x/step);
   bins[face][k]+=luminance(pixels[i],pixels[i+1],pixels[i+2]);
   weights[face][k]++;
  }
  const fields=bins.map((bin,face)=>{
   const weight=weights[face],stride=columns+1;
   const sums=new Float64Array(stride*(rows+1)),counts=new Uint32Array(sums.length);
   const radius=14;
   for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const k=y*columns+x,j=(y+1)*stride+x+1;
    sums[j]=bin[k]+sums[j-1]+sums[j-stride]-sums[j-stride-1];
    counts[j]=weight[k]+counts[j-1]+counts[j-stride]-counts[j-stride-1];
   }
   const avg=(x,y)=>{
    const left=Math.max(0,x-radius),top=Math.max(0,y-radius);
    const right=Math.min(columns,x+radius+1),bottom=Math.min(rows,y+radius+1);
    const a=top*stride+left,b=top*stride+right,c=bottom*stride+left,d=bottom*stride+right;
    const n=counts[d]-counts[b]-counts[c]+counts[a];
    return n?(sums[d]-sums[b]-sums[c]+sums[a])/n:190;
   };
   return Float32Array.from(bin,(_,i)=>avg(i%columns,Math.floor(i/columns)));
  });
  const result=new Float32Array(width*height);
  for(let y=0,p=0;y<height;y++){
   const row=Math.floor(y/step),nextRow=Math.min(row+1,rows-1),fy=y/step-row;
   for(let x=0;x<width;x++,p++){
    if(!faceIds[p])continue;
    const field=fields[faceIds[p]-1],col=Math.floor(x/step),nextCol=Math.min(col+1,columns-1),fx=x/step-col;
    const top=field[row*columns+col]*(1-fx)+field[row*columns+nextCol]*fx;
    const bottom=field[nextRow*columns+col]*(1-fx)+field[nextRow*columns+nextCol]*fx;
    result[p]=top+(bottom-top)*fy;
   }
  }
  return result;
 }
 function swatch(ctx,image){
  if(!swatchCache.has(image)){
   const width=Math.min(720,image.width),height=Math.round(image.height*width/image.width);
   const c=canvasFor(ctx,width,height),g=c.getContext('2d',{willReadFrequently:true});
   g.drawImage(image,0,0,width,height);
   const bitmap=g.getImageData(0,0,width,height);
   const small=canvasFor(ctx,Math.max(2,Math.round(width/64)),Math.max(2,Math.round(height/64)));
   small.getContext('2d').drawImage(c,0,0,small.width,small.height);
   g.clearRect(0,0,width,height);g.drawImage(small,0,0,width,height);
   const blurred=g.getImageData(0,0,width,height).data,low=new Float32Array(width*height);
   let total=0;
   for(let p=0,i=0;p<low.length;p++,i+=4){
    low[p]=luminance(blurred[i],blurred[i+1],blurred[i+2]);
    total+=low[p];
   }
   const mean=total/low.length;
   for(let p=0;p<low.length;p++)low[p]-=mean;
   swatchCache.set(image,{bitmap,low,mean});
  }
  return swatchCache.get(image);
 }
 function patch(art,x,y){
  const key=x*65536+y;
  let p=art.patches.get(key);
  if(!p){
   // Repeatable placements use different crops and orientations of the same sample.
   let h=Math.imul(x,1597334677)^Math.imul(y,3812015801)^Math.imul(art.seed+1,2246822519);
   h=Math.imul(h^(h>>>16),2146121005);
   h=Math.imul(h^(h>>>15),2221713035);
   h=(h^(h>>>16))>>>0;
   const scale=.76+((h>>>2)&63)*.0025;
   p={scale,x:((h>>>8)&255)*(1-scale)/255,y:((h>>>16)&255)*(1-scale)/255,
    rotate:!art.continuous&&Boolean(h&1),turn:h&3,farX:(h>>3)&1,farY:(h>>4)&1};
   art.patches.set(key,p);
  }
  return p;
 }
 function sampleIndex(bitmap,x,y){
  return 4*(clamp(Math.floor(y*bitmap.height),0,bitmap.height-1)*bitmap.width+
   clamp(Math.floor(x*bitmap.width),0,bitmap.width-1));
 }
 function samplePatch(art,px,py,s,t){
  const p=patch(art,px,py);
  if(art.sampleSize){
   // Rectangular tiles use matching portions of the 120 cm reference face.
   // Turning a square reference changes the vein direction without stretching it.
   const width=art.continuous?1:art.format[1]/art.sampleSize;
   const height=art.continuous?1:art.format[0]/art.sampleSize;
   const x=s*width+(1-width)*p.farX,y=t*height+(1-height)*p.farY;
   switch(p.turn){
    case 1:return sampleIndex(art.bitmap,y,1-x);
    case 2:return sampleIndex(art.bitmap,1-x,1-y);
    case 3:return sampleIndex(art.bitmap,1-y,x);
    default:return sampleIndex(art.bitmap,x,y);
   }
  }
  const u=p.x+(p.rotate?1-s:s)*p.scale,v=p.y+(p.rotate?1-t:t)*p.scale;
  const x=art.portrait?v:u,y=art.portrait?1-u:v;
  return sampleIndex(art.bitmap,x,y);
 }
 function sampleTile(art,u,v,longAcross){
  const [short,long]=art.format,s=(longAcross?u:v)/long,t=(longAcross?v:u)/short;
  const x=Math.floor(s),y=Math.floor(t);
  return samplePatch(art,x,y,s-x,t-y);
 }
 function sampleSlab(art,u,v,face){
  const {bitmap}=art,{maxU,maxV}=face.plane;
  const orientation=patch(art,face.variant,0);
  const span=Math.min(1,maxV/maxU*bitmap.width/bitmap.height);
  const across=clamp(u/maxU,0,1),depth=clamp(v/maxV,0,1);
  return sampleIndex(bitmap,orientation.rotate?1-across:across,
   (orientation.farY?1-span:0)+span*(orientation.rotate?1-depth:depth));
 }
 const overlap=.16;
 const patchUV=x=>(x+overlap)/(1+2*overlap);
 function edgeWeight(x){
  const t=Math.max(0,1-Math.min(x,1-x)/overlap);
  return .5*t*t*(3-2*t);
 }
 function sampleContinuous(art,u,v,longAcross,rgb){
  // Large overlapping patches are in room coordinates, so joints do not reset the artwork.
  const [short,long]=art.format,step=art.sampleSize?art.sampleSize/(1+2*overlap):0;
  const s=(longAcross?u:v)/(step||long*1.8),t=(longAcross?v:u)/(step||short*1.8);
  const x=Math.floor(s),y=Math.floor(t),a=s-x,b=t-y;
  const wx=edgeWeight(a),wy=edgeWeight(b),dx=a<.5?-1:1,dy=b<.5?-1:1;
  const here=samplePatch(art,x,y,patchUV(a),patchUV(b));
  const across=wx?samplePatch(art,x+dx,y,patchUV(a-dx),patchUV(b)):here;
  const above=wy?samplePatch(art,x,y+dy,patchUV(a),patchUV(b-dy)):here;
  const diagonal=wx&&wy?samplePatch(art,x+dx,y+dy,patchUV(a-dx),patchUV(b-dy)):above;
  for(let c=0;c<3;c++){
   const center=materialChannel(art,here,c),upper=materialChannel(art,above,c);
   const row=center+(materialChannel(art,across,c)-center)*wx;
   const adjacent=upper+(materialChannel(art,diagonal,c)-upper)*wx;
   rgb[c]=row+(adjacent-row)*wy;
  }
 }
 function materialChannel(art,pos,channel){
  return art.bitmap.data[pos+channel]-art.low[pos>>2]*art.balance;
 }
 function groutAlpha(art,u,v,p,longAcross,width,coverage){
  const [short,long]=art.format,x=mod(u[p],longAcross?long:short),y=mod(v[p],longAcross?short:long);
  const uDistance=Math.min(x,(longAcross?long:short)-x),vDistance=Math.min(y,(longAcross?short:long)-y);
  const nextX=p%width<width-1&&coverage[p+1]?p+1:p;
  const nextY=coverage[p+width]?p+width:p;
  const aaU=Math.max(.16,(Math.abs(u[nextX]-u[p])+Math.abs(u[nextY]-u[p]))*.5);
  const aaV=Math.max(.16,(Math.abs(v[nextX]-v[p])+Math.abs(v[nextY]-v[p]))*.5);
  return .76*Math.max(clamp((.14+aaU-uDistance)/(2*aaU),0,1),clamp((.14+aaV-vDistance)/(2*aaV),0,1));
 }
 function plankAt(x,y,width,length,plank){
  // One perpendicular pair repeats along (width,width) and (length,-length).
  // This also fits planks whose length is not an integer multiple of the width.
  let band=Math.floor((x-y+width)/(2*length));
  let index=Math.floor((y+band*length)/width);
  let along=x-band*length-index*width;
  let across=y+band*length-index*width;
  const horizontal=along>=0&&along<length;
  if(!horizontal){
   band=Math.floor((x-y)/(2*length));
   index=Math.floor((x-(band+1)*length)/width);
   across=x-(band+1)*length-index*width;
   along=index*width+width-band*length-y;
  }
  plank.s=clamp(along/length,0,1);plank.t=clamp(across/width,0,1);
  plank.edge=Math.min(along,length-along,across,width-across);
  plank.band=band;plank.index=index;plank.horizontal=horizontal;
  return plank;
 }
 function sampleVinyl(art,u,v,plank){
  const [width,length]=art.format;
  plankAt((u+v)*Math.SQRT1_2,(v-u)*Math.SQRT1_2,width,length,plank);
  return samplePatch(art,plank.band*2+Number(plank.horizontal),plank.index,plank.s,plank.t);
 }
 function render(ctx,{room,base,selection,assets,geometryApis,photoLighting=false,scene}){
  const {width,height}=ctx.canvas;
  ctx.drawImage(base,0,0,width,height);
  const {coverage,u,v,faceIds,faces,light,plate,slabs}=geometry(ctx,base,room,selection.wallHeight,geometryApis,photoLighting,scene);
  const imageData=ctx.getImageData(0,0,width,height),out=imageData.data;
  const art=Object.fromEntries(Object.entries(assets).map(([surface,asset])=>{
   const {bitmap,low,mean}=swatch(ctx,asset.image),format=plankFormats[asset.id]||selection[surface+'Format'];
   return [surface,{...asset,bitmap,low,mean,format,patches:new Map(),
    balance:asset.vinyl ? .18 : 1-(contrast[asset.id]??.85),
    grout:mean+(mean>185?-16:18),
    portrait:bitmap.height>bitmap.width&&format[1]>format[0],
    seed:selection[surface+'GrainSeed']||0,continuous:!asset.vinyl&&selection[surface+'Grain']==='continuous'}];
  }));
  const rgbSample=[0,0,0],plank={};
  for(let p=0;p<coverage.length;p++){
   if(!coverage[p])continue;
   const i=p*4,a=coverage[p]/255,face=faces[faceIds[p]-1],wall=face.surface==='wall',tile=wall?art.wall:art.floor;
   const longAcross=slabs||wall||face.plane?.longAcross;
   const tone=light[p];
   const shade=photoLighting?clamp(tone/184,.25,1.4):clamp(1+(tone-(room==='wohnen'?176:190))*.0038,.65,1.12);
   const glare=tile.gloss*clamp((tone-(photoLighting?188:182))/52,0,1);
   const photoTone=photoLighting?luminance(out[i],out[i+1],out[i+2]):0;
   // Reproduce shallow edges and button joints from the photographic relief.
   const relief=!photoLighting&&plate?.[p]?1+plate[p]/255*(clamp(.985+(luminance(out[i],out[i+1],out[i+2])-tone)*.010,.43,1.14)-1):1;
   let pos=0;
   if(tile.continuous)sampleContinuous(tile,u[p],v[p]+(face.progress||0),longAcross,rgbSample);
   else if(slabs)pos=sampleSlab(tile,u[p],v[p],face);
   else pos=tile.vinyl?sampleVinyl(tile,u[p],v[p],plank):sampleTile(tile,u[p],v[p],longAcross);
   const lappato=tile.finish==='Lappato'&&tile.sampleSize;
   const decorTone=lappato?(tile.continuous?luminance(...rgbSample):
    luminance(tile.bitmap.data[pos],tile.bitmap.data[pos+1],tile.bitmap.data[pos+2])):0;
   const localGlare=lappato?glare*clamp(.55+(decorTone-tile.mean)*.022,.28,1.2):glare;
   const joint=room!=='bad'&&!photoLighting&&!tile.vinyl&&!slabs?groutAlpha(tile,u,v,p,longAcross,width,coverage):0;
   const vinylSeam=tile.vinyl ? .09*clamp(1-plank.edge/.16,0,1) : 0;
   for(let c=0;c<3;c++){
    const material=tile.continuous?rgbSample[c]:materialChannel(tile,pos,c);
    const rgb=(material+(tile.grout-material)*joint)*(1-vinylSeam);
    const lit=shade<1||lappato?rgb*shade:rgb+(255-rgb)*(shade-1)*(photoLighting?1.55:2.7);
    const reflectedColor=photoLighting?clamp(out[i+c]-photoTone-neutralPhotoTint[c],-14,14)*lit*.0028:0;
    const finished=clamp((lit+reflectedColor+(255-lit)*localGlare)*relief,0,255);
    out[i+c]+=a*(finished-out[i+c]);
   }
  }
  ctx.putImageData(imageData,0,0);
 }
 return {render,inverseWall,plankAt};
});
