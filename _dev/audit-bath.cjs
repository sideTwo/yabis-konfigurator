/* Optional developer check, no dependency or AI service in the website.
   Uses the production renderer with a native canvas. Install @napi-rs/canvas
   for development or set YABIS_CANVAS_PACKAGE to an existing package path. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const anchors=[
 ['floor',[150,930]],['floor',[490,680]],['floor',[710,645]],['floor',[870,650]],['floor',[900,652]],['floor',[960,705]],['floor',[1005,728]],['floor',[1280,728]],['floor',[1450,900]],['floor',[1660,935]],
 ['wall',[20,500]],['wall',[140,800]],['wall',[200,700]],['wall',[50,300]],['wall',[600,630]],['wall',[700,625]],['wall',[708,500]],['wall',[881,500]],['wall',[881,620]],['wall',[600,500]],['wall',[800,400]],['wall',[985,500]],['wall',[980,620]],
 ['wall',[930,200]],['wall',[940,620]],['wall',[950,300]],['wall',[952,600]],['wall',[1018,120]],['wall',[1150,620]],['wall',[1100,300]],['wall',[1060,530]],['wall',[1050,90]],['wall',[1200,200]],['wall',[1260,650]],['wall',[1268,100]],['wall',[1280,500]],['wall',[1640,700]],['wall',[1640,910]],
 ['fixed',[750,200]],['fixed',[540,200]],['fixed',[700,369]],['fixed',[985,300]],['fixed',[1450,700]],['fixed',[1100,680]],['vanity',[350,550]],['fixed',[800,20]]
];
async function audit({repo=path.resolve(__dirname,'..'),output=path.join(repo,'_dev/schirm/bad-audit'),materials}={}){
 const {createCanvas,loadImage}=require(process.env.YABIS_CANVAS_PACKAGE||'@napi-rs/canvas');
 const R=require(path.join(repo,'konfigurator-neu/standbild-renderer.js')),G=require(path.join(repo,'konfigurator-neu/tile-grid.js'));
 fs.mkdirSync(output,{recursive:true});
 const doc={createElement(){const c=createCanvas(R.width,R.height);c.ownerDocument=doc;return c;}};
 const make=()=>doc.createElement('canvas'),pixels=c=>c.getContext('2d').getImageData(0,0,R.width,R.height).data;
 function mask(polygons,holes=[]){const c=make(),ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.beginPath();R.trace(ctx,polygons);ctx.fill();if(holes.length){ctx.globalCompositeOperation='destination-out';ctx.beginPath();R.trace(ctx,holes);ctx.fill();}return pixels(c);}
 const issues=[],notes=[],materialIds=materials||require(path.join(repo,'js/studio-core.js')).materials;
 if(!materialIds.length||materialIds.some(id=>!(/^[a-z0-9][a-z0-9-]{0,79}$/).test(id)))throw Error('Gültige Material-IDs angeben.');
 const pairs=materialIds.length<=4?materialIds.flatMap(floor=>materialIds.map(wall=>[floor,wall])):[[materialIds[0],materialIds[0]],...materialIds.slice(1).flatMap(id=>[[id,materialIds[0]],[materialIds[0],id],[id,id]])];
 const sampling=materialIds.length<=4?'full-cartesian':'reference-and-self';
 const C=require(path.join(repo,'js/studio-core.js'));
 const assetNames=[...new Set([C.bathAssets.base,C.bathAssets.fixtures,C.bathAssets.poster,...materialIds.map(C.bathPlate)])],assets={};
 for(const name of assetNames){const image=await loadImage(path.join(repo,name));if(image.width!==R.width||image.height!==R.height)throw Error(`Falsches Bildformat ${name}: ${image.width} × ${image.height}, erwartet ${R.width} × ${R.height}`);assets[name]=image;}
 const base=assets[C.bathAssets.base],fixtures=assets[C.bathAssets.fixtures];
 const colors={floor:[32,64,224],wall:[32,208,64],fixed:[224,32,192],vanity:[240,208,32]},solid={};
 for(const [key,rgb]of Object.entries(colors)){const c=make(),ctx=c.getContext('2d');ctx.fillStyle=`rgb(${rgb})`;ctx.fillRect(0,0,R.width,R.height);solid[key]=c;}
 let anchorChecks=0;
 for(const height of ['120','full']){
  const c=make();R.render(c.getContext('2d'),{base:solid.fixed,floor:solid.floor,wall:solid.wall,fixtures:solid.vanity,wallHeight:height});const data=pixels(c);
  const extra=[[height==='full'?'wall':'fixed',[520,250]],[height==='full'?'wall':'fixed',[900,250]],[height==='full'?'wall':'fixed',[924,300]],[height==='full'?'wall':'fixed',[200,120]],[height==='full'?'wall':'fixed',[1450,100]]];
  for(const [owner,[x,y]]of [...anchors,...extra]){const i=(y*R.width+x)*4;anchorChecks++;if(colors[owner].some((v,j)=>Math.abs(data[i+j]-v)>2))issues.push({check:'edge-owner',height,point:[x,y],expected:owner,actual:[...data.slice(i,i+4)]});}
 }
 const photos=[],images={},interiorMasks=new WeakMap();let stableComparisons=0,independenceComparisons=0,ceilingMaterialChecks=0;
 // A rounded 255 mask pixel can still contain fractional edge coverage in Skia.
 // Compare exact RGB only one pixel inside each surface; geometry/grout checks
 // below continue to inspect the original masks, including all their edges.
 function interior(mask){if(interiorMasks.has(mask))return interiorMasks.get(mask);const indexes=[];for(let y=1;y<R.height-1;y++)for(let x=1;x<R.width-1;x++){const i=(y*R.width+x)*4;let solid=true;for(let dy=-1;dy<=1&&solid;dy++)for(let dx=-1;dx<=1;dx++)if(mask[i+(dy*R.width+dx)*4+3]!==255){solid=false;break;}if(solid)indexes.push(i);}interiorMasks.set(mask,indexes);return indexes;}
 function digest(data,selectedMask){const indexes=interior(selectedMask),selected=Buffer.allocUnsafe(indexes.length*3);let end=0;for(const i of indexes){selected[end++]=data[i];selected[end++]=data[i+1];selected[end++]=data[i+2];}return crypto.createHash('sha256').update(selected).digest('hex');}
 for(const height of ['120','full']){
  const tileFaces=R.faces(height),fixed=mask(R.fixedMasks(height).concat(R.fixtureOcclusions));
  const floorMask=mask(tileFaces.filter(f=>f.surface==='floor').flatMap(f=>f.polygons),[...R.fixedMasks(height),...R.fixtureOcclusions]);
  const wallMask=mask(tileFaces.filter(f=>f.surface==='wall').flatMap(f=>f.polygons),[...R.fixedMasks(height),...R.fixtureOcclusions]);
  const floorHashes=new Map(),wallHashes=new Map();let referenceFixed;
  for(const [floor,wall] of pairs){
   const c=make(),ctx=c.getContext('2d'),state={floor,wall,wallHeight:height,floorFormat:[60,120],wallFormat:[60,120],floorGrout:'dark',wallGrout:'dark'};
   R.render(ctx,{base,fixtures,floor:assets[C.bathPlate(floor)],wall:assets[C.bathPlate(wall)],wallHeight:height,wallRegistration:C.bathRegistration(wall)});
   const raw=pixels(c);
   if(height==='full'&&wall==='bercy-terra')for(const [x,y]of [[445,35],[465,55],[485,75]]){const i=(y*R.width+x)*4;ceilingMaterialChecks++;if(raw[i]-raw[i+1]<12)issues.push({check:'untiled-ceiling-strip',point:[x,y],rgb:[...raw.slice(i,i+3)]});}
   for(const [surface,id,hashes,selectedMask]of [['floor',floor,floorHashes,floorMask],['wall',wall,wallHashes,wallMask]]){const value=digest(raw,selectedMask);if(hashes.has(id)){independenceComparisons++;if(hashes.get(id)!==value)issues.push({check:'surface-coupling',height,floor,wall,surface});}else hashes.set(id,value);}
   G.draw(ctx,state,R,base);const final=pixels(c),fixedHash=digest(final,fixed);if(!referenceFixed)referenceFixed=fixedHash;
   stableComparisons++;if(referenceFixed!==fixedHash)issues.push({check:'fixed-object-drift',height,floor,wall});
   const name=`${height}-${floor}-${wall}.png`;fs.writeFileSync(path.join(output,name),c.toBuffer('image/png'));photos.push(name);
   // The contact sheet keeps at most eight canvases; a large assortment does
   // not keep hundreds of full-size photos in memory.
   if(Object.keys(images).length<8)images[name]=c;
  }
 }
 let groutVariants=0,independentGroutVariants=0;
 for(const height of ['120','full']){
  const tileMask=mask(R.faces(height).flatMap(f=>f.polygons),R.groutOcclusions(height)),protectedMask=mask(R.groutOcclusions(height));
  for(const format of G.formats)for(const grout of Object.keys(G.grouts)){
   const c=make();G.draw(c.getContext('2d'),{wallHeight:height,floorFormat:format,wallFormat:format,floorGrout:grout,wallGrout:grout},R,base);const data=pixels(c);let outside=0,overObjects=0,visible=0;
   for(let i=3;i<data.length;i+=4){if(data[i]>64){visible++;if(tileMask[i]===0&&protectedMask[i]===0)outside++;}if(data[i]>2&&protectedMask[i]===255)overObjects++;}
   groutVariants++;if(outside||overObjects||!visible)issues.push({check:'grout-boundaries',height,format,grout,outside,overObjects,visible});
  }
  for(const surface of ['floor','wall']){
   const other=surface==='floor'?'wall':'floor',ownMask=mask(R.faces(height).filter(f=>f.surface===surface).flatMap(f=>f.polygons),R.groutOcclusions(height)),otherMask=mask(R.faces(height).filter(f=>f.surface===other).flatMap(f=>f.polygons),R.groutOcclusions(height)),ownHashes=new Set();let otherReference;
   for(const format of G.formats)for(const grout of Object.keys(G.grouts)){
    const c=make(),state={wallHeight:height,floorFormat:[60,120],wallFormat:[60,120],floorGrout:'light',wallGrout:'light',[surface+'Format']:format,[surface+'Grout']:grout};G.draw(c.getContext('2d'),state,R,base);const data=pixels(c),otherHash=digest(data,otherMask);ownHashes.add(digest(data,ownMask));if(!otherReference)otherReference=otherHash;else if(otherReference!==otherHash)issues.push({check:'grout-surface-coupling',height,surface,format,grout});independentGroutVariants++;
   }
   if(ownHashes.size!==G.formats.length*Object.keys(G.grouts).length)issues.push({check:'inert-format-or-grout-control',height,surface,distinct:ownHashes.size});
  }
 }
 const sheet=createCanvas(R.width,2000),s=sheet.getContext('2d');s.fillStyle='#f1f3f2';s.fillRect(0,0,sheet.width,sheet.height);
 Object.keys(images).forEach((name,i)=>{const x=i%2*836,y=Math.floor(i/2)*500;s.fillStyle='#344c3a';s.font='14px Arial';s.fillText(name.replace('.png',''),x+8,y+19);s.drawImage(images[name],x,y+25,836,470.5);});
 fs.writeFileSync(path.join(output,'combinations.png'),sheet.toBuffer('image/png'));
 notes.push('Native Skia renders of the actual production canvas code; this is not a Safari or browser-layout screenshot.');
 notes.push('Exact 1672 × 941 assets required. Test newly generated material plates with this audit before activating them.');
 notes.push('Exact RGB independence hashes use a one-pixel interior margin to exclude fractional antialiasing at shared edges. Ownership anchors and grout leak checks use unmodified masks.');
 const report={calibration:R.calibration,passed:issues.length===0,materials:materialIds,sampling,assetDimensionsChecked:assetNames.length,photoCombinations:photos.length,anchorChecks,ceilingMaterialChecks,stableComparisons,independenceComparisons,groutVariants,independentGroutVariants,issues,notes};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));return report;
}
module.exports={audit,anchors};
if(require.main===module)audit({repo:process.cwd(),output:process.argv[2]||path.resolve('_dev/schirm/bad-audit'),materials:process.argv[3]?process.argv[3].split(','):undefined}).then(report=>{console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
