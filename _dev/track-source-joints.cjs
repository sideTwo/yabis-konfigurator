// Measure the existing floor grout in every source frame. The display grid is
// independent; these coordinates are only used to remove the photographed grid.
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('konfigurator-neu/fugen-live.js','utf8');
const context={};vm.createContext(context);
vm.runInContext(code.slice(0,code.indexOf('const VS='))+'globalThis.geometry={planes,homography,interpolate};})();',context);
const {planes,homography,interpolate}=context.geometry;
const W=1920,H=1080,world=[[0,0],[60,0],[60,120],[0,120]];
const reference=homography(planes[0].quad.at(-1)[1],world);
const guides=[[[420,751],[947,763]],[[947,763],[1460,763]],[[420,938],[947,950]],[[947,950],[1460,950]],[[946,695],[947,1080]],[[795,695],[460,1080]],[[1094,695],[1424,1080]]];
const project=(m,[x,y])=>{let z=m[6]*x+m[7]*y+m[8];return[(m[0]*x+m[1]*y+m[2])/z,(m[3]*x+m[4]*y+m[5])/z];};
const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const results={};
const endForward=homography(world,planes[0].quad.at(-1)[1]);
// A third photographed row is visible near the entrance and leaves the image
// later in the flight. It was missing from the old cleanup entirely.
guides.push([[-120,252],[60,252]].map(p=>project(endForward,p)),[[60,252],[240,252]].map(p=>project(endForward,p)));
for(const [name,polarity] of [['marmor',1],['original',-1]]){
 const data=fs.readFileSync(`_dev/${name}-track.gray`),frames=data.length/(W*H),tracks=[];
 for(let frame=0;frame<frames;frame++){
  const time=Math.min(5,frame/24),offset=frame*W*H;
  const forward=homography(world,interpolate(planes[0].quad,time));
  const polygon=interpolate(planes[0].outline,time);
  function sample(x,y){x=Math.max(0,Math.min(W-2,x));y=Math.max(0,Math.min(H-2,y));const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,at=offset+iy*W+ix;return(data[at]*(1-fx)+data[at+1]*fx)*(1-fy)+(data[at+W]*(1-fx)+data[at+W+1]*fx)*fy;}
  const lines=guides.map((line,index)=>{
   let [a,b]=line.map(p=>project(forward,project(reference,p)));
   const start=a.slice(),delta=b.map((v,k)=>v-a[k]);
   if(index>=4&&index<=6){
    // Continue to the bottom of THIS frame, rather than ending where the
    // last frame's image boundary projects. The old code left foreground seams.
    a=[start[0]+delta[0]*(680-start[1])/delta[1],680];
    b=[start[0]+delta[0]*(1084-start[1])/delta[1],1084];
   }else{
    const left=Math.min(...polygon.map(p=>p[0]))-10,right=Math.max(...polygon.map(p=>p[0]))+10;
    const from=[0,2,7].includes(index)?left:start[0],to=[0,2,7].includes(index)?b[0]:right;
    a=[from,start[1]+delta[1]*(from-start[0])/delta[0]];
    b=[to,start[1]+delta[1]*(to-start[0])/delta[0]];
   }
   const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),normal=[-dy/length,dx/length];
   const points=[];
   const samples=Math.ceil(length/5);
   for(let k=2;k<samples-2;k++){
    const t=k/samples,x=a[0]+dx*t,y=a[1]+dy*t;
    if(x<10||x>W-10||y<10||y>H-10||!inside([x,y],polygon)||!inside([x+normal[0]*12,y+normal[1]*12],polygon)||!inside([x-normal[0]*12,y-normal[1]*12],polygon))continue;
    const scores=[];
    for(let d=-30;d<=30;d++){
     const px=x+normal[0]*d,py=y+normal[1]*d;
     const get=n=>sample(px+normal[0]*n,py+normal[1]*n);
     const center=(get(-.5)+get(.5))*.5;
     scores.push(Math.max(-10,Math.min(35,Math.abs((get(-5)+get(5))*.5-center))));
    }
    points.push({t,scores});
   }
   // Search a straight line across the whole surface; a marble vein crossing
   // one sample cannot pull the grout removal away from the actual seam.
   let best=-1e9,bestMid=0,bestSlope=0;
   for(let mid=-25;mid<=25;mid+=.5)for(let slope=-20;slope<=20;slope+=1){
    let score=0;
    for(const p of points){const at=mid+slope*(p.t-.5)+30;if(at<0||at>=60){score-=10;continue;}const k=Math.floor(at),f=at-k;score+=p.scores[k]*(1-f)+p.scores[k+1]*f;}
    score/=Math.max(1,points.length);score-=Math.abs(mid)*.008+Math.abs(slope)*.015;
    if(score>best){best=score;bestMid=mid;bestSlope=slope;}
   }
   if(points.length<6){bestMid=0;bestSlope=0;}
   return [a.map((v,k)=>v+normal[k]*(bestMid-bestSlope*.5)),b.map((v,k)=>v+normal[k]*(bestMid+bestSlope*.5))].flat().map(n=>+n.toFixed(2));
  });
  tracks.push(lines);
 }
 // The camera moves smoothly. Reject isolated ridge detections on veins, then
 // smooth subpixel measurement noise to keep the cleanup stable during playback.
 const median=tracks.map((lines,i)=>lines.map((line,j)=>line.map((value,k)=>{
   if(i===0||i===tracks.length-1)return value;
   const values=[];for(let d=-2;d<=2;d++)values.push(tracks[Math.max(0,Math.min(tracks.length-1,i+d))][j][k]);
   return values.sort((a,b)=>a-b)[2];
 })));
 results[name]=median.map((lines,i)=>lines.map((line,j)=>line.map((value,k)=>{
   if(i<2||i>=tracks.length-2)return value;
   return +((median[i-2][j][k]+2*median[i-1][j][k]+3*value+2*median[i+1][j][k]+median[i+2][j][k])/9).toFixed(2);
 })));
 console.log(name,frames,'frames; final guides',results[name].at(-1));
}
fs.writeFileSync('konfigurator-neu/source-joints.js','/* Measured source seams, 24 fps. Used only for photo cleanup. */\nwindow.SourceJoints='+JSON.stringify(results)+';\n');
