// Offline composite: keep the original architecture and use the AI-rendered floor.
// Keyframed masks follow the occluding doors and shower threshold in the source clip.
const fs=require('node:fs');
const path=require('node:path');
const W=1920,H=1080,fps=24,frames=121;
const keys=[
 [0,[[670,747],[770,660],[1030,656],[1105,666],[1134,723],[1201,723],[1200,855],[1270,1016],[1295,1018],[1305,1043],[650,1043],[670,850]]],
 [2.5,[[603,777],[737,674],[1040,670],[1120,680],[1158,760],[1292,760],[1288,980],[1341,1080],[1341,1080],[1341,1080],[565,1080],[603,973]]],
 [5,[[422,910],[708,695],[1046,690],[1110,704],[1197,810],[1463,812],[1457,1080],[1457,1080],[1457,1080],[1457,1080],[422,1080],[422,1080]]]
];
const output=fs.openSync(path.join(__dirname,'bath-floor-mask.gray'),'w');
async function run(){
 for(let n=0;n<frames;n++){
  const time=n/fps,k=time<=2.5?0:1,[ta,a]=keys[k],[tb,b]=keys[k+1],t=Math.min(1,(time-ta)/(tb-ta));
  const points=a.map(([x,y],i)=>[x+(b[i][0]-x)*t,y+(b[i][1]-y)*t]);
  const buf=Buffer.alloc(W*H);
  for(let y=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1]))));y<H;y++){
   const crosses=[];
   for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [ax,ay]=points[i],[bx,by]=points[j];
    if((ay>y+.5)!==(by>y+.5))crosses.push(ax+(y+.5-ay)*(bx-ax)/(by-ay));
   }
   crosses.sort((a,b)=>a-b);
   for(let i=0;i+1<crosses.length;i+=2){
    // Fractional edge coverage joins the decor to the door itself. The old
    // two-pixel inset left an unconfigured light strip along the wood.
    const from=Math.max(0,crosses[i]),to=Math.min(W,crosses[i+1]);
    for(let x=Math.floor(from);x<Math.ceil(to);x++)buf[y*W+x]=Math.round(255*Math.max(0,Math.min(x+1,to)-Math.max(x,from)));
   }
  }
  fs.writeSync(output,buf);
 }
 fs.closeSync(output);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
