const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../konfigurator-neu/standbild-renderer.js');
function inside([x,y],polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)result=!result;}return result;}
const covered=(point,polygons)=>polygons.some(p=>inside(point,p));
test('Beide Fensterkanten wechseln bei 1,20 m und raumhoher Fliese mit der Wand',()=>{
 for(const height of ['120','full']){
  const walls=height==='120'?R.walls120:R.wallsFull;
 for(const point of [[528,500],[708,500],[881,500],[881,620]]){assert.equal(covered(point,walls),true,height+' Wand '+point);assert.equal(covered(point,R.backWalls[height]),true,height+' Fugen '+point);}
 }
 assert.equal(covered([520,250],R.walls120),false,'Oberhalb 1,20 m bleibt die Wand neben dem Fenster weiß');
 assert.equal(covered([520,250],R.wallsFull),true);
 assert.equal(covered([930,250],R.walls120),true,'In der Dusche bleibt die Wand raumhoch gefliest');
});
test('Fensterrahmen und Glas stammen aus der Basis, ohne die konfigurierbaren Laibungen zu sperren',()=>{
 assert.equal(covered([715,200],R.windowOcclusions),true);assert.equal(covered([800,250],R.windowOcclusions),true);
 for(const point of [[708,500],[881,500],[528,250]])assert.equal(covered(point,R.windowOcclusions),false);
 for(const wallHeight of ['120','full']){
  const calls=[],ctx={current:[],clearRect(){},save(){},restore(){},beginPath(){this.current=[];},moveTo(x,y){this.current.push([x,y]);},lineTo(x,y){this.current.push([x,y]);},closePath(){},clip(){},rect(){},drawImage(image){calls.push({image,clip:[...this.current]});}};
  R.render(ctx,{base:'fixed-window',wall:'selected-wall',floor:'selected-floor',wallHeight});
  const window=calls.find(call=>call.image==='fixed-window'&&R.windowOcclusions[0].every(point=>call.clip.some(p=>p[0]===point[0]&&p[1]===point[1])));assert.ok(window,'Fenster wird aus der Basis restauriert');
  assert.ok(calls.some(call=>call.image==='selected-floor'));assert.equal(calls.at(-1).image,'fixed-window');
 }
});
