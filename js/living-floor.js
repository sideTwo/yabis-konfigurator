/* One photographic floor, one fixed laying pattern. Material changes alter
   reflectance only; camera, joints, furnishings and illumination never move. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisLivingFloor=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const width=1672,height=941,calibration='wohnen-1672x941-v1';
 const base='assets/studio/wohnen-habitat-perla.webp';
 // Visible indoor floor, traced against the canonical photo. Furniture and
 // rug contours are occlusions, not regions of the material photograph.
 const floor=[
  [[0,941],[1672,941],[1672,505],[1601,481],[1601,557],[1590,562],[1573,566],[1550,567],[1526,565],[1508,560],[1499,553],[1499,441],[1496,438],[1494,460],[1489,480],[1480,495],[1469,508],[1456,520],[1434,526],[1422,521],[1400,527],[1370,534],[1348,539],[1334,540],[1325,537],[1322,534],[1318,521],[1318,482],[1313,478],[1284,474],[1284,494],[1275,501],[1255,505],[1235,508],[1215,511],[1195,513],[1185,514],[1175,513],[1165,500],[1162,480],[1088,795],[174,678],[94,716],[0,701]],
  [[955,442],[1078,445],[1104,428],[1106,434],[1126,439],[1146,442],[1163,440],[1163,480],[957,476]]
 ];
 // No second grid is painted or resampled: the existing photographic joints
 // stay at their exact source pixels, including their original perspective.
 // Linear-light reflectance ratios measured from clear tile patches in the
 // two existing pilot photographs; the canonical photo supplies all shading
 // and surface detail. This is a visual pilot, not a measured product scan.
 const reflectance=Object.freeze({'habitat-perla':[1,1,1],'bercy-terra':[.818,.568,.418]});
 const linear=Float64Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 const encoded=v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));
 const transfers=Object.fromEntries(Object.entries(reflectance).map(([id,gain])=>[id,gain.map(g=>Uint8ClampedArray.from(linear,v=>encoded(v*g)))]));
 const cache=new WeakMap();
 function trace(ctx,polygons){for(const points of polygons){ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();}}
 function canvasFor(ctx){const doc=ctx.canvas.ownerDocument||(typeof document==='object'?document:null);if(doc)return doc.createElement('canvas');if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);throw Error('Die Raumvorschau wird von diesem Browser nicht unterstützt.');}
 function prepare(ctx,image){
  if(image.width!==width||image.height!==height)throw Error('Diese Wohnansicht passt nicht zur Raumvorlage.');
  let saved=cache.get(image);if(saved)return saved;
  const c=canvasFor(ctx);c.width=width;c.height=height;const g=c.getContext('2d',{willReadFrequently:true});
  g.drawImage(image,0,0);const source=g.getImageData(0,0,width,height);
  g.clearRect(0,0,width,height);g.fillStyle='#fff';g.beginPath();trace(g,floor);g.fill();
  // A subpixel feather follows only the physical material edges.
  g.globalCompositeOperation='destination-out';g.lineWidth=1.5;g.lineJoin='round';g.strokeStyle='#fff';g.beginPath();trace(g,floor);g.stroke();
  saved={source,mask:g.getImageData(0,0,width,height).data,outputs:new Map()};cache.set(image,saved);return saved;
 }
 function render(ctx,{image,material='habitat-perla'}={}){
  if(!Object.hasOwn(reflectance,material))throw Error('Dieses Material ist noch nicht für den Wohnbereich freigegeben.');
  if(material==='habitat-perla'){ctx.drawImage(image,0,0);return;}
  const saved=prepare(ctx,image);let output=saved.outputs.get(material);
  if(!output){
   output=ctx.createImageData(width,height);output.data.set(saved.source.data);const d=output.data,s=saved.source.data,t=transfers[material];
   for(let i=0;i<d.length;i+=4){const a=saved.mask[i+3]/255;if(!a)continue;for(let c=0;c<3;c++)d[i+c]=s[i+c]+(t[c][s[i+c]]-s[i+c])*a;}
   saved.outputs.set(material,output);
  }
  ctx.putImageData(output,0,0);
 }
 return {width,height,calibration,base,floor,reflectance,render};
});
