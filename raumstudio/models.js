((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YabisRoomModels=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 function create(T,id,plan,palette,kit={}){
  const r=plan.rooms[id];if(!r)throw Error('Unbekannter Raum.');
  const root=new T.Group();root.name='Yabis_'+id;root.userData={room:id,units:'metres',description:'Independent floor and wall geometry; illustrative room dimensions'};
  const architecture=new T.Group();architecture.name='Architektur';root.add(architecture);
  const fixtures=new T.Group();fixtures.name='Einrichtung';root.add(fixtures);
  const surfaces={floor:new T.Group(),wall:new T.Group()};surfaces.floor.name='Bodenfliesen';surfaces.wall.name='Wandfliesen';root.add(surfaces.floor,surfaces.wall);
  const profiles=new T.Group();profiles.name='Abschlussprofile';root.add(profiles);
  const flushParts=[];
  const mat=palette,rounded=kit.rounded||((w,h,d)=>new T.BoxGeometry(w,h,d));
  function mesh(geometry,material,pos,rotation,parent=fixtures,name=''){
   const m=new T.Mesh(geometry,material);m.name=name;if(pos)m.position.set(...pos);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,pos,material=mat.white,rad=.008,parent=fixtures,name=''){return mesh(rad?rounded(w,h,d,Math.min(rad,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),material,pos,null,parent,name);}
  function rod(a,b,radius=.012,material=mat.metal,parent=fixtures){const v=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(v);const m=mesh(new T.CylinderGeometry(radius,radius,delta.length(),12),material,v.add(end).multiplyScalar(.5).toArray(),null,parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
  function bowl(pos,scale=[1,1,1],parent=fixtures){const pts=[[0,.01],[.21,.01],[.25,.035],[.27,.12],[.266,.155],[.248,.155],[.22,.055],[.12,.03],[0,.03]].map(p=>new T.Vector2(...p));const m=mesh(new T.LatheGeometry(pts,48),mat.ceramic,pos,null,parent,'Waschbecken');m.scale.set(...scale);return m;}
  function whiteWall(w,h,d,pos){return box(w,h,d,pos,mat.plaster,0,architecture,'Weisse_Wand');}
  function window(x,y,z,w,h,parent=fixtures){
   box(w,h,.015,[x,y,z-.06],mat.sky,0,parent,'Fenster_Ausblick').castShadow=false;
   for(const dx of [-w/2,w/2])box(.045,h+.08,.10,[x+dx,y,z],mat.dark,.002,parent);
   for(const dy of [-h/2,h/2])box(w+.045,.045,.10,[x,y+dy,z],mat.dark,.002,parent);
   box(w,.035,.06,[x,y-.25*h,z+.01],mat.dark,.001,parent);
  }
  function plant(x,y,z,size=1){const pot=mesh(new T.CylinderGeometry(.13,.09,.23,24),mat.pot,[x,y+.115*size,z]);pot.scale.setScalar(size);for(let i=0;i<7;i++){const a=i*2.4,end=[x+Math.sin(a)*.22*size,y+(.5+i*.035)*size,z+Math.cos(a)*.17*size];rod([x,y+.2*size,z],end,.003*size,mat.wood);for(let j=0;j<4;j++){const f=.4+j*.16,leaf=mesh(new T.SphereGeometry(1,8,6),mat.leaf,[x+(end[0]-x)*f,y+.2*size+(end[1]-y-.2*size)*f,z+(end[2]-z)*f]);leaf.scale.set(.075*size,.015*size,.025*size);leaf.rotation.z=j*.8+i;}}}
  const W=r.width,D=r.depth,H=r.height;
  box(W+.16,.12,D+.16,[0,-.07,0],mat.plaster,0,architecture,'Bodenaufbau');
  if(id!=='balkon')mesh(new T.PlaneGeometry(W,D),mat.plaster,[0,H,0],[Math.PI/2,0,0],architecture,'Weisse_Decke').castShadow=false;
  if(id==='bad'){
   whiteWall(.12,H,D,[-W/2-.06,H/2,0]);whiteWall(.12,H,D,[W/2+.06,H/2,0]);
   whiteWall(1.05,H,.12,[-1.175,H/2,-D/2-.06]);whiteWall(1.5,H,.12,[.95,H/2,-D/2-.06]);whiteWall(.85,.14,.12,[-.225,.07,-D/2-.06]);whiteWall(.85,.15,.12,[-.225,2.525,-D/2-.06]);
   window(-.225,1.295,-D/2,.85,2.31);
   const vanity=new T.Group();vanity.name='Waschtisch';vanity.position.set(-1.69,0,.05);vanity.rotation.y=Math.PI/2;fixtures.add(vanity);
   box(1.05,.47,.48,[0,.68,.26],mat.wood,.012,vanity);box(1.10,.035,.53,[0,.935,.28],mat.stone,.004,vanity);
   for(const x of [-.2625,.2625])box(.515,.455,.016,[x,.68,.508],mat.cabinet,.006,vanity);
   bowl([0,.96,.29],[.88,.95,.9],vanity);
   rod([0,1.18,.03],[0,1.18,.31],.012,mat.metal,vanity);rod([0,1.18,.31],[0,1.145,.31],.012,mat.metal,vanity);
   box(.96,.92,.018,[0,1.85,.015],mat.metal,.003,vanity,'Spiegelrahmen');
   if(kit.mirror){const m=kit.mirror(.936,.896);m.position.set(0,1.85,.028);vanity.add(m);}else box(.936,.896,.008,[0,1.85,.029],mat.mirror,0,vanity,'Spiegel');
   // The WC is a smooth, closed ceramic shell; its local +Z points away from the wall.
   const wc=new T.Group();wc.name='WC';wc.position.set(1.69,0,.8);wc.rotation.y=-Math.PI/2;fixtures.add(wc);
   const rings=[[.27,.115,.18,.24],[.31,.16,.23,.27],[.43,.19,.27,.28],[.56,.195,.27,.28]],verts=[],indices=[],N=48;
   for(const [y,rx,rz,cz]of rings)for(let i=0;i<N;i++){const a=i/N*Math.PI*2;verts.push(Math.cos(a)*rx,y,cz+Math.sin(a)*rz);}
   for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=(j+1)*N+i,d=(j+1)*N+(i+1)%N;indices.push(a,c,b,b,c,d);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,mat.ceramic,null,null,wc,'WC_Keramik');
   box(.37,.045,.535,[0,.58,.28],mat.ceramic,.018,wc,'WC_Deckel');box(.26,.26,.22,[0,.43,.08],mat.ceramic,.05,wc);
   box(.293,.193,.012,[0,1.08,.016],mat.metal,.002,wc,'Drueckerplatte_Rahmen');
   for(const [x,w]of [[-.048,.17],[.092,.10]])flushParts.push(box(w,.158,.012,[x,1.08,.029],mat.stone,.001,wc,'Beflieste_Drueckertaste'));
   box(1.08,.035,1.08,[1.15,.025,-1.2],mat.ceramic,.012,fixtures,'Duschwanne');box(.09,.004,.09,[1.15,.045,-1.2],mat.metal,.001);
   const glass=box(.008,2.2,1.1,[.605,1.13,-1.19],mat.glass,.001,fixtures,'Duschglas');glass.castShadow=false;
   const front=box(1.06,2.2,.008,[1.145,1.13,-.65],mat.glass,.001,fixtures,'Duschtuer');front.castShadow=false;
   rod([.605,.04,-.65],[.605,2.23,-.65],.006);rod([.60,2.23,-.65],[1.69,2.23,-.65],.006);
   rod([1.57,1.15,-.63],[1.30,1.15,-.63],.009);
   rod([1.15,1.0,-1.70],[1.15,2.25,-1.70],.012);rod([1.15,2.25,-1.70],[1.15,2.25,-1.37],.012);box(.24,.016,.24,[1.15,2.245,-1.37],mat.metal,.006);
   rod([1.06,1.03,-1.70],[1.24,1.03,-1.70],.021);plant(-1.48,.96,-.32,.42);
  }else if(id==='wohnen'){
   whiteWall(.12,H,D,[-W/2-.06,H/2,0]);whiteWall(2.7,H,.12,[-1.15,H/2,-D/2-.06]);
   window(1.35,1.45,-D/2,2.2,2.5);
   box(.85,.22,2.55,[-1.93,.32,-.14],mat.fabric,.1);box(.23,.62,2.7,[-2.30,.59,-.14],mat.fabric,.08);
   for(const z of [-1.02,-.14,.74]){box(.75,.20,.84,[-1.84,.51,z],mat.fabric,.08);const p=box(.18,.47,.68,[-2.13,.84,z],mat.fabricDark,.065);p.rotation.z=-.12;}
   for(const z of [-1.49,1.21])box(.85,.45,.16,[-1.91,.56,z],mat.fabric,.055);
   box(1.05,.27,.7,[-.45,.18,.15],mat.stone,.02);box(1.6,.60,.35,[.4,.35,-1.86],mat.wood,.008);
   box(.74,.17,.83,[1.35,.36,.44],mat.fabric,.12);box(.74,.58,.18,[1.35,.68,.10],mat.fabric,.08);for(const x of [1.05,1.65])box(.12,.35,.85,[x,.5,.43],mat.fabric,.05);
   plant(1.9,0,-1.55,1.3);
  }else if(id==='balkon'){
   whiteWall(.12,H,D,[-W/2-.06,H/2,0]);
   for(let i=0;i<=12;i++)rod([-1.75+i*.29,.06,-1.17],[-1.75+i*.29,1.04,-1.17],.009,mat.dark);
   rod([-1.78,1.05,-1.17],[1.78,1.05,-1.17],.018,mat.dark);
   for(let i=0;i<=8;i++)rod([1.77,.06,-1.17+i*.29],[1.77,1.04,-1.17+i*.29],.009,mat.dark);
   rod([1.77,1.05,-1.17],[1.77,1.05,1.17],.018,mat.dark);
   box(.85,.045,.65,[.18,.73,-.12],mat.wood,.01);for(const x of [-.17,.53])for(const z of [-.37,.13])rod([x,0,z],[x,.71,z],.023,mat.wood);
   for(const x of [-.7,1.04]){box(.44,.04,.46,[x,.43,-.12],mat.wood,.008);box(.44,.42,.035,[x,.67,-.35],mat.wood,.005);for(const dx of [-.18,.18])for(const z of [-.30,.07])rod([x+dx,0,z],[x+dx,.43,z],.018,mat.wood);}
   plant(-1.3,0,-.72,1.7);
  }else if(id==='kueche'){
   whiteWall(W,H,.12,[0,H/2,-D/2-.06]);whiteWall(.12,H,D,[-W/2-.06,H/2,0]);
   box(3.3,.8,.62,[0,.43,-1.28],mat.cabinet,.006);
   for(let i=0;i<6;i++)box(.54,.78,.02,[-1.375+i*.55,.43,-.955],mat.cabinet,.003);
   box(3.4,.04,.68,[0,.86,-1.26],mat.wood,.005);
   box(.63,.012,.46,[-.85,.888,-1.2],mat.dark,.004);box(.54,.55,.025,[-.825,.47,-.94],mat.dark,.01);box(.40,.29,.008,[-.825,.43,-.921],mat.ovenGlass,.01);
   box(.54,.012,.39,[.65,.888,-1.17],mat.metal,.01);box(.45,.012,.29,[.65,.895,-1.17],mat.dark,.012);
   rod([.65,.89,-1.48],[.65,1.28,-1.48],.014);rod([.65,1.28,-1.48],[.65,1.28,-1.19],.014);rod([.65,1.28,-1.19],[.65,1.22,-1.19],.014);
   box(3.25,.04,.29,[0,1.65,-1.44],mat.wood,.004);for(const x of [-1.1,0,1.1])box(1.06,.64,.28,[x,2.03,-1.45],mat.cabinet,.004);
   plant(1.25,.89,-1.24,.55);
  }else if(id==='treppe'){
   whiteWall(.12,H,D,[-W/2-.06,H/2,0]);whiteWall(W,H,.12,[0,H/2,-D/2-.06]);
   for(let i=0;i<8;i++)box(1.5,(i+1)*.17,.28,[.3,(i+1)*.17/2,.5-i*.28],mat.plaster,0,architecture,'Treppenkoerper_'+(i+1));
   box(1.5,1.36,.6,[.3,.68,-1.9],mat.plaster,0,architecture,'Podestkoerper');
   rod([1.12,.93,.6],[1.12,2.15,-1.5],.022,mat.dark);
   for(const i of [0,3,7])rod([1.12,(i+1)*.17,.5-i*.28],[1.12,(i+1)*.17+.82,.5-i*.28],.014,mat.dark);
   plant(-1.05,0,-1.25,1.2);
  }
  const views={bad:{position:[0,1.65,3.3],target:[0,1.1,-.5]},wohnen:{position:[1.0,1.8,4.1],target:[-.25,.9,-.5]},balkon:{position:[.5,1.75,3.1],target:[0,.7,-.2]},kueche:{position:[.6,1.7,3.2],target:[0,1.25,-1]},treppe:{position:[-.3,2.0,4],target:[.15,1.15,-.65]}};
  return {root,surfaces,profiles,flushParts,dimensions:r,view:views[id]};
 }
 return {create};
});
