/* Short, optional entry transitions. */
(() => {
 'use strict';
 const C=window.YabisStudio;if(!C)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const focus={bad:'72% 40%',wohnen:'40% 64%',balkon:'37% 44%',kueche:'71% 59%',treppe:'58% 46%',eingang:'61% 79%'};
 const arrivalKey='yabis-room-window-arrival';
 const entries={
  bad:{film:6,still:4,pane:[[1025,372],[1141,324],[1141,421],[1025,470]],size:[116,98],center:[1083,397],rise:48,roofGap:113},
  wohnen:{film:3,still:3,pane:[[445,583],[546,624],[546,789],[445,748]],size:[101,165],center:[496,686],rise:-41,roofGap:248},
  balkon:{film:4,still:4,pane:[[475,468],[593,516],[593,617],[475,573]],size:[118,104],center:[534,542],rise:-48,roofGap:182},
  treppe:{film:4,still:4,pane:[[841,344],[900,369],[900,607],[841,580]],size:[59,237],center:[871,475],rise:-26,roofGap:155},
  kueche:{film:1,still:1,pane:[[1018,612],[1135,562],[1135,666],[1018,720]],size:[117,106],center:[1076,640],rise:50,roofGap:310},
  eingang:{film:1,still:1}
 };
 const houseWidth=1448,houseHeight=1086;
 const films=new Map(),stills=new Map();
 let active=null;
 const poster=id=>id==='bad'?C.bathAssets.poster:id==='treppe'||id==='eingang'?C.scenePhoto(id):C.plate(id,C.materials[0]);
 function stop(){if(!active)return;const {dialog,timers,animations,stopVideo}=active;active=null;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());stopVideo?.();if(dialog.open)dialog.close();dialog.remove();}
 function playEntry(run,scene,hero,rect,later,finish){
  const id=run.room,config=entries[id];
  const camera=document.createElement('div'),scrim=document.createElement('div'),veil=document.createElement('div'),photo=new Image();
  run.dialog.classList.add('room-entry--window');
  scrim.className='room-entry-scrim';camera.className='room-entry-camera';
  veil.className='room-entry-veil';
  photo.src=hero.currentSrc||hero.src;photo.alt='';
  Object.assign(camera.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
  camera.append(photo);scene.replaceChildren(scrim,camera,veil);
  const w=scene.clientWidth,h=scene.clientHeight;
  const duration=1880;
  const animate=(element,frames,length=duration)=>{
   const motion=element.animate(frames,{duration:length,fill:'forwards'});
   run.animations.push(motion);return motion;
  };
  const finishUnderVeil=()=>{
   animate(veil,[{opacity:0},{opacity:1}],160).finished.then(()=>finish('dark'),()=>{});
  };
  const fallback=()=>{
   if(!config.pane){finishUnderVeil();later(()=>finish('dark'),330);return;}
   const glass=document.createElement('div');glass.className='room-entry-glass';
   glass.style.clipPath='polygon('+config.pane.map(([x,y])=>x/houseWidth*100+'% '+y/houseHeight*100+'%').join(',')+')';
   camera.append(glass);
   const glassWidth=rect.width*config.size[0]/houseWidth,glassHeight=rect.height*config.size[1]/houseHeight;
   const coverWidth=w/glassWidth,coverHeight=h/glassHeight;
   const close=Math.max(coverWidth,coverHeight)*1.12;
   const centerX=rect.width*config.center[0]/houseWidth,centerY=rect.height*config.center[1]/houseHeight;
   const correction=rect.height/houseHeight/(rect.width/houseWidth)*config.rise/config.size[0];
   const at=(scale,turn,x,y)=>{
    const skew=correction*turn;
    return `matrix(${scale},${scale*skew},0,${scale},${w*x-rect.left-scale*centerX},${h*y-rect.top-scale*(centerY+skew*centerX)})`;
   };
   // Align the window plane during the motion fallback.
   const front=Math.max(w,h*houseWidth/houseHeight)/glassWidth*.504;
   const approachScale=front*.96;
   // Keep the roof above the viewport before rectifying the window plane.
   const roofGap=rect.height*config.roofGap/houseHeight;
   const approachY=Math.min(.5,(approachScale*roofGap-Math.abs(correction)*w/2-10)/h);
   const startingFrame={transform:'matrix(1,0,0,1,0,0)',easing:'cubic-bezier(.28,.10,.42,.95)'};
   const facadeFrame={transform:at(approachScale,0,.5,approachY),easing:'cubic-bezier(.25,.55,.45,1)'};
   const frontFrame={transform:at(front,1,.5,.5)};
   animate(scrim,[{opacity:0},{opacity:1,offset:.24},{opacity:1}]);
   animate(glass,[{opacity:0},{opacity:.16,offset:.46},{opacity:.64,offset:.73},{opacity:.94,offset:.91},{opacity:1}]);
   animate(veil,[{opacity:0},{opacity:0,offset:.77},{opacity:1,offset:.96},{opacity:1}]);
   const movement=animate(camera,[
    startingFrame,
    {...facadeFrame,offset:.40},
    {...frontFrame,offset:.63,easing:'cubic-bezier(.23,.16,.52,1)'},
    {transform:at(close,1,.5,.5)}
   ]);
   movement.finished.then(()=>finish('dark'),()=>{});
   later(()=>finish('dark'),duration+170);
  };
  const video=warmClip(id);
  if(!video||video.error){fallback();return;}
  const glassStill=warmStill(id,config.still);
  const containFilm=h>=w;
  const filmHeight=containFilm?Math.min(h,w*9/16):Math.max(h,w*9/16);
  const filmWidth=filmHeight*16/9;
  const startScale=rect.height/filmHeight;
  const x=rect.left+(rect.width-w)/2,y=rect.top+(rect.height-h)/2;
  video.className='room-entry-video';
  Object.assign(video.style,{width:filmWidth+'px',height:filmHeight+'px',left:(w-filmWidth)/2+'px',top:(h-filmHeight)/2+'px'});
  scene.insertBefore(video,veil);
  run.dialog.classList.add('room-entry--film');
  let started=false,completed=false;
  const failed=()=>{
   if(active!==run||completed)return;
   completed=true;
   if(started){finishUnderVeil();return;}
   run.stopVideo();
   video.remove();
   run.dialog.classList.remove('room-entry--film');
   fallback();
  };
  const ended=()=>{
   if(active!==run||completed)return;
   completed=true;
   if(glassStill.complete&&glassStill.naturalWidth)finish('glass');
   else finishUnderVeil();
  };
  const playing=()=>{
   started=true;
   const length=Number.isFinite(video.duration)?video.duration*1000:2300;
   animate(camera,[{opacity:1},{opacity:0}],310);
   animate(scrim,[{opacity:0},{opacity:1,offset:.10},{opacity:1}],length);
   animate(video,[
    {transform:`translate(${x}px,${y}px) scale(${startScale})`,opacity:0,easing:'ease-out'},
    {transform:'scale(1)',opacity:1,offset:.12},
    {transform:'scale(1)',opacity:1}
   ],length);
   later(failed,length+900);
  };
  video.addEventListener('playing',playing,{once:true});
  video.addEventListener('ended',ended,{once:true});
  video.addEventListener('error',failed,{once:true});
  run.stopVideo=()=>{
   video.pause();
   video.removeEventListener('playing',playing);
   video.removeEventListener('ended',ended);
   video.removeEventListener('error',failed);
  };
  video.currentTime=0;
  video.preload='auto';
  video.play().catch(failed);
  later(()=>{if(!started)failed();},850);
 }
 function enter(link){
  if(active)return;
  const id=C.roomId(link.dataset.studioEntry),dialog=document.createElement('dialog'),scene=document.createElement('div'),caption=document.createElement('p'),skip=document.createElement('button');
  const hero=document.getElementById('house-image');
  const rect=Object.hasOwn(entries,id)&&hero?.naturalWidth?hero.getBoundingClientRect():null;
  dialog.className='room-entry';dialog.setAttribute('aria-label','Raumstudio '+C.rooms[id].name+' öffnen');scene.className='room-entry-scene';
  caption.textContent='Ihr Raumstudio / '+C.rooms[id].name;skip.type='button';skip.textContent='Direkt zum Raum';skip.className='room-entry-skip';
  dialog.append(scene,caption,skip);document.body.append(dialog);
  const run={room:id,dialog,timers:[],animations:[],finish:null};active=run;
  const finish=arrival=>{
   if(active!==run||run.navigating)return;
   if(arrival){
    run.navigating=true;
    const marker={id,started:Date.now(),still:arrival==='glass'?entries[id].still:null};
    const frame=arrival==='glass'?stills.get(id)?.src:null;
    if(frame?.startsWith('data:image/webp;base64,')){
     try{sessionStorage.setItem(arrivalKey,JSON.stringify({...marker,frame}));}
     catch{try{sessionStorage.setItem(arrivalKey,JSON.stringify(marker));}catch{}}
    }else try{sessionStorage.setItem(arrivalKey,JSON.stringify(marker));}catch{}
   }else stop();
   location.assign(link.href);
  };
  run.finish=()=>finish();
  const later=(fn,delay)=>run.timers.push(setTimeout(()=>{if(active===run)fn();},delay));
  skip.addEventListener('click',run.finish);dialog.addEventListener('cancel',event=>{event.preventDefault();run.finish();});
  dialog.showModal();
  if(rect?.width>0&&rect.height>0&&typeof scene.animate==='function'){
   playEntry(run,scene,hero,rect,later,finish);return;
  }
  const house=new Image(),destination=new Image();
  house.className='room-entry-house';destination.className='room-entry-destination';
  house.src=hero?.currentSrc||'assets/website/haus-raumwelten-og.webp';house.alt='';house.style.transformOrigin=focus[id];
  destination.src=poster(id);destination.alt='';scene.append(house,destination);
  if(typeof house.animate==='function')run.animations.push(house.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.55)',opacity:0}],{duration:1000,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}));
  destination.decode().then(()=>{if(active!==run)return;later(()=>{destination.style.opacity='1';},200);}).catch(run.finish);
  later(finish,1350);
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-studio-entry]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
  if(!C.motionAllowed({reduced:motion.matches,saveData:!!navigator.connection?.saveData}))return;
  event.preventDefault();enter(link);
 });
 function warmStill(id,version){
  if(stills.has(id))return stills.get(id);
  const image=new Image();
  const file=`assets/studio/${id}-fensterfahrt-glas.webp?v=${version}`;
  const useFile=()=>{image.src=file;};
  if(window.fetch&&window.FileReader){
   fetch(file).then(response=>{
    if(!response.ok)throw Error('Could not load the arrival frame');
    return response.blob();
   }).then(blob=>{
    const reader=new FileReader();
    reader.onload=()=>{
     const data=String(reader.result);
     image.src='data:image/webp;base64,'+data.slice(data.indexOf(',')+1);
    };
    reader.onerror=useFile;
    reader.readAsDataURL(blob);
   }).catch(useFile);
  }else useFile();
  stills.set(id,image);
  return image;
 }
 function warmClip(id){
  if(!window.HTMLVideoElement||!C.motionAllowed({reduced:motion.matches,saveData:!!navigator.connection?.saveData}))return;
  if(films.has(id))return films.get(id);
  const video=document.createElement('video');
  video.muted=true;video.playsInline=true;video.preload='metadata';
  video.setAttribute('aria-hidden','true');
  video.src=`assets/studio/${id}-fensterfahrt.mp4?v=${entries[id].film}`;
  films.set(id,video);
  return video;
 }
 const warmBathClip=()=>warmClip('bad');
 if(window.HTMLVideoElement){
  if(window.requestIdleCallback)window.requestIdleCallback(warmBathClip,{timeout:450});
  else setTimeout(warmBathClip,160);
 }
 motion.addEventListener('change',()=>{if(motion.matches)active?.finish();else warmBathClip();});
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',stop);
})();
