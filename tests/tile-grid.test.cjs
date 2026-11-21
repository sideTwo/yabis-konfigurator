const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../konfigurator-neu/tile-grid.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Bodenperspektive trifft alle vier Raumanker',()=>{
  const corners=[[0,0],[300,0],[300,300],[0,300]],pixels=[[498,639],[1168,633],[1672,941],[135,941]];
  corners.forEach((p,i)=>G.project(G.planes.floor.matrix,p).forEach((n,j)=>near(n,pixels[i][j])));
});
test('Längsfugen bleiben über sämtliche Querreihen gerade',()=>{
  for(const u of [60,120,180,240]) {
    const a=G.project(G.planes.floor.matrix,[u,0]),b=G.project(G.planes.floor.matrix,[u,300]);
    for(const v of [60,120,180,240]) {
      const p=G.project(G.planes.floor.matrix,[u,v]);
      near((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),0);
    }
  }
});
test('Formatwechsel ändert die Fliesenteilung statt nur die Beschriftung',()=>{
  const count=f=>G.joints(G.planes.floor,f).length;
  assert.equal(count([60,120]),6);assert.equal(count([60,60]),8);assert.equal(count([120,120]),4);
  const rows=(f,h)=>G.joints(G.planes.back,f,h).filter(j=>j.axis==='v').map(j=>j.position);
  assert.deepEqual(rows([60,120],120),[60]);assert.deepEqual(rows([120,120],120),[]);
  assert.deepEqual(rows([60,120],240),[60,120,180]);
});
test('Wohnzimmerfugen reichen über die äußersten sichtbaren Fliesenflächen',()=>{
  const scenes=require('../js/studio-scenes.js'),living=require('../js/living-floor.js');
  const [face]=scenes.scene('wohnen',G,living).faces;
  const joints=G.joints(face.plane,[60,120]);
  const across=joints.find(joint=>joint.axis==='v'&&joint.position===60);
  assert.ok(G.project(face.plane.matrix,across.from)[0]<=0);
  assert.ok(G.project(face.plane.matrix,across.to)[0]>=1672);
});
test('Küchenrückwand reicht in einer Reihe vom Regal bis zur Arbeitsplatte',()=>{
  const [face]=require('../js/studio-scenes.js').scene('kueche',G).faces;
  near(face.maxV,60);
  const joints=G.joints(face.plane,[60,120]);
  assert.deepEqual(joints.map(({axis,position})=>[axis,position]),[['u',120],['u',240]]);
  for(const joint of joints){
    const top=G.project(face.plane.matrix,joint.from),bottom=G.project(face.plane.matrix,joint.to);
    near(top[0],bottom[0]);
  }
  assert.equal(G.joints(face.plane,[60,60]).length,4);
});
test('Wandfugen treffen sich höhengleich an den Raumecken',()=>{
  for(const height of [60,120,180,240]) {
    const backLeft=G.project(G.planes.back.matrix,[0,height]),left=G.project(G.planes.left.matrix,[0,height]);
    const backRight=G.project(G.planes.back.matrix,[300,height]),right=G.project(G.planes.right.matrix,[0,height]);
    backLeft.forEach((n,j)=>near(n,left[j]));backRight.forEach((n,j)=>near(n,right[j]));
  }
});

test('Oberster Anschnitt hat über beide Seiten dieselbe reale Höhe unter der Decke',()=>{
  const R=require('../konfigurator-neu/standbild-renderer.js'),h=R.wallCalibration.height,datum=R.wallCalibration.datum;
  for(const name of ['left','back','right']){
    const plane=G.planes[name],line=R.wallCalibration.planes[name].ceiling;
    for(const u of [0,60,120,180,240,300]){
      const ceiling=G.project(plane.matrix,[u,h]),finish=G.project(plane.matrix,[u,datum]),joint=G.project(plane.matrix,[u,240]);
      const actualCeiling=line[0][1]+(ceiling[0]-line[0][0])*(line[1][1]-line[0][1])/(line[1][0]-line[0][0]);
      near(ceiling[1],actualCeiling);near((joint[1]-ceiling[1])/(finish[1]-ceiling[1]),(h-240)/(h-datum));
    }
  }
});

test('Die visuelle Raumhöhe ergibt auf jeder Wand exakt zwei oder vier vollständige Reihen',()=>{
  const R=require('../konfigurator-neu/standbild-renderer.js');assert.equal(R.wallCalibration.height,240);
  for(const name of ['left','back','right'])for(const format of G.formats){
    const plane=G.planes[name],rows=G.joints(plane,format).filter(j=>j.axis==='v').map(j=>j.position);
    assert.equal(plane.maxV,240);assert.deepEqual(rows,format[0]===120?[120]:[60,120,180]);
    assert.ok(rows.every(h=>h<240),'Keine zusätzliche Fuge mit schmalem Deckenrest');
  }
  for(const mode of ['120','full'])for(const face of R.faces(mode).filter(f=>f.surface==='wall'))assert.equal(face.maxV,mode==='full'||face.id.startsWith('shower-')?240:120);
});

test('Boden und Wand teilen dieselben metrischen Rasterpunkte an allen drei Fußkanten',()=>{
  for(const u of [0,30,60,90,120,180,240,300])for(const [name,p]of [['back',[u,0]],['left',[0,u]],['right',[300,u]]]){
    const floor=G.project(G.planes.floor.matrix,p),wall=G.project(G.planes[name].matrix,[u,0]);floor.forEach((n,j)=>near(n,wall[j]));
  }
});

test('3-mm-Fuge bleibt relativ zur 60-cm-Reihe über jede Wandtiefe maßhaltig',()=>{
  for(const name of ['left','back','right'])for(const u of [0,120,240,300])for(const h of [60,180]){
    const m=G.planes[name].matrix,top=G.project(m,[u,h+.15]),bottom=G.project(m,[u,h-.15]),a=G.project(m,[u,h-30]),b=G.project(m,[u,h+30]);
    near(Math.abs(top[1]-bottom[1])/Math.abs(a[1]-b[1]),.3/60);
  }
});
test('Gespeicherte Formate werden geprüft und Farbauswahl bleibt definiert',()=>{
  assert.deepEqual(G.format('60,60'),[60,60]);assert.deepEqual(G.format([0,120]),[60,120]);
  assert.deepEqual(G.format(null),[60,120]);assert.equal(Object.keys(G.grouts).length,4);
  assert.notDeepEqual(G.grouts.light.rgb,G.grouts.dark.rgb);
});

const nativeCanvas=process.env.YABIS_CANVAS_PACKAGE;
test('Hellgraue Badfugen bleiben auf hellem Boden in beiden Richtungen sichtbar',{skip:!nativeCanvas},async()=>{
  const {createCanvas,loadImage}=require(nativeCanvas);
  const path=require('node:path'),R=require('../konfigurator-neu/standbild-renderer.js');
  const C=require('../js/studio-core.js'),base=await loadImage(path.join(__dirname,'..',C.bathAssets.photo));
  const doc={createElement(){const canvas=createCanvas(1,1);canvas.ownerDocument=doc;return canvas;}};
  const canvas=doc.createElement();canvas.width=R.width;canvas.height=R.height;
  const ctx=canvas.getContext('2d'),tile=220;
  const state={wallHeight:'120',floorFormat:[60,120],wallFormat:[60,120],wallGrout:'dark'};
  const pixel=(x,y)=>ctx.getImageData(x,y,1,1).data[0];
  const draw=floorGrout=>{
    ctx.fillStyle=`rgb(${tile},${tile},${tile})`;ctx.fillRect(0,0,canvas.width,canvas.height);
    G.draw(ctx,{...state,floorGrout},R,base,true);
    assert.equal(pixel(1016,704),tile,'Die Duschwanne bleibt ausgespart');
    return [
      Math.min(pixel(759,667),pixel(760,667),pixel(761,667)),
      Math.min(pixel(750,762),pixel(751,762),pixel(752,762)),
      Math.min(pixel(857,704),pixel(857,705),pixel(857,706))
    ];
  };
  const light=draw('light'),dark=draw('dark');
  assert.ok(light.every(value=>tile-value>24),light.join(', '));
  assert.ok(dark.every((value,i)=>light[i]-value>45),dark.join(', '));
});
