const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../konfigurator-neu/standbild-renderer.js');
function inside([x,y],polygon){let found=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])found=!found;}return found;}
const contains=(point,polygons)=>polygons.some(p=>inside(point,p));

test('Raumhohe Duschverfliesung endet bei halbhoher Wand genau an der äußeren Glaskante',()=>{
 const walls=mode=>R.faces(mode).filter(f=>f.surface==='wall').flatMap(f=>f.polygons);
 for(const p of [[900,200],[920,300],[924,250]]){assert.equal(contains(p,walls('120')),false);assert.equal(contains(p,walls('full')),true);}
 for(const p of [[930,250],[950,500],[900,500]])assert.equal(contains(p,walls('120')),true);
 assert.equal(R.showerGlassEdge,925);
});
test('Glasnahe Wandstreifen sind in beiden Höhen echte Material- und Fugenflächen',()=>{
 for(const mode of ['120','full'])for(const point of [[950,250],[950,500],[952,620]]){
  assert.ok(contains(point,R.faces(mode).filter(f=>f.surface==='wall').flatMap(f=>f.polygons)));
  assert.equal(contains(point,R.fixedMasks(mode)),false);assert.equal(contains(point,R.groutOcclusions(mode)),false);
 }
});
test('Wand unter dem OG-Fenster ist durchgehend; Boden und rechte Wand schließen bündig',()=>{
 const floor=R.floor[0];
 for(const mode of ['120','full'])for(const point of [[600,500],[750,500],[875,620],[985,500]]){assert.ok(contains(point,R.faces(mode).filter(f=>f.surface==='wall').flatMap(f=>f.polygons)));assert.equal(contains(point,R.fixedMasks(mode)),false);}
 assert.ok(R.windowOcclusions.flat().every(p=>p[1]<=373));
 for(const mode of ['120','full']){const right=R.faces(mode).find(f=>f.id==='right-wall').polygons[0];for(const point of [[1275,698],[1672,941]]){assert.ok(floor.some(p=>p[0]===point[0]&&p[1]===point[1]));assert.ok(right.some(p=>p[0]===point[0]&&p[1]===point[1]));}}
});
test('Glas und Keramik sind geschützt; fliesenfarbene Drückerplatte bleibt materialabhängig',()=>{
 for(const mode of ['120','full']){
  for(const point of [[985,300],[1450,700],[1100,680],[350,550]])assert.ok(contains(point,R.groutOcclusions(mode)));
  assert.equal(contains([1570,410],R.fixedMasks(mode)),false);assert.ok(contains([1570,410],R.groutOcclusions(mode)));
 }
});
