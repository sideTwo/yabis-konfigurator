// Apply the same surface grade as the live preview to the small decor samples.
const fs=require('fs'),vm=require('vm'),context={window:{}};
vm.createContext(context);vm.runInContext(fs.readFileSync('konfigurator-neu/materialien.js','utf8'),context);
for(const model of [...context.window.BadMaterials.floor,...context.window.BadMaterials.wall])if(model.grade){
 const pixels=fs.readFileSync('_dev/swatch-'+(model.base==='stein'?'stein':'marmor')+'.rgb'),g=model.grade;
 for(let i=0;i<pixels.length;i+=3){
  const c=[pixels[i]/255,pixels[i+1]/255,pixels[i+2]/255],l=c[0]*.2126+c[1]*.7152+c[2]*.0722;
  const t=Math.max(0,Math.min(1,(l-.82)/.16)),spec=t*t*(3-2*t)*g.highlights;
  for(let k=0;k<3;k++){const neutral=l*(1-g.saturation)+c[k]*g.saturation,toned=Math.min(1,Math.pow(neutral,g.gamma)*g.gain[k]);pixels[i+k]=Math.round(255*(toned*(1-spec)+c[k]*spec));}
 }
 fs.writeFileSync('_dev/swatch-'+model.id+'.rgb',pixels);
}
