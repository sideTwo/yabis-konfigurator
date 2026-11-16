const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../js/studio-core.js');
function app({reduced=false,saveData=false}={}){
 const handlers={},windowEvents={},timers=new Map(),dialogs=[],routes=[];let tick=0,motionChange;
 class Element{constructor(){this.children=[];this.events={};this.style={};this.open=false;}setAttribute(){}append(...nodes){this.children.push(...nodes);}addEventListener(type,fn){this.events[type]=fn;}showModal(){this.open=true;dialogs.push(this);}close(){this.open=false;}remove(){this.removed=true;}animate(){return {cancel(){}};}decode(){return Promise.resolve();}}
 const media={matches:reduced,addEventListener(type,fn){motionChange=fn;}};
 const context={window:{YabisStudio:C,addEventListener(type,fn){windowEvents[type]=fn;}},document:{body:new Element(),createElement:()=>new Element(),getElementById:()=>({currentSrc:'house.webp'}),addEventListener(type,fn){handlers[type]=fn;}},matchMedia:()=>media,navigator:{connection:{saveData}},Image:Element,location:{assign(href){routes.push(href);}},setTimeout(fn,ms){timers.set(++tick,{fn,ms});return tick;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/room-transition.js'),'utf8'),context);
 const link={dataset:{studioEntry:'bad'},href:'studio/index.html?raum=bad'};
 function click(extra={}){let prevented=false;handlers.click({target:{closest:()=>link},button:0,preventDefault(){prevented=true;},...extra});return prevented;}
 return {click,dialogs,routes,timers,windowEvents,media,changeMotion(){media.matches=true;motionChange();}};
}
test('Reduzierte Bewegung, Datensparen und neuer Tab behalten direkte Links',()=>{
 for(const settings of [{reduced:true},{saveData:true}]){const a=app(settings);assert.equal(a.click(),false);assert.equal(a.dialogs.length,0);}
 const a=app();assert.equal(a.click({ctrlKey:true}),false);assert.equal(a.click({button:1}),false);
});
test('Überspringen öffnet genau den Raum und entfernt Dialog und Timer',async()=>{
 const a=app();assert.equal(a.click(),true);await Promise.resolve();const d=a.dialogs[0];assert.equal(d.open,true);d.children.at(-1).events.click();assert.deepEqual(a.routes,['studio/index.html?raum=bad']);assert.equal(d.removed,true);assert.equal(a.timers.size,0);
});
test('Zurück-Navigation bereinigt den Einstieg; geänderte Bewegungseinstellung führt direkt weiter',async()=>{
 const a=app();a.click();await Promise.resolve();a.windowEvents.pagehide();assert.equal(a.dialogs[0].removed,true);assert.equal(a.routes.length,0);a.windowEvents.pageshow();assert.equal(a.timers.size,0);a.click();a.changeMotion();assert.deepEqual(a.routes,['studio/index.html?raum=bad']);assert.equal(a.timers.size,0);
});
