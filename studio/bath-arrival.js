/* Keep the window's dark frame visible until the real selection is painted. */
(() => {
 'use strict';
 const key='yabis-bath-window-arrival';
 let started=0;
 try{
  started=Number(sessionStorage.getItem(key));
  if(started)sessionStorage.removeItem(key);
 }catch{}
 if(!started||Date.now()-started>4000||new URLSearchParams(location.search).get('raum')!=='bad'
  ||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const root=document.documentElement;
 const reveal=()=>root.classList.add('bath-arrival-ready');
 root.classList.add('bath-arrival');
 const failsafe=setTimeout(reveal,2600);
 window.addEventListener('yabis-bath-ready',()=>{
  clearTimeout(failsafe);
  requestAnimationFrame(()=>requestAnimationFrame(reveal));
 },{once:true});
})();
