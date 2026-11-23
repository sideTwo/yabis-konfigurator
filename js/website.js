(()=>{
 'use strict';const $=id=>document.getElementById(id),core=window.YabisWebsite,S=window.YabisShop,form=$('project-form');
 const menu=$('mobile-menu'),preview=$('request-preview');
 $('open-menu').onclick=()=>menu.showModal();$('close-menu').onclick=()=>menu.close();
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
 for(const d of [menu,preview])d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
 $('close-preview').onclick=()=>preview.close();
 const photo=$('room-photo'),picture=$('room-picture'),motion=matchMedia('(prefers-reduced-motion: reduce)');

 const showroomVideo = $("showroom-video");
 const showroomButton = $("showroom-playback");
 if (showroomVideo && showroomButton) {
  let inView = false;
  let playback = "auto";
  const saveData = navigator.connection?.saveData;

  function showPlaybackState() {
   if (showroomVideo.error) return;
   const playing = !showroomVideo.paused;
   showroomButton.toggleAttribute("data-playing", playing);
   const action = playing ? "pausieren" : "abspielen";
   showroomButton.setAttribute("aria-label", "Video der Ausstellung " + action);
  }

  function playShowroom() {
   if (!showroomVideo.hasAttribute("src")) showroomVideo.src = showroomVideo.dataset.src;
   showroomVideo.muted = true;
   showroomVideo.play().catch(showPlaybackState);
  }

  function syncShowroom() {
   if (!inView || document.hidden || playback === "paused") {
    showroomVideo.pause();
   } else if (!showroomVideo.error &&
     (playback === "manual" || (!motion.matches && !saveData))) {
    playShowroom();
   }
  }

  showroomButton.hidden = false;
  showroomButton.addEventListener("click", () => {
   if (showroomVideo.paused) {
    playback = "manual";
    playShowroom();
   } else {
    playback = "paused";
    showroomVideo.pause();
   }
  });
  for (const event of ["play", "pause"]) {
   showroomVideo.addEventListener(event, showPlaybackState);
  }
  showroomVideo.addEventListener("playing", () => showroomVideo.toggleAttribute("data-ready", true));
  showroomVideo.addEventListener("error", () => {
   showroomVideo.removeAttribute("data-ready");
   showroomButton.disabled = true;
   showroomButton.setAttribute("aria-label", "Video der Ausstellung nicht verfügbar");
  });
  document.addEventListener("visibilitychange", () => {
   if (document.hidden) showroomVideo.pause();
   else if (inView) syncShowroom();
  });
  motion.addEventListener("change", () => {
   if (motion.matches) {
    if (playback === "manual") playback = "paused";
    showroomVideo.pause();
   } else {
    syncShowroom();
   }
  });
  if ("IntersectionObserver" in window) {
   new IntersectionObserver(([entry]) => {
    inView = entry.intersectionRatio >= 0.35;
    syncShowroom();
   }, { threshold: 0.35 }).observe($("ausstellung"));
  }
 }

 let imageRequest=0,imageFade=null,outgoingPhoto=null;
 function finishImageFade(){
  if(imageFade){imageFade.cancel();imageFade=null;}
  if(outgoingPhoto){outgoingPhoto.remove();outgoingPhoto=null;}
 }
 motion.addEventListener('change',finishImageFade);
 async function showRoomImage(room){
  const request=++imageRequest;
  finishImageFade();$('room-image-status').textContent='';
  if(photo.src===new URL(room.image,document.baseURI).href){photo.alt=room.alt;photo.dataset.focus=room.focus||'';picture.setAttribute('aria-busy','false');return;}
  picture.setAttribute('aria-busy','true');
  const next=new Image();next.decoding='async';next.src=room.image;
  try{await next.decode();}
  catch{
   if(request===imageRequest){picture.setAttribute('aria-busy','false');$('room-image-status').textContent='Die Ansicht für '+room.name+' konnte nicht geladen werden. Die vorherige Ansicht bleibt sichtbar.';}
   return;
  }
  // A slow earlier image must never replace the room most recently selected.
  if(request!==imageRequest)return;
  if(!motion.matches&&typeof photo.animate==='function'){
   outgoingPhoto=photo.cloneNode();outgoingPhoto.removeAttribute('id');outgoingPhoto.alt='';
   outgoingPhoto.setAttribute('aria-hidden','true');outgoingPhoto.className='room-photo-previous';outgoingPhoto.loading='eager';
   photo.before(outgoingPhoto);
  }
  photo.src=next.src;photo.alt=room.alt;photo.dataset.focus=room.focus||'';picture.setAttribute('aria-busy','false');
  if(outgoingPhoto){
   imageFade=photo.animate([{opacity:0},{opacity:1}],{duration:420,easing:'cubic-bezier(.2,.65,.25,1)'});
   imageFade.finished.then(()=>{if(request===imageRequest)finishImageFade();}).catch(()=>{});
  }
 }
 function showRoom(id){
  const room=core.rooms[id];if(!room)return;
  document.querySelectorAll('[data-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===id)));
  showRoomImage(room);
  $('room-title').textContent=room.title;$('room-kicker').textContent=room.kicker;$('room-copy').textContent=room.copy;
  $('room-action').href=window.YabisStudio.href(id);
  const configurable=window.YabisStudio.materialsFor(id).length>0;
  $('room-action-label').textContent=configurable?'Im Raumstudio gestalten':'Zum Außenbereich';
  $('room-availability').textContent=configurable?'Muster, Farben und Eignung am Original prüfen.':'Naturstein für Ihren Außenbereich individuell anfragen.';
  form.elements.room.value=id;
 }
 document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>showRoom(b.dataset.room));
 const incoming=new URLSearchParams(location.search);showRoom(core.rooms[incoming.get('raum')]?incoming.get('raum'):'bad');if(incoming.get('idee'))form.elements.message.value=incoming.get('idee').slice(0,2000);
 function customer(){const trade=form.elements.customerType.value==='trade';$('company-field').hidden=!trade;form.elements.company.disabled=!trade;}
 form.elements.customerType.addEventListener('change',customer);customer();
 $('trade-request').onclick=()=>{form.elements.customerType.value='trade';form.elements.room.value='mehrere';customer();$('kontakt').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 function delivery(){const yes=form.elements.delivery.value==='delivery';$('delivery-address').hidden=!yes;for(const name of ['postcode','city','address']){form.elements[name].disabled=!yes;form.elements[name].required=yes&&name!=='address';}}
 form.querySelectorAll('[name=delivery]').forEach(i=>i.addEventListener('change',delivery));delivery();
 function cart(){const n=S.getCart().length;document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=n);$('cart-inquiry-note').hidden=!n;$('cart-inquiry-note').textContent=n+' Position(en) aus Ihrem Anfragekorb werden in die Zusammenfassung übernommen.';}
 cart();addEventListener('storage',e=>{if(e.key===S.key)cart();});addEventListener('pageshow',cart);
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;try{const text=core.inquiry(Object.fromEntries(new FormData(form)),S.lines(S.getCart()));$('request-text').value=text;$('request-whatsapp').href='https://wa.me/491786787724?text='+encodeURIComponent(text);$('request-email').href='mailto:info@yabisfliesenwelt.de?subject='+encodeURIComponent('Projektanfrage – Yabis Fliesenwelt')+'&body='+encodeURIComponent(text);$('form-status').textContent='Ihre Anfrage ist vorbereitet. Bitte prüfen und selbst versenden.';preview.showModal();}catch(error){$('form-status').textContent=error.message;}};
 $('save-request').onclick=()=>S.download($('request-text').value,'yabis-projektanfrage.txt');$('year').textContent=new Date().getFullYear();
})();
