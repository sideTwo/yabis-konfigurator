/* One centimetre grid shared by floor and walls. Floor coordinates determine
   every wall foot; three measured photo datums align floor, finish and ceiling. */
((root, factory) => {
  const api = factory(typeof module === 'object' && module.exports ? require('./standbild-renderer.js') : root.YabisRoomPreview);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YabisTileGrid = api;
})(typeof window === 'object' ? window : this, room => {
  'use strict';
  const formats = [[60,120],[60,60],[120,120]];
  const grouts = {
    light: {label:'Hellgrau', rgb:[211,211,207]},
    grey: {label:'Mittelgrau', rgb:[143,145,142]},
    dark: {label:'Anthrazit', rgb:[65,70,69]},
    sand: {label:'Sand', rgb:[183,171,151]}
  };
  const format = value => {
    const key = Array.isArray(value) ? value.join(',') : String(value);
    return (formats.find(f => f.join(',') === key) || formats[0]).slice();
  };
  function solve(A, b) {
    const m = A.map((row,i) => [...row,b[i]]), n = b.length;
    for (let c=0;c<n;c++) {
      let pivot=c;
      for (let r=c+1;r<n;r++) if(Math.abs(m[r][c])>Math.abs(m[pivot][c])) pivot=r;
      [m[c],m[pivot]]=[m[pivot],m[c]];
      if(Math.abs(m[c][c])<1e-10) throw Error('Ungültige Flächenperspektive.');
      for(let r=0;r<n;r++) if(r!==c) {
        const scale=m[r][c]/m[c][c];
        for(let k=c;k<=n;k++) m[r][k]-=m[c][k]*scale;
      }
    }
    return m.map((row,i)=>row[n]/row[i]);
  }
  function homography(from,to) {
    const A=[],b=[];
    from.forEach(([x,y],i)=>{
      const [u,v]=to[i];
      A.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]); b.push(u,v);
    });
    return [...solve(A,b),1];
  }
  function project(matrix,[x,y]) {
    if(matrix.kind==='wall'){
      const [px,floorY]=project(matrix.floor,matrix.axis==='back'?[x,0]:[matrix.side,x]);
      const at=line=>line[0][1]+(px-line[0][0])*(line[1][1]-line[0][1])/(line[1][0]-line[0][0]);
      const finishY=at(matrix.finish),ceilingY=at(matrix.ceiling);
      return [px,y<=matrix.datum?floorY+(finishY-floorY)*y/matrix.datum:finishY+(ceilingY-finishY)*(y-matrix.datum)/(matrix.height-matrix.datum)];
    }
    const z=matrix[6]*x+matrix[7]*y+matrix[8];
    return [(matrix[0]*x+matrix[1]*y+matrix[2])/z,(matrix[3]*x+matrix[4]*y+matrix[5])/z];
  }
  if(!room?.wallCalibration)throw Error('Raum- und Fugenkalibrierung passen nicht zusammen. Bitte Seite neu laden.');
  const floorMatrix=homography([[0,0],[300,0],[300,300],[0,300]],[[498,639],[1168,633],[1672,941],[135,941]]);
  const wallPlane=(axis,maxU)=>({surface:'wall',maxU,maxV:room.wallCalibration.height,matrix:{kind:'wall',floor:floorMatrix,axis,side:axis==='right'?300:0,...room.wallCalibration.planes[axis],datum:room.wallCalibration.datum,height:room.wallCalibration.height}});
  const planes = {
    floor:{surface:'floor',maxU:300,maxV:300,matrix:floorMatrix},
    left:wallPlane('left',380),back:wallPlane('back',300),right:wallPlane('right',300)
  };
  function joints(plane, selectedFormat, maxV=plane.maxV) {
    const [short,long]=format(selectedFormat);
    const longAcross=plane.surface==='wall'||plane.longAcross;
    const stepU=longAcross?long:short;
    const stepV=longAcross?short:long;
    const minU=plane.minU??0,minV=plane.minV??0;
    const result=[],half=.15; // 3 mm total joint width in this demonstration.
    for(let u=(Math.floor((minU+.01)/stepU)+1)*stepU;u<plane.maxU-.01;u+=stepU) {
      result.push({axis:'u',position:u,from:[u,minV],to:[u,maxV],quad:[[u-half,minV],[u+half,minV],[u+half,maxV],[u-half,maxV]].map(p=>project(plane.matrix,p))});
    }
    for(let v=(Math.floor((minV+.01)/stepV)+1)*stepV;v<maxV-.01;v+=stepV) {
      result.push({axis:'v',position:v,from:[minU,v],to:[plane.maxU,v],quad:[[minU,v-half],[plane.maxU,v-half],[plane.maxU,v+half],[minU,v+half]].map(p=>project(plane.matrix,p))});
    }
    return result;
  }
  function path(ctx,polygons) {
    ctx.beginPath();
    for(const points of polygons) {
      ctx.moveTo(...points[0]); for(const p of points.slice(1))ctx.lineTo(...p); ctx.closePath();
    }
  }
  let overlay,lightPixels,lightSource;
  function prepare(ctx,image) {
    const doc=ctx.canvas.ownerDocument;
    if(!overlay) { overlay=doc.createElement('canvas'); overlay.width=1672; overlay.height=941; }
    if(lightSource!==image) {
      const temp=doc.createElement('canvas');temp.width=1672;temp.height=941;
      const c=temp.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,1672,941);
      lightPixels=c.getImageData(0,0,1672,941).data;lightSource=image;
    }
  }
  function shade([x,y],photoLighting) {
    let sum=0;
    for(const [dx,dy] of [[0,0],[-5,0],[5,0],[0,-5],[0,5]]) {
      const px=Math.min(1671,Math.max(0,Math.round(x+dx))),py=Math.min(940,Math.max(0,Math.round(y+dy))),i=(py*1672+px)*4;
      sum+=lightPixels[i]*.2126+lightPixels[i+1]*.7152+lightPixels[i+2]*.0722;
    }
    return Math.min(1.22,Math.max(.30,Math.pow(sum/5/(photoLighting?190:160),photoLighting?1.1:.8)));
  }
  function recessedEdge(joint,start,end,floor) {
    const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy);
    const nx=-dy/length,ny=dx/length;
    const [a,b,c,d]=joint.quad;
    const [startSide,endSide]=joint.axis==='u'?[[a,b],[d,c]]:[[a,d],[b,c]];
    const outside=([x,y],[left,right],side)=>{
      const width=Math.abs((right[0]-left[0])*nx+(right[1]-left[1])*ny);
      // Keep the projected 3 mm core. The softer contact edge also covers
      // distant joints that would otherwise disappear when scaled down.
      const half=Math.max(width*1.45,(floor?2.2:1.55)+width*.2)/2;
      return [x+side*half*nx,y+side*half*ny];
    };
    return [outside(start,startSide,1),outside(end,endSide,1),outside(end,endSide,-1),outside(start,startSide,-1)];
  }
  function strokeJoint(ctx,plane,joint,rgb,photoLighting) {
    const start=project(plane.matrix,joint.from),end=project(plane.matrix,joint.to);
    const gradient=ctx.createLinearGradient(...start,...end);
    const floor=plane.surface==='floor';
    const edge=photoLighting?ctx.createLinearGradient(...start,...end):null;
    for(let i=0;i<=16;i++) {
      const t=i/16,p=start.map((value,j)=>value+(end[j]-value)*t),light=shade(p,photoLighting);
      const recess=photoLighting?Math.min(1.12,light)*(floor?.87:.93):light;
      gradient.addColorStop(t,`rgb(${rgb.map(n=>Math.round(n*recess)).join(',')})`);
      if(edge){
        const channels=rgb.map(n=>Math.round(n*recess*.82)).join(',');
        edge.addColorStop(t,`rgba(${channels},${floor?.68:.40})`);
      }
    }
    if(edge){
      path(ctx,[recessedEdge(joint,start,end,floor)]);ctx.fillStyle=edge;ctx.fill();
    }
    path(ctx,[joint.quad]);ctx.fillStyle=gradient;ctx.fill();
  }
  function drawFace(ctx,plane,polygons,selectedFormat,grout,maxV,photoLighting) {
    if(!polygons.length)return;
    ctx.save();path(ctx,polygons);ctx.clip();
    for(const joint of joints(plane,selectedFormat,maxV))strokeJoint(ctx,plane,joint,grouts[grout]?.rgb||grouts.grey.rgb,photoLighting);
    ctx.restore();
  }
  function draw(ctx,state,room,base,photoLighting=false,scene=null) {
    if(scene?.slabs)return;
    prepare(ctx,base);
    const c=overlay.getContext('2d');c.clearRect(0,0,1672,941);
    if(!scene&&(typeof room.faces!=='function'||typeof room.groutOcclusions!=='function'))throw Error('Badkalibrierung und Fugenrenderer passen nicht zusammen. Bitte Seite neu laden.');
    const faces=scene?.faces||room.faces(state.wallHeight),holes=scene?.holes||room.groutOcclusions(state.wallHeight,photoLighting);
    for(const face of faces)drawFace(c,scene?face.plane:planes[face.plane],face.polygons,state[face.surface+'Format'],state[face.surface+'Grout'],face.maxV,photoLighting);
    c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#fff';path(c,holes);c.fill();
    if(scene?.matte)c.drawImage(scene.matte(ctx,base),0,0);
    c.restore();
    ctx.drawImage(overlay,0,0);
  }
  return {formats,grouts,format,homography,project,planes,joints,draw};
});
