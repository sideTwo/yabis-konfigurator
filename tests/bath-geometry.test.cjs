const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../konfigurator-neu/standbild-renderer.js');
function inside([x,y],polygon){let found=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])found=!found;}return found;}
const contains=(point,polygons)=>polygons.some(p=>inside(point,p));
test('Glasnahe Wandstreifen sind in beiden Höhen echte Material- und Fugenflächen',()=>{
 for(const mode of ['120','full'])for(const point of [[950,250],[950,500],[952,620]]){
  assert.ok(contains(point,R.faces(mode).filter(f=>f.surface==='wall').flatMap(f=>f.polygons)));
  assert.equal(contains(point,R.fixedMasks(mode)),false);assert.equal(contains(point,R.groutOcclusions(mode)),false);
 }
});
test('Fensterschwelle, Boden und rechte Wand teilen exakt dieselben Eckpunkte',()=>{
 const floor=R.floor[0],window=R.windowOcclusions[0];
 for(const point of [[709,639],[875,637]]){assert.ok(floor.some(p=>p[0]===point[0]&&p[1]===point[1]));assert.ok(window.some(p=>p[0]===point[0]&&p[1]===point[1]));}
 for(const mode of ['120','full']){const right=R.faces(mode).find(f=>f.id==='right-wall').polygons[0];for(const point of [[1275,698],[1672,941]]){assert.ok(floor.some(p=>p[0]===point[0]&&p[1]===point[1]));assert.ok(right.some(p=>p[0]===point[0]&&p[1]===point[1]));}}
});
test('Glas und Keramik sind geschützt; fliesenfarbene Drückerplatte bleibt materialabhängig',()=>{
 for(const mode of ['120','full']){
  for(const point of [[985,300],[1450,700],[1100,680],[350,550]])assert.ok(contains(point,R.groutOcclusions(mode)));
  assert.equal(contains([1570,410],R.fixedMasks(mode)),false);assert.ok(contains([1570,410],R.groutOcclusions(mode)));
 }
});
