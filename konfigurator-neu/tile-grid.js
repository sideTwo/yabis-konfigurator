/* Centimetre-based planar grids. One homography per physical room plane keeps
   each grout joint straight through every tile row and every material choice. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YabisTileGrid = api;
})(typeof window === 'object' ? window : this, () => {
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
    const z=matrix[6]*x+matrix[7]*y+matrix[8];
    return [(matrix[0]*x+matrix[1]*y+matrix[2])/z,(matrix[3]*x+matrix[4]*y+matrix[5])/z];
  }
  const wallWorld=[[0,0],[300,0],[300,120],[0,120]];
  const planes = {
    floor:{surface:'floor',maxU:300,maxV:300,matrix:homography([[0,0],[300,0],[300,300],[0,300]],[[498,639],[1168,633],[1672,941],[135,941]])},
    left:{surface:'wall',maxU:380,maxV:249,matrix:homography(wallWorld,[[498,639],[135,941],[135,268],[498,366]])},
    back:{surface:'wall',maxU:300,maxV:249,matrix:homography(wallWorld,[[498,639],[1168,633],[1168,366],[498,366]])},
    right:{surface:'wall',maxU:300,maxV:249,matrix:homography(wallWorld,[[1168,633],[1672,941],[1672,234],[1168,366]])}
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
  function eraseFixtures(ctx,room) {
    ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#fff';ctx.strokeStyle='#fff';
    path(ctx,[...room.floorOcclusions,
      [[247,456],[329,456],[331,408],[520,409],[522,449],[574,449],[574,576],[464,664],[248,664]],
      [[260,5],[441,147],[441,342],[260,288]],
      [[1513,375],[1619,366],[1619,458],[1513,457]],
      [[309,365],[353,365],[353,349],[404,349],[435,374],[435,394],[365,394],[363,404],[309,403]],
      [[1004,0],[1012,0],[1012,725],[1004,725]],
      [[1070,100],[1110,56],[1138,56],[1099,102]]
    ]);ctx.fill();
    ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=9;
    ctx.beginPath();ctx.moveTo(1094,383);ctx.lineTo(1232,383);ctx.stroke();
    for(const [x,y,r] of [[1026,406,8],[1065,406,8],[1097,407,7]]) {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(1065,414);
    for(const p of [[1058,451],[1058,480],[1064,502],[1080,509],[1095,504],[1103,490],[1101,466],[1096,429],[1097,413]])ctx.lineTo(...p);
    ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(923,640);ctx.lineTo(1008,722);ctx.lineTo(1275,722);ctx.stroke();
    ctx.restore();
  }
  function draw(ctx,state,room,base) {
    prepare(ctx,base);
    const c=overlay.getContext('2d');c.clearRect(0,0,1672,941);
    const full=state.wallHeight==='full',maxV=full?249:120;
    drawFace(c,planes.floor,room.floor,state.floorFormat,state.floorGrout,300);
    drawFace(c,planes.left,[full?room.wallsFull[0]:room.walls120[0]],state.wallFormat,state.wallGrout,maxV);
    const backOutside=full?[room.wallsFull[1],room.wallsFull[2],room.wallsFull[3]]:[room.walls120[1]];
    drawFace(c,planes.back,backOutside,state.wallFormat,state.wallGrout,maxV);
    drawFace(c,planes.back,[
      [[888,80],[945,80],[945,639],[888,639]],[[945,80],[1008,80],[1008,100],[945,100]],
      [[1008,80],[1168,80],[1168,633],[1008,633]]
    ],state.wallFormat,state.wallGrout,249);
    drawFace(c,planes.right,[full?room.wallsFull[4]:room.walls120[2]],state.wallFormat,state.wallGrout,maxV);
    drawFace(c,planes.right,[[[1168,80],[1247,0],[1275,0],[1275,697],[1168,633]]],state.wallFormat,state.wallGrout,249);
    eraseFixtures(c,room);ctx.drawImage(overlay,0,0);
  }
  return {formats,grouts,format,homography,project,planes,joints,draw};
});
