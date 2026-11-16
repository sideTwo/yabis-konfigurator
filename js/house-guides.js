(()=>{
 'use strict';
 const map=document.getElementById('house-map');
 if(!map)return;
 const svg=map.querySelector('.room-guides');
 if(!svg)return;
 const rooms=[
  ['balkon',.374,.441,'left'],
  ['wohnen',.399,.643,'left'],
  ['bad',.718,.4,'right'],
  ['treppe',.584,.459,'right'],
  ['kueche',.71,.592,'right'],
  ['eingang',.61,.79,'right']
 ];
 let frame=0;
 function draw(){
  frame=0;
  const box=map.getBoundingClientRect();
  if(!box.width||!box.height)return;
  svg.setAttribute('viewBox','0 0 '+box.width+' '+box.height);
  for(const [id,x,y,side] of rooms){
   const label=map.querySelector('.spot-'+id),line=svg.querySelector('.guide-'+id);
   if(!label||!line)continue;
   const r=label.getBoundingClientRect(),left=side==='left';
   const start=left?r.left-box.left:r.right-box.left;
   const bottom=r.bottom-box.top-8;
   const elbow=left?Math.max(r.right-box.left+12,box.width*.19):Math.min(r.left-box.left-12,box.width*.84);
   line.setAttribute('d','M '+start+' '+bottom+' H '+elbow+' L '+box.width*x+' '+box.height*y);
  }
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
 new ResizeObserver(schedule).observe(map);
 if(document.fonts)document.fonts.ready.then(schedule);
 schedule();
})();
