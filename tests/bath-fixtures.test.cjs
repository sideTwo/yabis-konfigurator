const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../konfigurator-neu/standbild-renderer.js');
test('Geschlossener Waschtisch bleibt über allen Boden- und Wandvarianten identisch',()=>{
 for(const wallHeight of ['120','full'])for(const floor of ['habitat-perla','bercy-terra'])for(const wall of ['habitat-perla','bercy-terra']){
  const images=[],clips=[],points=[];
  const ctx={clearRect(){},save(){},restore(){},beginPath(){},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},closePath(){},clip(){clips.push(points.splice(0));},rect(){},drawImage(image){images.push(image);}};
  R.render(ctx,{base:'base',floor,wall,wallHeight,fixtures:'closed-vanity'});
  assert.equal(images[0],'base');assert.equal(images.at(-1),'closed-vanity');assert.equal(images.filter(x=>x==='closed-vanity').length,1);
  assert.deepEqual(clips.at(-1),R.fixtureOcclusions[0]);
 }
});
test('Frühere Renderer-Aufrufe ohne separate Möbel bleiben kompatibel',()=>{
 const images=[],ctx={clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},rect(){},drawImage(image){images.push(image);}};
 R.render(ctx,{base:'base',floor:'floor',wall:'wall',wallHeight:'120'});assert.equal(images.at(-1),'floor');assert.ok(!images.includes(undefined));
});
