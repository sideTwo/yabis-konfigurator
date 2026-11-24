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
 const reveal=()=>{
  root.classList.add('room-arrival-ready');
  // Nach der Ankunft Ebenen und will-change freigeben.
  setTimeout(()=>root.classList.remove('room-arrival','room-arrival--still','room-arrival-ready'),1000);
 };
 root.classList.add('room-arrival');
 if(Number.isInteger(arrival.still)&&arrival.still>0){
  root.classList.add('room-arrival--still');
  const hasFrame=typeof arrival.frame==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(arrival.frame);
  const url=hasFrame?arrival.frame:`../assets/studio/${id}-fensterfahrt-glas.webp?v=${arrival.still}`;
  const glass=new Image();
  glass.src=url;
  root.style.setProperty('--room-arrival-glass',`url("${url}")`);
  // Fenstermitte im Standbild (1440 × 810): Dort hinein fliegt die Kamera weiter.
  const pane={bad:[.497,.447],wohnen:[.6,.48],balkon:[.5,.5],kueche:[.5,.48],treppe:[.61,.51],eingang:[.54,.42]}[id];
  const w=innerWidth,h=innerHeight,portrait=matchMedia('(orientation: portrait)').matches;
  const scale=portrait?Math.min(w/1440,h/810):Math.max(w/1440,h/810);
  root.style.setProperty('--room-arrival-origin',`${Math.round(w/2+(pane[0]-.5)*1440*scale)}px ${Math.round(h/2+(pane[1]-.5)*810*scale)}px`);
 }
 const failsafe=setTimeout(reveal,2600);
 window.addEventListener('yabis-room-ready',()=>{
  clearTimeout(failsafe);
  requestAnimationFrame(()=>requestAnimationFrame(reveal));
 },{once:true});
})();
