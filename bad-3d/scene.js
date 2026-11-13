import * as T from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { Reflector } from 'three/addons/Reflector.js';

export async function createBathroom(canvas,products,onFlightEnd){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;renderer.outputColorSpace=T.SRGBColorSpace;
 let dirty=true;
 const scene=new T.Scene();scene.background=new T.Color('#ddd9cc');
 const camera=new T.PerspectiveCamera(65,1,.08,60);camera.position.set(.1,1.6,4.5);
 const controls=new OrbitControls(camera,canvas);controls.target.set(-.15,1.1,-1.25);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.5;controls.maxDistance=5.9;controls.minPolarAngle=.8;controls.maxPolarAngle=1.75;controls.minAzimuthAngle=-.67;controls.maxAzimuthAngle=.67;controls.enabled=false;controls.addEventListener('change',()=>dirty=true);
 const env=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);const envTarget=pmrem.fromScene(env,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.33;env.dispose();pmrem.dispose();
 const images=new Map();await Promise.all(products.map(async p=>{const img=new Image();img.src='../'+p.texture;await img.decode();images.set(p.id,img);}));
 const floorPlanes=[],wallPlanes=[],materials=new Map(),maxAniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const standard=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const plaster=standard('#e8e5db',.95),white=standard('#efede5',.25),black=standard('#292b28',.3,.65),brass=standard('#a48858',.32,.85);
 const lightMat=new T.MeshBasicMaterial({color:'#fff2cd'});
 function mesh(geometry,material,pos,rotation){const m=new T.Mesh(geometry,material);if(pos)m.position.set(...pos);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 function box(w,h,d,pos,mat=plaster,r=.015){return mesh(r?new RoundedBoxGeometry(w,h,d,2,r):new T.BoxGeometry(w,h,d),mat,pos);}
 function plane(w,h,pos,rotation,material=plaster,collection=null,offset=[0,0]){const geo=new T.PlaneGeometry(w,h);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w+offset[0],uv.getY(i)*h+offset[1]);const m=mesh(geo,material,pos,rotation);m.castShadow=false;if(collection)collection.push(m);return m;}
 function rod(a,b,r,mat=black){const start=new T.Vector3(...a),end=new T.Vector3(...b),dir=end.clone().sub(start);const m=mesh(new T.CylinderGeometry(r,r,dir.length(),16),mat,start.clone().add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return m;}
 function lathe(points,pos,scale,material){const geo=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),64);const m=mesh(geo,material,pos);m.scale.set(...scale);return m;}
 function woodMaterial(){const c=document.createElement('canvas');c.width=512;c.height=1024;const g=c.getContext('2d');g.fillStyle='#8b6747';g.fillRect(0,0,512,1024);let seed=71;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let i=0;i<2400;i++){const x=random()*512;g.strokeStyle=`rgba(${random()>.45?'36,22,10':'228,197,153'},${random()*.13})`;g.lineWidth=random()*1.5+.3;g.beginPath();g.moveTo(x,0);for(let y=0;y<=1024;y+=50)g.lineTo(x+Math.sin(y/200+i)*3,y);g.stroke();}const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=maxAniso;return new T.MeshStandardMaterial({map,roughness:.72});}
 const wood=woodMaterial();
 function contactShadow(x,z,sx,sz,opacity=.2,y=.009){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gradient=g.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,`rgba(22,18,13,${opacity})`);gradient.addColorStop(1,'rgba(22,18,13,0)');g.fillStyle=gradient;g.fillRect(0,0,128,128);const mat=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false});const p=plane(sx,sz,[x,y,z],[-Math.PI/2,0,0],mat);const uv=p.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,i%2, i<2?1:0);return p;}
 // The room is modelled in metres. Floor and wall meshes are independent.
 plane(4.8,5.6,[0,0,0],[-Math.PI/2,0,0],plaster,floorPlanes);
 plane(5.6,2.9,[-2.4,1.45,0],[0,Math.PI/2,0],plaster,wallPlanes);
 plane(5.6,2.9,[2.4,1.45,0],[0,-Math.PI/2,0],plaster,wallPlanes);
 // Back wall, with a real opening for the window.
 plane(.55,2.9,[-2.125,1.45,-2.8],[0,0,0],plaster,wallPlanes,[0,0]);
 plane(2.55,2.9,[1.125,1.45,-2.8],[0,0,0],plaster,wallPlanes,[2.25,0]);
 plane(1.7,.7,[-1,.35,-2.8],[0,0,0],plaster,wallPlanes,[.55,0]);
 plane(1.7,.3,[-1,2.75,-2.8],[0,0,0],plaster,wallPlanes,[.55,2.6]);
 plane(4.8,5.6,[0,2.9,0],[Math.PI/2,0,0],plaster);
 // Entrance and corridor; the camera moves through the same doorway for every look.
 box(1.58,2.9,.13,[-1.61,1.45,2.8],plaster,0);box(1.58,2.9,.13,[1.61,1.45,2.8],plaster,0);box(1.65,.43,.13,[0,2.685,2.8],plaster,0);
 box(.09,2.48,.19,[-.86,1.24,2.82],wood,.008);box(.09,2.48,.19,[.86,1.24,2.82],wood,.008);box(1.8,.09,.19,[0,2.46,2.82],wood,.008);
 plane(1.8,3.5,[0,-.003,4.55],[-Math.PI/2,0,0],plaster);plane(3.6,2.9,[-.92,1.45,4.6],[0,Math.PI/2,0],plaster);plane(3.6,2.9,[.92,1.45,4.6],[0,-Math.PI/2,0],plaster);
 // Glazed window and a soft distant garden, generated as background artwork.
 const sky=document.createElement('canvas');sky.width=512;sky.height=768;const sg=sky.getContext('2d'),skyGradient=sg.createLinearGradient(0,0,0,768);skyGradient.addColorStop(0,'#bfcfd2');skyGradient.addColorStop(.55,'#e7e8d6');skyGradient.addColorStop(1,'#939978');sg.fillStyle=skyGradient;sg.fillRect(0,0,512,768);sg.filter='blur(22px)';for(let i=0;i<26;i++){sg.fillStyle=`rgba(${74+i%3*12},${96+i%4*8},60,.13)`;sg.beginPath();sg.ellipse((i*91)%550,630+(i%5)*28,50+(i%4)*18,120+(i%5)*20,0,0,Math.PI*2);sg.fill();}const skyMap=new T.CanvasTexture(sky);skyMap.colorSpace=T.SRGBColorSpace;const skyPlane=mesh(new T.PlaneGeometry(1.7,1.9),new T.MeshBasicMaterial({map:skyMap}),[-1,1.65,-2.94]);skyPlane.castShadow=false;
 const frame=standard('#343c36',.4,.4);for(const x of [-1.85,-.15])box(.05,1.96,.12,[x,1.65,-2.81],frame,.002);for(const y of [.7,2.6])box(1.75,.05,.12,[-1,y,-2.81],frame,.002);box(.035,1.88,.05,[-1,1.65,-2.74],frame,.001);box(1.81,.04,.25,[-1,.68,-2.68],white,.004);
 // Floating oak vanity, drawer gaps and fluted fronts.
 box(.64,.47,1.9,[-2.04,.64,.16],wood,.018);box(.68,.055,1.96,[-2.02,.91,.16],white,.012);box(.018,.008,1.77,[-1.709,.64,.16],black,.001);
 for(let i=0;i<35;i++)box(.014,.43,.013,[-1.711,.64,-.75+i*.053],wood,.003);
 contactShadow(-2,.2,1.25,2.4,.25);
 const sink=lathe([[0,.012],[.23,.012],[.29,.045],[.31,.145],[.30,.18],[.275,.18],[.25,.07],[.10,.036],[0,.036]],[-1.98,.94,-.1],[1,.8,1.27],white);
 rod([-2.25,.96,-.1],[-2.25,1.22,-.1],.018);rod([-2.25,1.22,-.1],[-1.98,1.22,-.1],.018);rod([-1.98,1.22,-.1],[-1.98,1.18,-.1],.018);
 mesh(new T.CircleGeometry(.026,32),black,[-1.98,.975,-.1],[-Math.PI/2,0,0]);
 // Actual planar mirror; the reflected room follows the camera.
 box(.04,1.19,1.63,[-2.373,1.83,.16],brass,.08);
 const mirrorShape=new T.Shape(),mw=1.55,mh=1.1,mr=.12;mirrorShape.moveTo(-mw/2+mr,-mh/2);mirrorShape.lineTo(mw/2-mr,-mh/2);mirrorShape.quadraticCurveTo(mw/2,-mh/2,mw/2,-mh/2+mr);mirrorShape.lineTo(mw/2,mh/2-mr);mirrorShape.quadraticCurveTo(mw/2,mh/2,mw/2-mr,mh/2);mirrorShape.lineTo(-mw/2+mr,mh/2);mirrorShape.quadraticCurveTo(-mw/2,mh/2,-mw/2,mh/2-mr);mirrorShape.lineTo(-mw/2,-mh/2+mr);mirrorShape.quadraticCurveTo(-mw/2,-mh/2,-mw/2+mr,-mh/2);
 const mirror=new Reflector(new T.ShapeGeometry(mirrorShape),{color:0xdcded5,textureWidth:768,textureHeight:768,clipBias:.003});mirror.position.set(-2.345,1.83,.16);mirror.rotation.y=Math.PI/2;scene.add(mirror);
 const mirrorGlow=new T.PointLight('#ffe9ba',1.7,2.5);mirrorGlow.position.set(-2.15,2.35,.15);scene.add(mirrorGlow);
 // Ceramic freestanding bathtub: both inner and outer bowl are real geometry.
 lathe([[0,.04],[.31,.04],[.40,.09],[.47,.30],[.48,.52],[.46,.57],[.425,.57],[.415,.52],[.35,.18],[.28,.12],[0,.12]],[-.75,.01,-1.8],[1.95,1,1],white);
 contactShadow(-.75,-1.8,2.35,1.4,.35);
 rod([-1.63,0,-1.7],[-1.63,.83,-1.7],.022);rod([-1.63,.83,-1.7],[-1.26,.83,-1.7],.022);rod([-1.26,.83,-1.7],[-1.26,.78,-1.7],.022);
 // Walk-in shower, metal details and glass pane.
 const showerGlass=new T.MeshPhysicalMaterial({color:'#e9f4ed',roughness:.05,transmission:.93,thickness:.015,ior:1.45,transparent:true,opacity:1});
 const glass=box(.014,2.32,1.8,[.68,1.16,-1.89],showerGlass,.002);glass.castShadow=false;
 rod([.68,.02,-.98],[.68,2.32,-.98],.009,frame);rod([.68,2.31,-.98],[2.37,2.31,-.98],.009,frame);
 rod([1.67,.95,-2.72],[1.67,2.37,-2.72],.018);rod([1.67,2.37,-2.72],[1.67,2.37,-2.12],.018);box(.36,.028,.36,[1.67,2.35,-2.12],black,.018);
 const showerFace=box(.25,.12,.025,[1.67,1.04,-2.75],black,.012);for(const x of [1.60,1.74])rod([x,1.04,-2.7],[x,1.04,-2.65],.025);
 const hose=new T.CatmullRomCurve3([new T.Vector3(1.67,1,-2.69),new T.Vector3(1.62,.6,-2.63),new T.Vector3(1.85,.62,-2.63),new T.Vector3(1.9,1.45,-2.67)]);mesh(new T.TubeGeometry(hose,40,.008,8,false),black);rod([1.9,1.4,-2.66],[1.9,1.65,-2.61],.023);
 box(.05,.005,1.3,[2.25,.006,-1.9],black,.001);
 // Towel rail and folded cotton towels.
 rod([2.35,1.1,.2],[2.22,1.1,.2],.014);rod([2.35,1.1,1.2],[2.22,1.1,1.2],.014);rod([2.22,1.1,.2],[2.22,1.1,1.2],.014);
 const cloth=standard('#d5cbb5',1);box(.035,.6,.47,[2.21,.80,.7],cloth,.012);for(let i=0;i<6;i++)box(.037,.005,.45,[2.211,.55+i*.018,.7],standard(i%2?'#c7baa1':'#dfd4be',1),.001);
 box(.38,.035,.55,[-2.02,.96,.73],cloth,.015);box(.35,.03,.51,[-2.02,.994,.73],cloth,.013);
 const soap=standard('#bcb49a',.4);box(.09,.13,.09,[-2.16,1.0,-.58],soap,.012);rod([-2.16,1.06,-.58],[-2.16,1.12,-.58],.009,brass);box(.06,.012,.025,[-2.14,1.12,-.58],brass,.002);
 // Small stool and olive branches for scale and softer silhouettes.
 const stool=mesh(new T.CylinderGeometry(.27,.26,.055,48),wood,[.05,.42,-.75]);for(const [x,z]of [[-.14,-.91],[.20,-.91],[.05,-.54]])rod([x,0,z],[x,.42,z],.025,wood);
 lathe([[0,0],[.09,0],[.12,.08],[.10,.22],[.06,.25],[.06,.24]],[-1.96,.02,-2.1],[1,1,1],standard('#a69b82',.95));
 const leafMat=standard('#6f7860',.9);leafMat.side=T.DoubleSide;for(let i=0;i<6;i++){const start=[-1.96,.22,-2.1],end=[-1.96+Math.sin(i*2)*.19,.75+i*.065,-2.1+Math.cos(i*2)*.16];rod(start,end,.003,standard('#7c6a4c',1));for(let j=0;j<5;j++){const k=.35+j*.14,leaf=mesh(new T.SphereGeometry(1,12,8),leafMat,[start[0]+(end[0]-start[0])*k+Math.sin(j*3+i)*.045,.22+(end[1]-.22)*k,start[2]+(end[2]-start[2])*k]);leaf.scale.set(.065,.014,.024);leaf.rotation.z=j*.7;}}
 // Ceiling spots and daylight. Only the sun uses a high-resolution shadow map.
 scene.add(new T.HemisphereLight('#f5f5ed','#a39a82',.85));
 const sun=new T.DirectionalLight('#fff3d9',1.65);sun.position.set(-3,5.5,-5);sun.target.position.set(.4,0,.7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.camera.near=.1;sun.shadow.camera.far=18;sun.shadow.bias=-.0002;sun.shadow.normalBias=.012;sun.shadow.radius=3;scene.add(sun,sun.target);
 const windowFill=new T.PointLight('#eef6f1',5,9,2);windowFill.position.set(-1,2.0,-2.6);scene.add(windowFill);
 for(const [x,z]of [[-1.4,1],[1.4,1],[-1.4,-1.5],[1.4,-1.5]]){mesh(new T.CylinderGeometry(.08,.08,.015,32),frame,[x,2.885,z]);mesh(new T.CircleGeometry(.055,32),lightMat,[x,2.872,z],[Math.PI/2,0,0]);const light=new T.PointLight('#ffedcf',1.1,5,2);light.position.set(x,2.64,z);scene.add(light);}
 function makeTiledMaterial(product,settings){const c=document.createElement('canvas'),b=document.createElement('canvas');c.width=c.height=b.width=b.height=2048;const g=c.getContext('2d'),bg=b.getContext('2d'),image=images.get(product.id),size=settings.format.map(Number),tileW=size[1]/100,tileH=size[0]/100,joint=.0025;g.fillStyle={hell:'#cfc8b6',grau:'#93938d',dunkel:'#4d514e'}[settings.grout];g.fillRect(0,0,2048,2048);bg.fillStyle='#444';bg.fillRect(0,0,2048,2048);const gx=1024*joint/tileW,gy=1024*joint/tileH;for(let row=0;row<2;row++){const shift=settings.pattern==='halb'&&row%2?.5:0;for(let col=-1;col<3;col++){const x=(col+shift)*1024,y=row*1024;g.save();g.beginPath();g.rect(x+gx/2,y+gy/2,1024-gx,1024-gy);g.clip();if((row+col)%2===0){g.translate(x+1024,y);g.scale(-1,1);}else g.translate(x,y);g.drawImage(image,0,0,1024,1024);g.restore();bg.fillStyle='#a5a5a5';bg.fillRect(x+gx/2,y+gy/2,1024-gx,1024-gy);}}
 const map=new T.CanvasTexture(c),bump=new T.CanvasTexture(b);map.colorSpace=T.SRGBColorSpace;for(const texture of [map,bump]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1/(tileW*2),1/(tileH*2));texture.anisotropy=maxAniso;}return new T.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.0009,roughness:product.roughness,metalness:0});}
 function setSurface(surface,product,settings){const previous=materials.get(surface),mat=makeTiledMaterial(product,settings);for(const m of surface==='floor'?floorPlanes:wallPlanes)m.material=mat;materials.set(surface,mat);if(previous){previous.map.dispose();previous.bumpMap.dispose();previous.dispose();}dirty=true;canvas.dataset[surface]=product.id;canvas.dataset[surface+'Format']=settings.format.join(',');canvas.dataset[surface+'Grout']=settings.grout;canvas.dataset[surface+'Pattern']=settings.pattern;}
 let tween=null,disposed=false,animation=0;
 const views={room:{position:[.08,1.58,2.13],target:[-.15,1.15,-1.3]},floor:{position:[.12,1.8,1.55],target:[0,.05,-.5]},wall:{position:[-.15,1.65,.85],target:[1.35,1.4,-2.6]}};
 function animateTo(position,target,duration=1100,finish){controls.enabled=false;tween={start:performance.now(),from:camera.position.clone(),to:new T.Vector3(...position),fromTarget:controls.target.clone(),toTarget:new T.Vector3(...target),duration,finish};}
 function view(name,immediate=false){const v=views[name]||views.room;if(immediate){tween=null;camera.position.set(...v.position);controls.target.set(...v.target);controls.enabled=true;controls.update();}else animateTo(v.position,v.target);}
 function fly(){camera.position.set(.06,1.60,4.8);controls.target.set(-.15,1.22,-1.3);camera.lookAt(controls.target);canvas.dataset.flight='running';animateTo(views.room.position,views.room.target,matchMedia('(prefers-reduced-motion: reduce)').matches?1:6500,()=>{canvas.dataset.flight='ended';onFlightEnd();});}
 function resize(){const bounds=canvas.parentElement.getBoundingClientRect();renderer.setSize(bounds.width,bounds.height,false);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix();dirty=true;}
 new ResizeObserver(resize).observe(canvas.parentElement);resize();camera.lookAt(controls.target);
 function renderFrame(now){if(disposed)return;animation=requestAnimationFrame(renderFrame);if(document.hidden)return;if(tween){dirty=true;const a=Math.min(1,(now-tween.start)/tween.duration),t=a*a*(3-2*a);camera.position.lerpVectors(tween.from,tween.to,t);controls.target.lerpVectors(tween.fromTarget,tween.toTarget,t);camera.lookAt(controls.target);if(a===1){const finish=tween.finish;tween=null;controls.enabled=true;finish?.();}}const moved=controls.update();if(dirty||moved){renderer.render(scene,camera);dirty=false;}}
 animation=requestAnimationFrame(renderFrame);
 return {setSurface,fly,view,skip(){view('room',true);canvas.dataset.flight='ended';onFlightEnd();},save(){renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.download='yabis-bad-entwurf.png';a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');},dispose(){disposed=true;cancelAnimationFrame(animation);renderer.dispose();controls.dispose();envTarget.dispose();}};
}
