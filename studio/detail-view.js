/* Inspect the current render, never a separate material photo. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),button=$('enlarge-view'),dialog=$('detail-view'),source=$('room-preview'),canvas=$('detail-canvas'),viewport=$('detail-viewport');
 if(typeof dialog.showModal!=='function'){button.hidden=true;return;}
 let zoom=1,renderedWidth=0,renderedHeight=0;
 function size(next=zoom){
  if(!dialog.open)return;
  const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;
  const centerX=(viewport.scrollLeft+w/2)/Math.max(w,renderedWidth),centerY=(viewport.scrollTop+h/2)/Math.max(h,renderedHeight);
  const fit=Math.min(Math.max(1,w-32)/canvas.width,Math.max(1,h-32)/canvas.height);
  zoom=Math.max(1,Math.min(3,next));renderedWidth=Math.round(canvas.width*fit*zoom);renderedHeight=Math.round(canvas.height*fit*zoom);
  canvas.style.width=renderedWidth+'px';canvas.style.height=renderedHeight+'px';
  $('detail-zoom').textContent=Math.round(zoom*100)+' %';$('detail-less').disabled=zoom===1;$('detail-more').disabled=zoom===3;
  viewport.scrollLeft=Math.max(0,centerX*Math.max(w,renderedWidth)-w/2);viewport.scrollTop=Math.max(0,centerY*Math.max(h,renderedHeight)-h/2);
 }
 button.addEventListener('click',()=>{
  if(button.disabled||source.hidden||!source.width||!source.height||dialog.open)return;
  canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.drawImage(source,0,0);canvas.setAttribute('aria-label',source.getAttribute('aria-label')||'Ihre aktuelle Fliesenkonfiguration');
  zoom=1;renderedWidth=renderedHeight=0;viewport.scrollLeft=viewport.scrollTop=0;
  dialog.showModal();size();
 });
 $('detail-more').addEventListener('click',()=>size(zoom+.5));$('detail-less').addEventListener('click',()=>size(zoom-.5));
 $('detail-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{canvas.width=canvas.height=0;button.focus();});
 window.addEventListener('resize',()=>size());
})();
