((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisModelPlan=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const rooms={bad:{name:'Badezimmer',width:3.4,depth:3.5,height:2.6},wohnen:{name:'Wohnen & Vinyl',width:5,depth:4.2,height:2.7},balkon:{name:'Balkon',width:3.6,depth:2.4,height:2.6},kueche:{name:'Küchenwand',width:4,depth:3.2,height:2.6},treppe:{name:'Treppenhaus',width:2.8,depth:4.2,height:3.6}};
 const formats=[[60,120],[60,60],[120,120]];
 function validFormat(f){return Array.isArray(f)&&formats.some(x=>x.join(',')===f.join(','));}
 // Tile centres and UV crops are computed in metres, before projection by a camera.
 function tiles(width,height,format=[60,120],pattern='kreuz',u0=0,v0=0,joint=.003,surface='wall'){
  if(!(width>0&&height>0)||!format.every(x=>Number.isFinite(x)&&x>0))throw Error('Ungültige Modellfläche.');
  const tw=(surface==='floor'?format[0]:format[1])/100,th=(surface==='floor'?format[1]:format[0])/100;
  const result=[],eps=1e-8;
  for(let row=Math.floor(v0/th);row*th<v0+height-eps;row++){
   const shift=pattern==='halb'&&(row%2)!==0?tw/2:0;
   for(let col=Math.floor((u0-shift)/tw);col*tw+shift<u0+width-eps;col++){
    const left=col*tw+shift,bottom=row*th;
    const x1=Math.max(u0,left+joint/2),x2=Math.min(u0+width,left+tw-joint/2),y1=Math.max(v0,bottom+joint/2),y2=Math.min(v0+height,bottom+th-joint/2);
    if(x2-x1>eps&&y2-y1>eps)result.push({x:(x1+x2)/2-u0-width/2,y:(y1+y2)/2-v0-height/2,w:x2-x1,h:y2-y1,uv:[(x1-left)/tw,(y1-bottom)/th,(x2-left)/tw,(y2-bottom)/th],row,col});
   }
  }return result;
 }
 const segment=(name,w,h,pos,rotation=[0,0,0],u0=0,v0=0)=>({name,w,h,pos,rotation,u0,v0});
 function plans(id,height='120'){
  const r=rooms[id];if(!r)throw Error('Unbekannter Raum.');const W=r.width,D=r.depth,H=r.height,h=height==='full'?H:1.2;
  const floor=[segment('Boden',W,D,[0,.001,0],[-Math.PI/2,0,0])],wall=[],trim=[];
  const add=(name,w,tileH,pos,rot,u0=0,v0=0,profile=false)=>{wall.push(segment(name,w,tileH,pos,rot,u0,v0));if(profile&&height!=='full')trim.push(segment(name,w,.008,[pos[0],tileH,pos[2]],rot));};
  if(id==='bad'){
   add('Wand_links',D,h,[-W/2+.007,h/2,0],[0,Math.PI/2,0],0,0,true);
   add('Wand_hinten_links',1.05,h,[-1.175,h/2,-D/2+.007],[0,0,0],0,0,true);
   add('Wand_hinten_Mitte',.4,h,[.4,h/2,-D/2+.007],[0,0,0],1.9,0,true);
   add('Fenster_Bruestung',.85,.14,[-.225,.07,-D/2+.007],[0,0,0],1.05,0);
   if(height==='full')add('Fenster_Sturz',.85,.15,[-.225,2.525,-D/2+.007],[0,0,0],1.05,2.45);
   add('Dusche_Rueckwand',1.1,H,[1.15,H/2,-D/2+.007],[0,0,0],2.3);
   add('Dusche_Seitenwand',1.1,H,[W/2-.007,H/2,-1.2],[0,-Math.PI/2,0],0);
   add('Wand_rechts',2.4,h,[W/2-.007,h/2,.55],[0,-Math.PI/2,0],1.1,0,true);
  }else if(id==='wohnen'){
   add('Akzentwand',2.7,h,[-1.15,h/2,-D/2+.007],[0,0,0],0,0,true);
  }else if(id==='balkon'){
   add('Balkonwand',D,h,[-W/2+.007,h/2,0],[0,Math.PI/2,0],0,0,true);
  }else if(id==='kueche'){
   add('Kuechenrueckwand',3.3,.65,[0,1.3,-D/2+.007],[0,0,0],0,0);
  }else if(id==='treppe'){
   add('Treppenhaus_Wand',D,h,[-W/2+.007,h/2,0],[0,Math.PI/2,0],0,0,true);
   for(let i=0;i<8;i++){
    floor.push(segment('Stufe_'+(i+1),1.5,.28,[.3,(i+1)*.17+.001,.5-i*.28],[-Math.PI/2,0,0],0,i*.28));
    floor.push(segment('Setzstufe_'+(i+1),1.5,.17,[.3,(i+.5)*.17,.64-i*.28],[0,0,0],0,i*.17));
   }
   floor.push(segment('Oberes_Podest',1.5,.6,[.3,1.361,-1.9],[-Math.PI/2,0,0],0,2.24));
  }
  return {floor,wall,trim};
 }
 return {rooms,formats,validFormat,tiles,plans};
});
