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
    const stepU=plane.surface==='floor'?short:long;
    const stepV=plane.surface==='floor'?long:short;
    const result=[],half=.15; // 3 mm total joint width in this demonstration.
    for(let u=stepU;u<plane.maxU-.01;u+=stepU) {
      result.push({axis:'u',position:u,from:[u,0],to:[u,maxV],quad:[[u-half,0],[u+half,0],[u+half,maxV],[u-half,maxV]].map(p=>project(plane.matrix,p))});
    }
    for(let v=stepV;v<maxV-.01;v+=stepV) {
      result.push({axis:'v',position:v,from:[0,v],to:[plane.maxU,v],quad:[[0,v-half],[plane.maxU,v-half],[plane.maxU,v+half],[0,v+half]].map(p=>project(plane.matrix,p))});
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
  function shade([x,y]) {
    let sum=0;
    for(const [dx,dy] of [[0,0],[-5,0],[5,0],[0,-5],[0,5]]) {
      const px=Math.min(1671,Math.max(0,Math.round(x+dx))),py=Math.min(940,Math.max(0,Math.round(y+dy))),i=(py*1672+px)*4;
      sum+=lightPixels[i]*.2126+lightPixels[i+1]*.7152+lightPixels[i+2]*.0722;
    }
    return Math.min(1.22,Math.max(.30,Math.pow(sum/5/160,.8)));
  }
  function strokeJoint(ctx,plane,joint,rgb) {
    const start=project(plane.matrix,joint.from),end=project(plane.matrix,joint.to);
    const gradient=ctx.createLinearGradient(...start,...end);
    for(let i=0;i<=8;i++) {
      const t=i/8,p=project(plane.matrix,joint.from.map((n,j)=>n+(joint.to[j]-n)*t)),light=shade(p);
      gradient.addColorStop(t,`rgb(${rgb.map(n=>Math.round(n*light)).join(',')})`);
    }
    path(ctx,[joint.quad]);ctx.fillStyle=gradient;ctx.fill();
  }
  function drawFace(ctx,plane,polygons,selectedFormat,grout,maxV) {
    if(!polygons.length)return;
    ctx.save();path(ctx,polygons);ctx.clip();
    for(const joint of joints(plane,selectedFormat,maxV))strokeJoint(ctx,plane,joint,grouts[grout]?.rgb||grouts.grey.rgb);
    ctx.restore();
  }
  function draw(ctx,state,room,base) {
    prepare(ctx,base);
    const c=overlay.getContext('2d');c.clearRect(0,0,1672,941);
    if(typeof room.faces!=='function'||typeof room.groutOcclusions!=='function')throw Error('Badkalibrierung und Fugenrenderer passen nicht zusammen. Bitte Seite neu laden.');
    for(const face of room.faces(state.wallHeight))drawFace(c,planes[face.plane],face.polygons,state[face.surface+'Format'],state[face.surface+'Grout'],face.maxV);
    c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#fff';c.beginPath();room.trace(c,room.groutOcclusions(state.wallHeight));c.fill();c.restore();
    ctx.drawImage(overlay,0,0);
  }
  return {formats,grouts,format,homography,project,planes,joints,draw};
});
