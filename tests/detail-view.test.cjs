const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function app({width=1600,height=900,unsupported=false}={}){
 const elements=new Map(),draws=[],events={};
 class Element{
  constructor(){this.events={};this.style={};this.attributes={};this.width=1672;this.height=941;this.clientWidth=width;this.clientHeight=height;this.scrollLeft=0;this.scrollTop=0;}
  addEventListener(type,fn){this.events[type]=fn;}fire(type){this.events[type]?.();}click(){this.fire('click');}
  showModal(){this.open=true;}close(){this.open=false;this.fire('close');}focus(){this.focused=true;}
  setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}
  getContext(){return {drawImage(...args){draws.push(args);}};}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 get('room-preview').setAttribute('aria-label','Wohnen · Bercy Terra · aktuelle Auswahl');
 if(unsupported)get('detail-view').showModal=undefined;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../studio/detail-view.js'),'utf8'),{document:{getElementById:get},window:{addEventListener(type,fn){events[type]=fn;}}});
 return {get,draws,resize(w,h){get('detail-viewport').clientWidth=w;get('detail-viewport').clientHeight=h;events.resize();}};
}
test('Große Ansicht zeigt exakt den aktuellen Canvas, erhält Seitenverhältnis und gibt beim Schließen den Fokus zurück',()=>{
 const a=app();a.get('enlarge-view').click();assert.equal(a.get('detail-view').open,true);assert.equal(a.draws[0][0],a.get('room-preview'));
 assert.match(a.get('detail-canvas').attributes['aria-label'],/Bercy Terra/);
 const w=parseFloat(a.get('detail-canvas').style.width),h=parseFloat(a.get('detail-canvas').style.height);
 assert.ok(w<=1568&&h<=868);assert.ok(Math.abs(w/h-1672/941)<.003);
 a.get('detail-close').click();assert.equal(a.get('detail-view').open,false);assert.equal(a.get('detail-canvas').width,0);assert.equal(a.get('enlarge-view').focused,true);
});
test('Detailzoom bleibt begrenzt und passt sich beim Wechsel zur Handyansicht an',()=>{
 const a=app();a.get('enlarge-view').click();const normal=parseFloat(a.get('detail-canvas').style.width);
 for(let n=0;n<8;n++)a.get('detail-more').click();assert.equal(a.get('detail-zoom').textContent,'300 %');assert.equal(a.get('detail-more').disabled,true);assert.ok(Math.abs(parseFloat(a.get('detail-canvas').style.width)/normal-3)<.01);
 for(let n=0;n<8;n++)a.get('detail-less').click();assert.equal(a.get('detail-zoom').textContent,'100 %');assert.equal(a.get('detail-less').disabled,true);
 a.resize(390,650);assert.ok(parseFloat(a.get('detail-canvas').style.width)<=358);assert.ok(parseFloat(a.get('detail-canvas').style.height)<=618);
 a.get('detail-close').click();a.get('enlarge-view').click();assert.equal(a.get('detail-zoom').textContent,'100 %');
});
test('Unfertige Bilder öffnen keine Detailansicht; fehlende Dialogunterstützung wird abgefangen',()=>{
 for(const property of ['disabled','hidden']){const a=app();a.get(property==='disabled'?'enlarge-view':'room-preview')[property]=true;a.get('enlarge-view').click();assert.ok(!a.get('detail-view').open);assert.equal(a.draws.length,0);}
 assert.equal(app({unsupported:true}).get('enlarge-view').hidden,true);
});
