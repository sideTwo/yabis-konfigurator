(()=>{
 'use strict';const $=id=>document.getElementById(id),core=window.YabisWebsite,S=window.YabisShop,form=$('project-form');
 const menu=$('mobile-menu');
 $('open-menu').onclick=()=>menu.showModal();$('close-menu').onclick=()=>menu.close();
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
 menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)menu.close();}});
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
  // Raumwahl oben vorbelegen, solange der Besucher die Bereiche im Formular noch nicht selbst angeklickt hat
  if(!form.dataset.roomsTouched)form.querySelectorAll('[name="room[]"]').forEach(box=>box.checked=box.value===id);
 }
 form.querySelectorAll('[name="room[]"]').forEach(box=>box.addEventListener('change',()=>{form.dataset.roomsTouched='1';box.setCustomValidity('');}));
 document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>showRoom(b.dataset.room));
 const incoming=new URLSearchParams(location.search);showRoom(core.rooms[incoming.get('raum')]?incoming.get('raum'):'bad');if(incoming.get('idee'))form.elements.message.value=incoming.get('idee').slice(0,2000);
 /* Anfrage in drei Schritten. Ohne JavaScript stehen alle Schritte untereinander und das Formular geht direkt an kontakt.php. */
 const steps=[...form.querySelectorAll('[data-step]')],status=$('form-status'),files=$('anfrage-fotos'),fileNote=$('anfrage-dateien'),fileText=fileNote.textContent;
 const MAX_FILES=5,MAX_BYTES=20*1024*1024,FILE_TYPES=/^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;
 let step=1,sending=false;
 form.classList.add('anfrage-js');form.noValidate=true;form.elements.ts.value=Math.floor(Date.now()/1000);
 function showStep(n,focus=true){step=Math.max(1,Math.min(steps.length,n));steps.forEach(s=>s.hidden=Number(s.dataset.step)!==step);
  $('anfrage-schritt').querySelector('span').textContent=step;form.querySelectorAll('.anfrage-fortschritt span').forEach((b,i)=>b.classList.toggle('aktiv',i<step));
  $('anfrage-zurueck').hidden=step===1;$('anfrage-weiter').hidden=step===steps.length;$('anfrage-senden').hidden=step!==steps.length;$('anfrage-whatsapp').hidden=step!==steps.length;
  form.querySelector('.anfrage-body').scrollTop=0;if(focus){const legend=steps[step-1].querySelector('legend');legend.tabIndex=-1;legend.focus({preventScroll:true});if(form.getBoundingClientRect().top<0)form.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});}}
 function contactRules(){const reply=form.elements.reply.value,phone=reply!=='E-Mail',mail=reply==='E-Mail';
  form.elements.telefon.required=phone;form.elements.email.required=mail;
  form.querySelector('[data-optional=telefon]').hidden=phone;form.querySelector('[data-optional=email]').hidden=mail;}
 function filesOk(){const list=[...(files.files||[])];let error='';
  if(list.length>MAX_FILES)error='Bitte höchstens '+MAX_FILES+' Dateien anhängen.';
  else if(list.some(f=>f.type&&!FILE_TYPES.test(f.type)))error='Bitte nur Fotos (JPG, PNG, WebP, HEIC) oder PDF anhängen.';
  else if(list.reduce((a,f)=>a+f.size,0)>MAX_BYTES)error='Die Dateien sind zusammen größer als 20 MB. Bitte weniger oder kleinere Fotos wählen.';
  files.setCustomValidity(error);
  fileNote.textContent=error||(list.length?list.length+' Datei'+(list.length>1?'en':'')+': '+list.map(f=>f.name).join(', '):fileText);
  fileNote.classList.toggle('fehler',!!error);return !error;}
 function stepValid(n){if(n===1){const boxes=[...form.querySelectorAll('[name="room[]"]')];
   if(!boxes.some(b=>b.checked)){boxes[0].setCustomValidity('Bitte mindestens einen Bereich wählen.');boxes[0].reportValidity();return false;}
   boxes[0].setCustomValidity('');if(!filesOk()){files.reportValidity?.();return false;}}
  for(const el of steps[n-1].querySelectorAll('input,textarea,select')){if(!el.disabled&&!el.checkValidity()){el.reportValidity();return false;}}return true;}
 function allValid(){for(let n=1;n<=steps.length;n++){if(!stepValid(n)){showStep(n,false);stepValid(n);return false;}}return true;}
 function data(){const fd=new FormData(form),d=Object.fromEntries(fd);d.have=fd.getAll('have[]');d.room=fd.getAll('room[]');for(const k of ['have[]','room[]','fotos[]'])delete d[k];return d;}
 function cartLines(){try{return S.lines(S.getCart());}catch{return '';}}
 $('anfrage-weiter').onclick=()=>{if(stepValid(step)){status.textContent='';showStep(step+1);}};
 $('anfrage-zurueck').onclick=()=>{status.textContent='';showStep(step-1);};
 files.addEventListener('change',filesOk);
 form.querySelectorAll('[name=reply]').forEach(i=>i.addEventListener('change',contactRules));contactRules();
 $('trade-request').onclick=()=>{form.elements.customerType.value='trade';showStep(1,false);$('kontakt').scrollIntoView({behavior:motion.matches?'instant':'smooth'});};
 function delivery(){const yes=form.elements.delivery.value==='delivery';$('delivery-address').hidden=!yes;for(const name of ['postcode','city','address']){form.elements[name].disabled=!yes;form.elements[name].required=yes&&name!=='address';}}
 form.querySelectorAll('[name=delivery]').forEach(i=>i.addEventListener('change',delivery));delivery();
 function cart(){const n=S.getCart().length;document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=n);$('cart-inquiry-note').hidden=!n;$('cart-inquiry-note').textContent=n+' Position(en) aus Ihrem Anfragekorb werden mitgeschickt.';}
 cart();addEventListener('storage',e=>{if(e.key===S.key)cart();});addEventListener('pageshow',cart);
 function fail(text){status.className='anfrage-status fehler';status.textContent=text;}
 function done(text){form.classList.add('anfrage-fertig');const box=document.createElement('div');box.className='anfrage-danke';box.tabIndex=-1;
  const h=document.createElement('p');h.className='anfrage-danke-titel';h.textContent='Danke, Ihre Anfrage ist da.';const p=document.createElement('p');p.textContent=text||'Wir melden uns bei Ihnen.';
  box.append(h,p);form.querySelector('.anfrage-body').replaceWith(box);form.querySelector('.anfrage-fuss').remove();status.textContent='';box.focus();}
 form.onsubmit=async e=>{e.preventDefault();if(sending||!allValid())return;
  let text;try{text=core.inquiry(data(),cartLines());}catch(error){fail(error.message);return;}
  const body=new FormData(form);body.set('warenkorb',cartLines());
  sending=true;$('anfrage-senden').disabled=true;status.className='anfrage-status';status.textContent='Anfrage wird gesendet …';
  try{const res=await fetch(form.action,{method:'POST',body,headers:{'X-Requested-With':'fetch'},credentials:'same-origin'});
   const answer=await res.json().catch(()=>null);
   if(answer?.ok){done(answer.text);return;}
   fail(answer?.text||'Die Anfrage konnte gerade nicht gesendet werden. Senden Sie sie bitte per WhatsApp oder rufen Sie uns an: +49 178 678 77 24.');
  }catch{fail('Die Anfrage konnte gerade nicht gesendet werden. Senden Sie sie bitte per WhatsApp oder rufen Sie uns an: +49 178 678 77 24.');}
  finally{sending=false;const button=$('anfrage-senden');if(button)button.disabled=false;}
 };
 $('anfrage-whatsapp').onclick=()=>{
  if(!stepValid(1)){showStep(1,false);stepValid(1);return;}
  if(!form.elements.name.value.trim()){form.elements.name.reportValidity();return;}
  const d=data();if(!d.telefon&&!d.email)d.contact='per WhatsApp';
  let text;try{text=core.inquiry(d,cartLines());}catch(error){fail(error.message);return;}
  const n=(files.files||[]).length;
  window.open('https://wa.me/491786787724?text='+encodeURIComponent(text),'_blank','noopener');
  status.className='anfrage-status';status.textContent='WhatsApp ist geöffnet. Bitte dort absenden.'+(n?' Ihre '+n+' Datei'+(n>1?'en':'')+' hängen Sie im Chat direkt an.':'');};
 showStep(1,false);
 $('year').textContent=new Date().getFullYear();
})();
