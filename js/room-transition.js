/* Short, optional entry transition. A real approved clip can replace the image fade. */
(() => {
 'use strict';
 const C=window.YabisStudio;if(!C)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const clips=Object.freeze({bad:null}); // Local MP4 only after visual approval; never call an AI service here.
 const focus={bad:'72% 40%',wohnen:'40% 64%',balkon:'37% 44%',kueche:'71% 59%',treppe:'58% 46%',eingang:'61% 79%'};
 let active=null;
 const poster=id=>id==='bad'?'assets/studio/bad-basis.webp':C.plate(id,C.materials[0]);
 function stop(){if(!active)return;const {dialog,timers,animations,video}=active;active=null;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());if(video){video.pause();video.removeAttribute('src');video.load();}if(dialog.open)dialog.close();dialog.remove();}
 function enter(link){
  if(active)return;
  const id=C.roomId(link.dataset.studioEntry),dialog=document.createElement('dialog'),scene=document.createElement('div'),house=new Image(),destination=new Image(),caption=document.createElement('p'),skip=document.createElement('button');
  dialog.className='room-entry';dialog.setAttribute('aria-label','Raumstudio '+C.rooms[id].name+' öffnen');scene.className='room-entry-scene';house.className='room-entry-house';destination.className='room-entry-destination';
  house.src=document.getElementById('house-image')?.currentSrc||'assets/website/haus-raumwelten-isometrisch.webp';house.alt='';house.style.transformOrigin=focus[id];
  destination.src=poster(id);destination.alt='';caption.textContent='Ihr Raumstudio / '+C.rooms[id].name;skip.type='button';skip.textContent='Direkt zum Raum';skip.className='room-entry-skip';
  scene.append(house,destination);dialog.append(scene,caption,skip);document.body.append(dialog);
  const run={dialog,timers:[],animations:[],video:null,finish:null};active=run;
  const finish=()=>{if(active!==run)return;stop();location.assign(link.href);};
  run.finish=finish;
  const later=(fn,delay)=>run.timers.push(setTimeout(()=>{if(active===run)fn();},delay));
  skip.addEventListener('click',finish);dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
  dialog.showModal();
  if(clips[id]){
   const video=document.createElement('video');run.video=video;video.className='room-entry-video';video.muted=true;video.playsInline=true;video.preload='auto';video.src=clips[id];scene.append(video);
   video.addEventListener('ended',finish,{once:true});video.addEventListener('error',finish,{once:true});video.play().catch(finish);later(finish,4200);return;
  }
  // This is a zoom and crossfade, not a generated camera flight.
  if(typeof house.animate==='function')run.animations.push(house.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.55)',opacity:0}],{duration:1000,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}));
  destination.decode().then(()=>{if(active!==run)return;later(()=>{destination.style.opacity='1';},200);}).catch(finish);
  later(finish,1350);
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-studio-entry]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
  if(!C.motionAllowed({reduced:motion.matches,saveData:!!navigator.connection?.saveData}))return;
  event.preventDefault();enter(link);
 });
 motion.addEventListener('change',()=>{if(active&&motion.matches)active.finish();});
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',stop);
})();
