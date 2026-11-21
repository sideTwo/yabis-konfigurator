/* Short, optional entry transitions. */
(() => {
 'use strict';
 const C=window.YabisStudio;if(!C)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const focus={bad:'72% 40%',wohnen:'40% 64%',balkon:'37% 44%',kueche:'71% 59%',treppe:'58% 46%',eingang:'61% 79%'};
 const arrivalKey='yabis-bath-window-arrival';
 const bathGlass=[[1025,372],[1141,324],[1141,421],[1025,470]];
 const houseWidth=1448,houseHeight=1086;
 let active=null, bathClip=null;
 const poster=id=>id==='bad'?C.bathAssets.poster:id==='treppe'||id==='eingang'?C.scenePhoto(id):C.plate(id,C.materials[0]);
 function stop(){if(!active)return;const {dialog,timers,animations,stopVideo}=active;active=null;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());stopVideo?.();if(dialog.open)dialog.close();dialog.remove();}
 function flyToBath(run,scene,hero,rect,later,finish){
  const camera=document.createElement('div'),scrim=document.createElement('div'),glass=document.createElement('div'),veil=document.createElement('div'),photo=new Image();
  run.dialog.classList.add('room-entry--window');
  scrim.className='room-entry-scrim';camera.className='room-entry-camera';
  glass.className='room-entry-glass';veil.className='room-entry-veil';
  photo.src=hero.currentSrc||hero.src;photo.alt='';
  glass.style.clipPath='polygon('+bathGlass.map(([x,y])=>x/houseWidth*100+'% '+y/houseHeight*100+'%').join(',')+')';
  Object.assign(camera.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
  camera.append(photo,glass);scene.replaceChildren(scrim,camera,veil);
  const w=scene.clientWidth,h=scene.clientHeight;
  const glassWidth=rect.width*116/houseWidth,glassHeight=rect.height*98/houseHeight;
  const coverWidth=w/glassWidth,coverHeight=h/glassHeight;
  const close=Math.max(coverWidth,coverHeight)*1.12;
  const centerX=rect.width*1083/houseWidth,centerY=rect.height*397/houseHeight;
  const correction=rect.height/houseHeight/(rect.width/houseWidth)*48/116;
  const at=(scale,turn,x,y)=>{
   const skew=correction*turn;
   return `matrix(${scale},${scale*skew},0,${scale},${w*x-rect.left-scale*centerX},${h*y-rect.top-scale*(centerY+skew*centerX)})`;
  };
  // Match the first clip frame, where the glass is 50.4% of a 4:3 image.
  const front=Math.max(w,h*houseWidth/houseHeight)/glassWidth*.504;
  const approachScale=front*.96;
  // Keep the roof above the viewport before rectifying the window plane.
  const roofGap=rect.height*113/houseHeight;
  const approachY=Math.min(.5,(approachScale*roofGap-correction*w/2-10)/h);
  const startingFrame={transform:'matrix(1,0,0,1,0,0)',easing:'cubic-bezier(.28,.10,.42,.95)'};
  const facadeFrame={transform:at(approachScale,0,.5,approachY),easing:'cubic-bezier(.25,.55,.45,1)'};
  const frontFrame={transform:at(front,1,.5,.5)};
  const duration=1880;
  const animate=(element,frames,length=duration)=>{
   const motion=element.animate(frames,{duration:length,fill:'forwards'});
   run.animations.push(motion);return motion;
  };
  if(bathClip?.readyState>=2){
   const video=bathClip;
   const alignment=450;
   video.className='room-entry-video';video.currentTime=0;
   scene.insertBefore(video,veil);
   run.dialog.classList.add('room-entry--film');
   animate(scrim,[{opacity:0},{opacity:1,offset:.72},{opacity:1}],alignment);
   animate(glass,[{opacity:0},{opacity:.46}],alignment);
   const movement=animate(camera,[
    startingFrame,
    {...facadeFrame,offset:.62},
    frontFrame
   ],alignment);
   let fading=false;
   const blend=()=>{
    if(active!==run||fading)return;
    fading=true;
    animate(veil,[{opacity:0},{opacity:1}],120).finished.then(()=>finish(true),()=>{});
   };
   const show=()=>{
    animate(video,[{opacity:0},{opacity:1}],90);
    later(blend,Math.max(0,video.duration*1000-120));
   };
   video.addEventListener('playing',show,{once:true});
   video.addEventListener('ended',blend,{once:true});
   run.stopVideo=()=>{
    video.pause();
    video.removeEventListener('playing',show);
    video.removeEventListener('ended',blend);
   };
   movement.finished.then(()=>{
    if(active!==run)return;
    video.play().catch(blend);
    later(blend,1450);
   },()=>{});
   return;
  }
  animate(scrim,[{opacity:0},{opacity:1,offset:.24},{opacity:1}]);
  animate(glass,[{opacity:0},{opacity:.16,offset:.46},{opacity:.64,offset:.73},{opacity:.94,offset:.91},{opacity:1}]);
  animate(veil,[{opacity:0},{opacity:0,offset:.77},{opacity:1,offset:.96},{opacity:1}]);
  const movement=animate(camera,[
   startingFrame,
   {...facadeFrame,offset:.40},
   {...frontFrame,offset:.63,easing:'cubic-bezier(.23,.16,.52,1)'},
   {transform:at(close,1,.5,.5)}
  ]);
  movement.finished.then(()=>finish(true),()=>{});
  later(()=>finish(true),duration+170);
 }
 function enter(link){
  if(active)return;
  const id=C.roomId(link.dataset.studioEntry),dialog=document.createElement('dialog'),scene=document.createElement('div'),caption=document.createElement('p'),skip=document.createElement('button');
  const hero=document.getElementById('house-image');
  const rect=id==='bad'&&hero?.naturalWidth?hero.getBoundingClientRect():null;
  dialog.className='room-entry';dialog.setAttribute('aria-label','Raumstudio '+C.rooms[id].name+' öffnen');scene.className='room-entry-scene';
  caption.textContent='Ihr Raumstudio / '+C.rooms[id].name;skip.type='button';skip.textContent='Direkt zum Raum';skip.className='room-entry-skip';
  dialog.append(scene,caption,skip);document.body.append(dialog);
  const run={dialog,timers:[],animations:[],finish:null};active=run;
  const finish=(fromWindow=false)=>{
   if(active!==run||run.navigating)return;
   if(fromWindow){
    run.navigating=true;
    try{sessionStorage.setItem(arrivalKey,String(Date.now()));}catch{}
   }else stop();
   location.assign(link.href);
  };
  run.finish=()=>finish();
  const later=(fn,delay)=>run.timers.push(setTimeout(()=>{if(active===run)fn();},delay));
  skip.addEventListener('click',run.finish);dialog.addEventListener('cancel',event=>{event.preventDefault();run.finish();});
  dialog.showModal();
  if(rect?.width>0&&rect.height>0&&typeof scene.animate==='function'){
   flyToBath(run,scene,hero,rect,later,finish);return;
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
 function warmBathClip(){
  if(bathClip||!window.HTMLVideoElement||!C.motionAllowed({reduced:motion.matches,saveData:!!navigator.connection?.saveData}))return;
  bathClip=document.createElement('video');
  bathClip.muted=true;bathClip.playsInline=true;bathClip.preload='auto';
  bathClip.setAttribute('aria-hidden','true');
  bathClip.src='assets/studio/bad-fensterfahrt.mp4?v=2';
 }
 if(window.HTMLVideoElement){
  if(window.requestIdleCallback)window.requestIdleCallback(warmBathClip,{timeout:450});
  else setTimeout(warmBathClip,160);
 }
 motion.addEventListener('change',()=>{if(motion.matches)active?.finish();else warmBathClip();});
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',stop);
})();
