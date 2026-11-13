/* Material replacement on the original footage. Measured seams anchor the floor;
   diffuse illumination and a finish-dependent reflection estimate are transferred
   in linear light. This is compositing, not a measured BRDF or a full 3D relight. */
(() => {
'use strict';
const W=1920,H=1080;
function solve(A,b){const m=A.map((r,i)=>[...r,b[i]]),n=b.length;for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(m[r][c])>Math.abs(m[p][c]))p=r;[m[c],m[p]]=[m[p],m[c]];if(Math.abs(m[c][c])<1e-9)throw Error('Degenerate plane');for(let r=0;r<n;r++)if(r!==c){const f=m[r][c]/m[c][c];for(let k=c;k<=n;k++)m[r][k]-=f*m[c][k];}}return m.map((r,i)=>r[n]/r[i]);}
function homography(from,to){const A=[],b=[];for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=to[i];A.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);}return [...solve(A,b),1];}
const columnMajor=m=>new Float32Array([m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]]);
const interpolate=(keys,t)=>{let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;const [a,x]=keys[i],[b,y]=keys[i+1],f=Math.max(0,Math.min(1,(t-a)/(b-a)));return x.map((p,j)=>p.map((v,k)=>v+(y[j][k]-v)*f));};
function intersection(a,b){
 const [x,y,u,v]=a,[s,t,w,z]=b,dx=u-x,dy=v-y,ex=w-s,ey=z-t,d=dx*ey-dy*ex;
 if(Math.abs(d)<1e-5)return null;
 const f=((s-x)*ey-(t-y)*ex)/d;return [x+dx*f,y+dy*f];
}
function measuredFloorQuad(lines){
 if(!Array.isArray(lines[0]))lines=Array.from({length:lines.length/4},(_,i)=>Array.from(lines.slice(i*4,i*4+4)));
 const points=[intersection(lines[0],lines[5]),intersection(lines[0],lines[4]),intersection(lines[2],lines[4]),intersection(lines[2],lines[5])];
 return points.every(p=>p&&p.every(Number.isFinite))?points:null;
}
const floorOutline=[
 [0,[[670,747],[770,660],[1030,656],[1105,666],[1134,723],[1201,723],[1200,855],[1270,1016],[1295,1018],[1305,1043],[650,1043],[670,850]]],
 [2.5,[[603,777],[737,674],[1040,670],[1120,680],[1158,760],[1292,760],[1288,980],[1341,1080],[1341,1080],[1341,1080],[565,1080],[603,973]]],
 [5,[[422,910],[708,695],[1046,690],[1110,704],[1197,810],[1463,812],[1457,1080],[1457,1080],[1457,1080],[1457,1080],[422,1080],[422,1080]]]
];
const planes=[
 {surface:'boden',size:[60,120],quad:[[0,[[795,700],[952,700],[954,778],[729,777]]],[2.5,[[771,727],[949,728],[949,851],[679,844]]],[5,[[738,760],[946,763],[947,950],[580,942]]]],outline:floorOutline},
 {surface:'wand',size:[90,318],oldLayout:{tile:[70,60],offset:[21,1]},quad:[[0,[[1131,53],[1295,70],[1295,660],[1131,660]]],[2.5,[[1158,-15],[1337,-8],[1337,677],[1158,677]]],[5,[[1198,0],[1395,0],[1395,700],[1198,700]]]],outline:[[0,[[1131,143],[1200,144],[1200,657],[1131,657]]],[2.5,[[1158,99],[1291,100],[1291,677],[1158,677]]],[5,[[1198,49],[1395,50],[1395,700],[1198,700]]]]},
 {surface:'wand',size:[30,318],quad:[[0,[[1295,70],[1355,30],[1355,675],[1295,660]]],[2.5,[[1337,-8],[1396,-25],[1396,695],[1337,677]]],[5,[[1395,0],[1457,-80],[1457,725],[1395,700]]]],outline:[[0,[[1200,0],[1200,0],[1200,660],[1200,660]]],[2.5,[[1291,0],[1291,0],[1291,677],[1291,677]]],[5,[[1395,50],[1457,0],[1457,725],[1395,700]]]]},
 {surface:'wand',size:[30,318],quad:[[0,[[1032,140],[1105,145],[1105,667],[1032,657]]],[2.5,[[1040,80],[1120,85],[1120,682],[1040,672]]],[5,[[1046,20],[1110,20],[1110,704],[1046,690]]]],outline:[[0,[[1032,145],[1127,145],[1127,667],[1032,657]]],[2.5,[[1040,100],[1133,100],[1133,682],[1040,672]]],[5,[[1046,52],[1137,52],[1137,700],[1046,690]]]]},
 {surface:'wand',size:[120,60],quad:[[0,[[670,655],[770,615],[770,660],[670,747]]],[2.5,[[603,655],[737,620],[737,674],[603,777]]],[5,[[422,690],[708,596],[708,695],[422,910]]]],outline:[[0,[[670,631],[785,633],[864,594],[864,656],[770,660],[670,747]]],[2.5,[[603,658],[734,663],[850,590],[850,672],[737,674],[603,777]]],[5,[[422,714],[651,719],[839,606],[840,685],[708,695],[422,910]]]]}
];
const VS=`#version 300 es
in vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
const FS=`#version 300 es
precision highp float;
uniform sampler2D photo;
uniform sampler2D decor;
uniform vec4 decorCrop;
uniform int useDecor,rotateDecor;
uniform vec2 viewport,tile,oldTile,oldOffset;
uniform mat3 toWorld,toImage;
uniform vec2 outline[12],fittings[13];uniform vec4 floorGuides[9];uniform int count,pass,isWall;
uniform float stagger,albedo,roughness;
uniform vec3 toneGain;
uniform float toneGamma,toneSaturation,toneHighlights;
uniform vec3 grout;
out vec4 outputColor;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 linearColor(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 displayColor(vec3 c){c=max(c,vec3(0));return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 gradeMaterial(vec3 c){
  vec3 neutral=mix(vec3(lum(c)),c,toneSaturation);
  vec3 toned=clamp(pow(max(neutral,vec3(0)),vec3(toneGamma))*toneGain,0.,1.);
  return mix(toned,c,smoothstep(.82,.98,lum(c))*toneHighlights);
}
vec3 sampleAt(vec2 p){return texture(photo,clamp(p/vec2(1920,1080),vec2(0),vec2(1))).rgb;}
vec2 project(vec2 p){vec3 q=toImage*vec3(p,1);return q.xy/q.z;}
bool inside(vec2 p){bool result=false;for(int i=0;i<12;i++){if(i>=count)break;int j=i==0?count-1:i-1;vec2 a=outline[i],b=outline[j];if((a.y>p.y)!=(b.y>p.y))if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;}return result;}
float segmentDistance(vec2 p,vec2 a,vec2 b){vec2 v=b-a;return length(p-a-v*clamp(dot(p-a,v)/max(dot(v,v),.001),0.,1.));}
bool fixture(vec2 p){
  if(segmentDistance(p,fittings[0],fittings[1])<8.)return true;
  for(int i=2;i<5;i++)if(length(p-fittings[i])<10.)return true;
  for(int i=5;i<12;i++)if(segmentDistance(p,fittings[i],fittings[i+1])<4.5)return true;
  return false;
}
float fixtureCoverage(vec2 p){
 float coverage=1.-smoothstep(3.5,7.,segmentDistance(p,fittings[0],fittings[1]));
 for(int i=2;i<5;i++)coverage=max(coverage,1.-smoothstep(5.,9.,length(p-fittings[i])));
 for(int i=5;i<12;i++)coverage=max(coverage,1.-smoothstep(2.,4.5,segmentDistance(p,fittings[i],fittings[i+1])));
 return coverage;
}
float boundaryCoverage(vec2 p){
 float distanceToEdge=10000.;
 for(int i=0;i<12;i++){if(i>=count)break;int j=i==0?count-1:i-1;distanceToEdge=min(distanceToEdge,segmentDistance(p,outline[i],outline[j]));}
 return smoothstep(0.,1.15*1920./viewport.x,distanceToEdge);
}
bool photographedJoint(vec2 image){
 if(isWall==0){for(int i=0;i<9;i++)if(segmentDistance(image,floorGuides[i].xy,floorGuides[i].zw)<8.5)return true;return false;}
 vec3 world=toWorld*vec3(image,1);vec2 p=world.xy/world.z;
 vec2 nearest=round((p-oldOffset)/oldTile)*oldTile+oldOffset;
 return length(project(vec2(nearest.x,p.y))-image)<8.5||length(project(vec2(p.x,nearest.y))-image)<8.5;
}
// A small, surface-constrained neighbourhood suppresses photographed grain and
// old grout in the illumination, without sampling doors, vanity or ceiling.
vec3 broadIllumination(vec2 image,vec3 centre){
 vec3 result=linearColor(centre)*4.;float weight=4.;
 for(int i=0;i<8;i++){
   float angle=float(i)*.7853981634;
   vec2 at=image+vec2(cos(angle),sin(angle))*18.;
   if(inside(at)&&!photographedJoint(at)&&!(isWall==1&&fixture(at))){result+=linearColor(sampleAt(at));weight+=1.;}
 }
 return result/weight;
}
float jointCoverage(vec2 p,vec2 footprint){
  float row=floor(p.y/tile.y);
  vec2 grid=vec2(p.x+fract(row*stagger)*tile.x,p.y);
  vec2 local=mod(grid,tile),d=min(local,tile-local);
  vec2 covered=max(vec2(0),min(d+footprint*.5,vec2(.13))-max(d-footprint*.5,vec2(-.13)));
  vec2 c=clamp(covered/footprint,0.,1.);
  return c.x+c.y-c.x*c.y;
}
vec3 repairFloor(vec2 image,vec3 original){
  float nearest=1e6;int first=0;
  for(int i=0;i<9;i++){float d=segmentDistance(image,floorGuides[i].xy,floorGuides[i].zw);if(d<nearest){nearest=d;first=i;}}
  if(nearest>=8.)return original;
  vec2 a=floorGuides[first].xy,b=floorGuides[first].zw,v=normalize(b-a),normal=vec2(-v.y,v.x);
  vec2 point=a+v*dot(image-a,v);
  float blend=1.-smoothstep(3.5,8.,nearest);
  vec3 fill=mix(sampleAt(point-normal*11.),sampleAt(point+normal*11.),clamp(.5+dot(image-point,normal)/22.,0.,1.));
  float nextDistance=1e6;int second=first;
  for(int i=0;i<9;i++){
    vec2 direction=normalize(floorGuides[i].zw-floorGuides[i].xy);
    if(abs(dot(direction,v))>.85)continue;
    float d=segmentDistance(image,floorGuides[i].xy,floorGuides[i].zw);
    if(d<nextDistance){nextDistance=d;second=i;}
  }
  if(nextDistance<8.){
    vec2 c=floorGuides[second].xy,w=normalize(floorGuides[second].zw-c),otherNormal=vec2(-w.y,w.x);
    float det=v.x*w.y-v.y*w.x;
    if(abs(det)>.1){
      vec2 crossPoint=a+v*((c.x-a.x)*w.y-(c.y-a.y)*w.x)/det,delta=image-crossPoint;
      float basis=normal.x*otherNormal.y-normal.y*otherNormal.x;
      vec2 uv=clamp(vec2(delta.x*otherNormal.y-delta.y*otherNormal.x,normal.x*delta.y-normal.y*delta.x)/basis/22.+.5,0.,1.);
      vec3 top=mix(sampleAt(crossPoint-normal*11.-otherNormal*11.),sampleAt(crossPoint+normal*11.-otherNormal*11.),uv.x);
      vec3 bottom=mix(sampleAt(crossPoint-normal*11.+otherNormal*11.),sampleAt(crossPoint+normal*11.+otherNormal*11.),uv.x);
      fill=mix(fill,mix(top,bottom,uv.y),1.-smoothstep(3.5,8.,nextDistance));
    }
  }
  return mix(original,fill,blend);
}
vec3 repair(vec2 image,vec2 p,vec3 original){
  if(isWall==0)return repairFloor(image,original);
  vec2 dx=normalize(project(p+vec2(.5,0))-image),dy=normalize(project(p+vec2(0,.5))-image);
  vec3 repaired=original;
  // Repair only calibrated old joints. Image-wide contrast detection also erased
  // veins, fixture edges and reflections, creating the previous scratch artifacts.
  vec2 nearest=round((p-oldOffset)/oldTile)*oldTile+oldOffset;
  vec2 gx=project(vec2(nearest.x,p.y)),gy=project(vec2(p.x,nearest.y));
  float ix=1.-smoothstep(3.5,8.,length(gx-image));
  float iy=1.-smoothstep(3.5,8.,length(gy-image));
  vec3 fillX=mix(sampleAt(gx-dx*11.),sampleAt(gx+dx*11.),clamp(.5+dot(image-gx,dx)/22.,0.,1.));
  vec3 fillY=mix(sampleAt(gy-dy*11.),sampleAt(gy+dy*11.),clamp(.5+dot(image-gy,dy)/22.,0.,1.));
  repaired=mix(repaired,fillX,ix);repaired=mix(repaired,fillY,iy);
  vec2 crossPoint=project(nearest),delta=image-crossPoint;
  float determinant=dx.x*dy.y-dx.y*dy.x;
  if(ix*iy>.001&&abs(determinant)>.01){
    vec2 uv=clamp(vec2(delta.x*dy.y-delta.y*dy.x,dx.x*delta.y-dx.y*delta.x)/determinant/22.+.5,0.,1.);
    vec3 top=mix(sampleAt(crossPoint-dx*11.-dy*11.),sampleAt(crossPoint+dx*11.-dy*11.),uv.x);
    vec3 bottom=mix(sampleAt(crossPoint-dx*11.+dy*11.),sampleAt(crossPoint+dx*11.+dy*11.),uv.x);
    repaired=mix(repaired,mix(top,bottom,uv.y),ix*iy);
  }
  return repaired;
}
void main(){
  vec2 image=vec2(gl_FragCoord.x/viewport.x*1920.,(1.-gl_FragCoord.y/viewport.y)*1080.);
  vec3 original=sampleAt(image);
  if(pass==0){outputColor=vec4(original,1);return;}
  vec3 q=toWorld*vec3(image,1);vec2 p=q.xy/q.z;
  // Analytic pixel footprint remains defined at mask edges and dark source joints.
  // GPU derivatives after a per-pixel discard are undefined on those boundaries.
  vec2 dpdx=(vec2(toWorld[0][0],toWorld[0][1])-p*toWorld[0][2])/q.z;
  vec2 dpdy=(vec2(toWorld[1][0],toWorld[1][1])-p*toWorld[1][2])/q.z;
  vec2 pixel=max(abs(dpdx)*(1920./viewport.x)+abs(dpdy)*(1080./viewport.y),vec2(.001));
  if(!inside(image))discard;
  float fixtureMask=isWall==1?fixtureCoverage(image):0.;
  if(fixtureMask>.999){outputColor=vec4(original,1);return;}
  vec3 repaired=repair(image,p,original);
  vec3 material=gradeMaterial(repaired);
  vec3 lightingSample=(repaired*4.+sampleAt(image+vec2(12,0))+sampleAt(image-vec2(12,0))+sampleAt(image+vec2(0,12))+sampleAt(image-vec2(0,12)))/8.;
  if(useDecor==1){
    float row=floor(p.y/tile.y);
    vec2 cell=vec2(p.x+fract(row*stagger)*tile.x,p.y)/tile;
    vec2 uv=fract(cell),gradX=dpdx*(1920./viewport.x)/tile,gradY=dpdy*(1080./viewport.y)/tile;
    // No checkerboard mirroring: that created artificial bookmatched zigzags.
    // A stable 180-degree turn on occasional tiles preserves grain direction.
    vec2 face=floor(cell);float turn=fract(sin(dot(face,vec2(12.9898,78.233)))*43758.5453)<.28?-1.:1.;
    vec2 flip=vec2(turn);
    uv=(uv-.5)*flip+.5;gradX*=flip;gradY*=flip;
    if(rotateDecor==1){uv=vec2(uv.y,1.-uv.x);gradX=vec2(gradX.y,-gradX.x);gradY=vec2(gradY.y,-gradY.x);}
    vec3 surfaceColor=textureGrad(decor,decorCrop.xy+uv*decorCrop.zw,gradX*decorCrop.zw,gradY*decorCrop.zw).rgb;
    vec3 sourceLinear=linearColor(repaired);
    vec3 broad=broadIllumination(image,repaired);
    float broadY=max(lum(broad),.0005),sourceY=lum(sourceLinear);
    // Reflections retain the colours of the photographed window and doors.
    // This is an estimate from a single plate, not ground-truth light passes.
    float highlight=smoothstep(isWall==0?.38:.66,isWall==0?.88:.98,lum(repaired));
    vec3 specular=sourceLinear*highlight*(isWall==0?.76:.42);
    float preserveContact=1.-smoothstep(.32,.72,sourceY/broadY);
    float diffuseSource=mix(broadY,sourceY,preserveContact);
    float diffuseY=max(.0001,diffuseSource-lum(specular));
    float reference=max(lum(linearColor(vec3(albedo))),.015);
    // Preserve real contact shadows instead of clamping them to a flat minimum.
    float illumination=clamp(diffuseY/reference,.012,isWall==0?1.6:2.);
    vec3 lightTint=clamp(broad/broadY,vec3(.72),vec3(1.28));
    lightTint=mix(vec3(1),lightTint,isWall==0?.12:.20);
    float specularResponse=mix(1.,.24,smoothstep(.25,.85,roughness));
    vec3 diffuse=linearColor(surfaceColor)*illumination*lightTint;
    vec3 exposed=diffuse+specular*specularResponse;
    // The plate is already camera-tonemapped. A luminance shoulder avoids
    // clipping the pattern away when replacing a dark tile with a pale one.
    float exposedY=max(lum(exposed),.0001);
    float compressedY=exposedY>.75?.75+.25*(1.-exp(-(exposedY-.75)/.25)):exposedY;
    material=displayColor(exposed*(compressedY/exposedY));
  }
  // Integrate the real joint width rather than widening subpixel lines to half
  // a pixel. Four geometric samples keep staggered T-junctions stable in motion.
  vec2 sx=dpdx*(1920./viewport.x)*.25,sy=dpdy*(1080./viewport.y)*.25;
  vec2 footprint=max(pixel*.5,vec2(.0001));
  float joint=(jointCoverage(p+sx+sy,footprint)+jointCoverage(p+sx-sy,footprint)+jointCoverage(p-sx+sy,footprint)+jointCoverage(p-sx-sy,footprint))*.25;
  vec3 broadLight=(sampleAt(image+vec2(16,0))+sampleAt(image-vec2(16,0))+sampleAt(image+vec2(0,16))+sampleAt(image-vec2(0,16)))*.25;
  broadLight=gradeMaterial(broadLight);
  float light=clamp(pow((useDecor==1?lum(lightingSample):mix(lum(material),lum(broadLight),.8))/albedo,1.3),.12,1.3);
  vec3 jointColor=pow(pow(grout,vec3(2.2))*light,vec3(1./2.2));
  vec3 colorCast=mix(vec3(1),clamp(material/max(lum(material),.03),vec3(.8),vec3(1.2)),.20);
  jointColor*=colorCast*.9;
  vec3 composite=mix(material,jointColor,joint);
  outputColor=vec4(mix(original,composite,boundaryCoverage(image)*(1.-fixtureMask)),1);
}`;
window.LiveJoints=function(canvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL 2 fehlt');
 const compile=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VS));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
 const U={};for(const n of ['photo','decor','decorCrop','useDecor','rotateDecor','viewport','tile','oldTile','oldOffset','toWorld','toImage','outline','count','pass','stagger','albedo','roughness','grout','isWall','fittings','floorGuides','toneGain','toneGamma','toneSaturation','toneHighlights'])U[n]=gl.getUniformLocation(program,['outline','fittings','floorGuides'].includes(n)?n+'[0]':n);
 const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(U.photo,0);
 const colors={hell:[.81,.78,.71],grau:[.52,.52,.50],dunkel:[.19,.21,.22]},offsets={kreuz:0,halb:.5,drittel:1/3};
 const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');
 const decorTextures=new Map();
 const ready=Promise.all((window.BadMaterials?.products||[]).map(async model=>{
   const img=new Image();img.src=model.texture||model.photo;await img.decode();
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);decorTextures.set(model.id,tex);
 }));
 // A complete fallback sampler is needed even during the untouched photo pass.
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(U.decor,1);gl.activeTexture(gl.TEXTURE0);
 function draw(source,state,time=5){
   if(source instanceof HTMLImageElement&&!source.naturalWidth)return;
   if(source instanceof HTMLVideoElement&&source.readyState<2)return;
   const width=Math.min(3840,Math.max(1920,Math.ceil(canvas.clientWidth*(devicePixelRatio||1))));
   if(canvas.width!==width){canvas.width=width;canvas.height=Math.round(width*H/W);}
   gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   gl.uniform2f(U.viewport,canvas.width,canvas.height);gl.uniform1i(U.pass,0);gl.disable(gl.SCISSOR_TEST);gl.drawArrays(gl.TRIANGLES,0,3);
   gl.uniform1i(U.pass,1);gl.enable(gl.SCISSOR_TEST);
   const wallWorld=[[0,318],[90,318],[90,0],[0,0]],wallPlane=planes[1];
   const endInverse=homography(wallPlane.quad.at(-1)[1],wallWorld),currentForward=homography(wallWorld,interpolate(wallPlane.quad,time));
   const projectPoint=(m,[x,y])=>{const z=m[6]*x+m[7]*y+m[8];return[(m[0]*x+m[1]*y+m[2])/z,(m[3]*x+m[4]*y+m[5])/z];};
   const fixturePoints=[[1290,390],[1463,390],[1225,434],[1269,435],[1307,434],[1269,455],[1263,492],[1265,522],[1278,541],[1300,541],[1318,520],[1321,491],[1308,439]];
   gl.uniform2fv(U.fittings,new Float32Array(fixturePoints.flatMap(p=>projectPoint(currentForward,projectPoint(endInverse,p)))));
   // Cleanup follows measurements of each real video frame. An interpolated
   // camera plane drifts away from the baked-in seams, leaving a second grid.
   const floorWorld=[[0,0],[60,0],[60,120],[0,120]],floorPlane=planes[0];
   const floorEndInverse=homography(floorPlane.quad.at(-1)[1],floorWorld),floorForward=homography(floorWorld,interpolate(floorPlane.quad,time));
   const guides=[[[420,751],[947,763]],[[947,763],[1460,763]],[[420,938],[947,950]],[[947,950],[1460,950]],[[946,695],[947,1080]],[[795,695],[460,1080]],[[1094,695],[1424,1080]]];
   const floorLook=window.BadMaterials?.floor.find(m=>m.id===state.product),wallLook=window.BadMaterials?.wall.find(m=>m.id===state.wall);
   const floorBase=floorLook?.base||state.product,wallBase=wallLook?.base||state.wall;
   const measured=window.SourceJoints?.[floorBase==='marmor'?'marmor':'original'];
   let cleanup;
   if(measured){
     const position=Math.max(0,Math.min(measured.length-1,time*24)),i=Math.floor(position),next=Math.min(i+1,measured.length-1),fraction=position-i;
     cleanup=measured[i].flatMap((line,j)=>line.map((value,k)=>value+(measured[next][j][k]-value)*fraction));
   }else cleanup=[...guides,[[0,-100],[1920,-100]],[[0,-200],[1920,-200]]].flatMap(line=>line.flatMap(p=>projectPoint(floorForward,projectPoint(floorEndInverse,p))));
   gl.uniform4fv(U.floorGuides,new Float32Array(cleanup));
   const measuredQuad=measuredFloorQuad(cleanup);
   for(const plane of planes){
     const polygon=interpolate(plane.outline,time),quad=plane.surface==='boden'&&measuredQuad?measuredQuad:interpolate(plane.quad,time),[w,h]=plane.size;
     const minX=Math.max(0,Math.min(...polygon.map(p=>p[0]))),maxX=Math.min(W,Math.max(...polygon.map(p=>p[0]))),minY=Math.max(0,Math.min(...polygon.map(p=>p[1]))),maxY=Math.min(H,Math.max(...polygon.map(p=>p[1])));
     if(maxX-minX<1||maxY-minY<1)continue;
     const world=plane.surface==='boden'?[[0,0],[w,0],[w,h],[0,h]]:[[0,h],[w,h],[w,0],[0,0]];
     const settings=state.surfaces[plane.surface],format=settings.format.split(',').map(Number);
     // Floor: long edge into the room. Walls: conventional landscape laying.
     const size=plane.surface==='wand'?[format[1],format[0]]:format;
     gl.uniformMatrix3fv(U.toWorld,false,columnMajor(homography(quad,world)));gl.uniformMatrix3fv(U.toImage,false,columnMajor(homography(world,quad)));
     const points=new Float32Array(24);polygon.forEach((p,i)=>points.set(p,i*2));gl.uniform2fv(U.outline,points);gl.uniform1i(U.count,polygon.length);
     gl.uniform2f(U.tile,...size);gl.uniform1f(U.stagger,offsets[settings.pattern]||0);gl.uniform3f(U.grout,...colors[settings.grout]);
     const old=plane.oldLayout||{tile:[60,plane.surface==='boden'?120:60],offset:[0,0]};
     gl.uniform2f(U.oldTile,...old.tile);gl.uniform2f(U.oldOffset,...old.offset);
     gl.uniform1i(U.isWall,plane.surface==='wand'?1:0);
     const grade=(plane.surface==='boden'?floorLook:wallLook)?.grade;
     const look=plane.surface==='boden'?floorLook:wallLook,decorTexture=decorTextures.get(look?.id);
     gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,decorTexture||texture);gl.activeTexture(gl.TEXTURE0);
     gl.uniform1i(U.useDecor,decorTexture?1:0);gl.uniform1i(U.rotateDecor,plane.surface==='boden'&&look?.rotate?1:0);gl.uniform4f(U.decorCrop,...(look?.crop||[0,0,1,1]));
     gl.uniform1f(U.roughness,look?.roughness??.65);
     gl.uniform3f(U.toneGain,...(grade?.gain||[1,1,1]));gl.uniform1f(U.toneGamma,grade?.gamma??1);gl.uniform1f(U.toneSaturation,grade?.saturation??1);gl.uniform1f(U.toneHighlights,grade?.highlights??0);
     gl.uniform1f(U.albedo,grade?.albedo??(plane.surface==='boden'?(floorBase==='marmor'?.67:.50):(wallBase==='hell'?.62:.27)));
     const scale=canvas.width/W;gl.scissor(Math.floor(minX*scale),Math.floor((H-maxY)*scale),Math.ceil((maxX-minX)*scale),Math.ceil((maxY-minY)*scale));gl.drawArrays(gl.TRIANGLES,0,3);
   }
   gl.disable(gl.SCISSOR_TEST);
   canvas.dataset.frameTime=String(time);
 }
 return {draw,ready};
};
})();
