import * as T from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/RoomEnvironment.js';
import {Reflector} from 'three/addons/Reflector.js';

export async function createStudio(canvas,products,onSurface){
 const Plan=window.YabisModelPlan,Models=window.YabisRoomModels,mobile=matchMedia('(max-width: 700px)').matches;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.8));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#e3e4de');
 const camera=new T.PerspectiveCamera(57,1,.08,70),controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=1.2;controls.maxDistance=13;controls.minPolarAngle=.55;controls.maxPolarAngle=1.72;controls.minAzimuthAngle=-1.15;controls.maxAzimuthAngle=1.15;
 let dirty=true,model=null,currentId=null,lastSettings=null,frame=0,disposed=false,tween=null;
 controls.addEventListener('change',()=>dirty=true);
 const pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment(),env=pmrem.fromScene(environment,.035);scene.environment=env.texture;scene.environmentIntensity=.5;environment.dispose();pmrem.dispose();
 const hemi=new T.HemisphereLight('#f4f7fc','#a6a896',2);scene.add(hemi);
 const sun=new T.DirectionalLight('#fffdf5',3.2);sun.position.set(-3.4,6,-2.8);sun.target.position.set(.3,.2,.4);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:20});sun.shadow.bias=-.00015;sun.shadow.normalBias=.008;sun.shadow.radius=3;scene.add(sun,sun.target);
 const fill=new T.DirectionalLight('#eef3fc',1.5);fill.position.set(1,3,5);scene.add(fill);
 const textures=new Map(),materials=new Map(),aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const loader=new T.TextureLoader();await Promise.all(products.map(async p=>{const t=await loader.loadAsync('../'+p.texture);t.colorSpace=T.SRGBColorSpace;t.anisotropy=aniso;textures.set(p.id,t);}));
 function standard(color,roughness=.7,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness});}
 function woodTexture(dark=false){
  const w=256,h=1024,data=new Uint8Array(w*h*4);let seed=71;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const grain=Math.sin(x*.22+Math.sin(y*.015)*.8)+.42*Math.sin(x*.82+Math.sin(y*.009)*2),n=(noise()-.5)*12,c=(dark?-.19:0)+grain*.035,i=(y*w+x)*4;data[i]=Math.max(0,Math.min(255,178*(1+c)+n));data[i+1]=Math.max(0,Math.min(255,135*(1+c)+n));data[i+2]=Math.max(0,Math.min(255,89*(1+c)+n));data[i+3]=255;}
  const t=new T.DataTexture(data,w,h);t.colorSpace=T.SRGBColorSpace;t.anisotropy=aniso;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;return t;
 }
 const oak=woodTexture(),darkOak=woodTexture(true);textures.set('oak-natur',oak);textures.set('oak-dunkel',darkOak);
 const skyData=new Uint8Array([181,205,218,255,181,205,218,255,213,225,209,255,213,225,209,255]),sky=new T.DataTexture(skyData,2,2);sky.colorSpace=T.SRGBColorSpace;sky.needsUpdate=true;
 const palette={plaster:standard('#f8f8f4',.92),white:standard('#f5f5ef',.5),ceramic:new T.MeshPhysicalMaterial({color:'#f8f9f6',roughness:.19,clearcoat:.4,clearcoatRoughness:.22}),metal:standard('#a6aaa6',.25,1),dark:standard('#292d2b',.4,.4),wood:new T.MeshStandardMaterial({map:oak,roughness:.7}),cabinet:standard('#e9e7de',.68),stone:standard('#d9d5c7',.52),glass:new T.MeshPhysicalMaterial({color:'#eef4f1',roughness:.06,transmission:.92,thickness:.008,ior:1.5,transparent:true,opacity:1}),sky:new T.MeshBasicMaterial({map:sky}),mirror:standard('#d4dfdf',.04,1),fabric:standard('#d4cfc1',1),fabricDark:standard('#b7b49f',1),pot:standard('#a99981',.96),leaf:standard('#727c54',.95),ovenGlass:standard('#464a47',.13,.35)};
 const round=(w,h,d,r=.001)=>new RoundedBoxGeometry(w,h,d,2,r);
 function tileMaterial(id){if(materials.has(id))return materials.get(id);const p=products.find(p=>p.id===id),polished=p?.finish?.toLowerCase().includes('poliert');const m=new T.MeshPhysicalMaterial({map:textures.get(id)||textures.get('habitat-perla'),roughness:id.startsWith('oak-')?.74:polished?.24:.63,metalness:0,clearcoat:polished?.24:0,clearcoatRoughness:.27});m.name=id;materials.set(id,m);return m;}
 const grouts={light:'#cfcfc6',grey:'#969b94',dark:'#454c48',sand:'#b6a88c'};
 function clearGroup(group){const geo=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.userData.ownedMaterial)mats.add(o.material);});while(group.children.length)group.remove(group.children[0]);geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
 function surface(kind,settings){
  if(!model)return;const target=model.surfaces[kind];clearGroup(target);
  const plans=Plan.plans(currentId,lastSettings.wallHeight),wood=kind==='floor'&&settings.product.startsWith('oak-');
  const format=wood?[20,120]:settings.format,material=tileMaterial(settings.product),joint=wood?.0015:.003;
  for(const p of plans[kind]){
   const group=new T.Group();group.name=p.name;group.position.set(...p.pos);group.rotation.set(...p.rotation);target.add(group);
   const groutMat=standard(grouts[settings.grout]||grouts.grey,.95),bed=new T.Mesh(new T.BoxGeometry(p.w,p.h,.004),groutMat);bed.position.z=-.002;bed.receiveShadow=true;bed.userData={surface:kind,ownedMaterial:true};bed.name=p.name+'_Fugenbett';group.add(bed);
   for(const tile of Plan.tiles(p.w,p.h,format,wood?'halb':settings.pattern,p.u0,p.v0,joint,kind)){
    const geometry=round(tile.w,tile.h,.009,.0008),pos=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<pos.count;i++){const x=(pos.getX(i)+tile.w/2)/tile.w,y=(pos.getY(i)+tile.h/2)/tile.h;uv.setXY(i,tile.uv[0]+x*(tile.uv[2]-tile.uv[0]),tile.uv[1]+y*(tile.uv[3]-tile.uv[1]));}
    const m=new T.Mesh(geometry,material);m.position.set(tile.x,tile.y,.0045);m.receiveShadow=true;m.castShadow=false;m.name=p.name+'_Fliese_'+tile.row+'_'+tile.col;m.userData={surface:kind,physicalTile:true,formatCm:format};group.add(m);
   }
  }
  if(kind==='wall'){
   clearGroup(model.profiles);for(const p of plans.trim){const g=new T.Mesh(new T.BoxGeometry(p.w,.008,.016),palette.metal);g.name='Metall_Abschlussprofil_120cm';g.position.set(...p.pos);g.rotation.set(...p.rotation);model.profiles.add(g);}
   model.flushParts.forEach(p=>p.material=material);
  }
  canvas.dataset[kind]=settings.product;canvas.dataset[kind+'Format']=format.join(',');canvas.dataset[kind+'Grout']=settings.grout;dirty=true;
 }
 function setRoom(id,settings){
  if(model){scene.remove(model.root);const geometries=new Set();model.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.isReflector)o.getRenderTarget().dispose();if(o.userData.ownedMaterial)o.material.dispose();});geometries.forEach(g=>g.dispose());}
  currentId=Plan.rooms[id]?id:'bad';lastSettings=structuredClone(settings);
  model=Models.create(T,currentId,Plan,palette,{rounded:round,mirror(w,h){const m=new Reflector(new T.PlaneGeometry(w,h),{textureWidth:mobile?512:768,textureHeight:mobile?512:768,color:0xdce2e0,clipBias:.003});m.name='Spiegel';return m;}});
  scene.add(model.root);surface('floor',settings.floor);surface('wall',settings.wall);canvas.dataset.room=currentId;view('room',true);dirty=true;
 }
 function update(kind,settings){lastSettings[kind]=structuredClone(settings);surface(kind,settings);}
 function height(value){lastSettings.wallHeight=value==='full'?'full':'120';surface('wall',lastSettings.wall);canvas.dataset.wallHeight=lastSettings.wallHeight;}
 function pose(name){const base=model.view,target=new T.Vector3(...base.target),position=new T.Vector3(...base.position);if(name==='floor'){target.set(0,.15,0);position.set(.1,2.9,3.6);}if(name==='wall'){target.set(currentId==='bad'?1.1:0,1.2,currentId==='bad'?-.8:-model.dimensions.depth/2+.1);position.set(-.6,1.7,2.2);}if(name==='overview'){target.set(0,.75,-.2);position.set(4,4.5,5);}const aspect=camera.aspect;const extra=Math.max(1,Math.min(1.8,.95/aspect));position.sub(target).multiplyScalar(extra).add(target);return{position,target};}
 function view(name='room',immediate=false){if(!model)return;const p=pose(name);if(immediate||matchMedia('(prefers-reduced-motion: reduce)').matches){tween=null;camera.position.copy(p.position);controls.target.copy(p.target);controls.update();dirty=true;}else{tween={start:performance.now(),from:camera.position.clone(),to:p.position,fromTarget:controls.target.clone(),toTarget:p.target};}}
 function resize(){const b=canvas.parentElement.getBoundingClientRect();if(!b.width||!b.height)return;renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();dirty=true;}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down=null;
 canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6||!model)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const all=raycaster.intersectObject(model.root,true);for(const hit of all){if(hit.object.material===palette.glass)continue;const kind=hit.object.userData.surface;if(kind)onSurface(kind);break;}});
 function render(now){if(disposed)return;frame=requestAnimationFrame(render);if(document.hidden)return;if(tween){const t=Math.min(1,(now-tween.start)/900),e=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,e);controls.target.lerpVectors(tween.fromTarget,tween.toTarget,e);dirty=true;if(t===1)tween=null;}if(controls.update())dirty=true;if(dirty){renderer.render(scene,camera);dirty=false;canvas.dataset.rendered='true';}}
 frame=requestAnimationFrame(render);
 async function exportModel(){
  const {GLTFExporter}=await import('../vendor/three/GLTFExporter.js');const copy=model.root.clone(true);
  copy.traverse(o=>{if(o.isReflector||o.material?.isShaderMaterial)o.material=palette.mirror;});
  const binary=await new GLTFExporter().parseAsync(copy,{binary:true,maxTextureSize:1024,onlyVisible:true});
  const blob=new Blob([binary],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Yabis-'+currentId+'-3D-Modell.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 return {setRoom,update,height,view,exportModel,saveImage(){renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Yabis-'+currentId+'-3D-Entwurf.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');},get root(){return model?.root;},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();env.dispose();textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());Object.values(palette).forEach(m=>m.dispose());}};
}
