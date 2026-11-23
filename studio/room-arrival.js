/* Carry the end of the window flight until the selected room is painted. */
(() => {
 'use strict';
 const key='yabis-room-window-arrival';
 let arrival;
 try{
  const marker=sessionStorage.getItem(key);
  if(marker){
   sessionStorage.removeItem(key);
   arrival=JSON.parse(marker);
  }
 }catch{}
 const id=new URLSearchParams(location.search).get('raum');
 if(!arrival||arrival.id!==id||!['bad','wohnen','balkon','treppe','kueche','eingang'].includes(id)
  ||!Number.isFinite(arrival.started)||Math.abs(Date.now()-arrival.started)>4000
  ||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const root=document.documentElement;
 const reveal=()=>root.classList.add('room-arrival-ready');
 root.classList.add('room-arrival');
 if(Number.isInteger(arrival.still)&&arrival.still>0){
  root.classList.add('room-arrival--still');
  const hasFrame=typeof arrival.frame==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(arrival.frame);
  const url=hasFrame?arrival.frame:`../assets/studio/${id}-fensterfahrt-glas.webp?v=${arrival.still}`;
  const glass=new Image();
  glass.src=url;
  root.style.setProperty('--room-arrival-glass',`url("${url}")`);
 }
 const failsafe=setTimeout(reveal,2600);
 window.addEventListener('yabis-room-ready',()=>{
  clearTimeout(failsafe);
  requestAnimationFrame(()=>requestAnimationFrame(reveal));
 },{once:true});
})();
