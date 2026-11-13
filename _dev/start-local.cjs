// Starts only this local preview; an existing server is reused.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),url='http://127.0.0.1:8765/konfigurator-neu/index.html';
function available(){return new Promise(resolve=>{const request=http.get(url,response=>{response.resume();resolve(response.statusCode===200);});request.setTimeout(800,()=>request.destroy());request.on('error',()=>resolve(false));});}
(async()=>{
 if(!await available()){
  const output=fs.openSync(path.join(__dirname,'server.log'),'a'),errors=fs.openSync(path.join(__dirname,'server-error.log'),'a');
  const child=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',output,errors]});
  child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.unref();fs.closeSync(output);fs.closeSync(errors);
  for(let attempt=0;attempt<30;attempt++){if(await available()){console.log('Badstudio bereit: '+url);return;}await new Promise(resolve=>setTimeout(resolve,150));}
  throw Error('Der lokale Server konnte nicht gestartet werden. Details stehen in _dev/server-error.log.');
 }
 console.log('Badstudio bereit: '+url);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
