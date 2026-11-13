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
  assert.deepEqual(rows([60,120],249),[60,120,180,240]);
});
test('Wandfugen treffen sich höhengleich an den Raumecken',()=>{
  for(const height of [60,120,180,240]) {
    const backLeft=G.project(G.planes.back.matrix,[0,height]),left=G.project(G.planes.left.matrix,[0,height]);
    const backRight=G.project(G.planes.back.matrix,[300,height]),right=G.project(G.planes.right.matrix,[0,height]);
    backLeft.forEach((n,j)=>near(n,left[j]));backRight.forEach((n,j)=>near(n,right[j]));
  }
});
test('Gespeicherte Formate werden geprüft und Farbauswahl bleibt definiert',()=>{
  assert.deepEqual(G.format('60,60'),[60,60]);assert.deepEqual(G.format([0,120]),[60,120]);
  assert.deepEqual(G.format(null),[60,120]);assert.equal(Object.keys(G.grouts).length,4);
  assert.notDeepEqual(G.grouts.light.rgb,G.grouts.dark.rgb);
});
