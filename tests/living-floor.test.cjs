const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const W=require('../js/living-floor.js');
test('Wohnbereich: echte Bildpixel behalten Fugen, Möbel und Schatten bei beiden Materialien',{skip:!process.env.YABIS_CANVAS_PACKAGE},async()=>{
 const {createCanvas,loadImage}=require(process.env.YABIS_CANVAS_PACKAGE);
 const image=await loadImage(path.join(__dirname,'..',W.base));
 const doc={createElement(){const c=createCanvas(1672,941);c.ownerDocument=doc;return c;}},c=doc.createElement(),g=c.getContext('2d');
 const snapshot=material=>{W.render(g,{image,material});return g.getImageData(0,0,1672,941).data;};
 const perla=snapshot('habitat-perla'),terra=snapshot('bercy-terra');
 const fixedBoxes=[[0,0,1672,410],[10,430,430,170],[200,650,120,20],[450,520,350,80],[600,650,400,50],[1030,750,35,20],[1130,535,8,15],[1190,440,80,40],[1360,450,75,60],[1520,450,60,95]];
 let protectedPixels=0;
 for(const [x,y,w,h]of fixedBoxes)for(let v=y;v<y+h;v++)for(let u=x;u<x+w;u++){
  const i=(v*1672+u)*4;for(let k=0;k<4;k++)assert.equal(terra[i+k],perla[i+k],`Festes Objekt ${u},${v}`);protectedPixels++;
 }
 assert.ok(protectedPixels>800000);
 const floor=[[250,870],[500,825],[950,860],[1440,750],[1560,875],[1180,785],[1200,610],[960,453]];
 const linear=v=>(v/255<=.04045?v/255/12.92:((v/255+.055)/1.055)**2.4);
 for(const [x,y]of floor){const i=(y*1672+x)*4;assert.ok(terra[i+2]<perla[i+2]-20,`Boden muss wechseln ${x},${y}`);assert.ok(Math.abs(linear(terra[i])/linear(perla[i])-.818)<.015,`Beleuchtung erhalten ${x},${y}`);}
 // Scan the three clearly visible lengthwise joints in the foreground.
 // Their intensity minimum must remain on the same photographic pixel.
 function minimum(data,x,y,axis){let min=Infinity,index=-1;for(let p=-8;p<=8;p++){let value=0;for(let t=-2;t<=2;t++){const u=axis==='x'?x+p:x+t,v=axis==='x'?y+t:y+p;value+=data[(v*1672+u)*4];}if(value<min){min=value;index=p;}}return index;}
 for(const point of [[287,850,'x'],[783,850,'x'],[1318,850,'x'],[600,835,'y']]){
  const a=minimum(perla,...point),b=minimum(terra,...point);assert.ok(Math.abs(a-b)<=1,`Fuge bewegt sich ${point}: ${a}/${b}`);
 }
 assert.deepEqual(snapshot('habitat-perla'),perla,'Materialwechsel hin und zurück muss identisch sein');
 assert.deepEqual(snapshot('bercy-terra'),terra,'Auch der Cache muss dieselben Pixel liefern');
 assert.throws(()=>W.render(g,{image,material:'nicht-freigegeben'}),/nicht.*freigegeben/);
});
