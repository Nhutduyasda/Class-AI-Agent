// Enumerates existing compositions only. No renderMedia/renderStill import or call.
import os from 'node:os';
try{os.networkInterfaces();}catch{os.networkInterfaces=()=>({lo:[{address:'127.0.0.1',family:'IPv4',internal:true,netmask:'255.0.0.0',mac:'00:00:00:00:00:00',cidr:'127.0.0.1/8'}]});}
import {bundle} from '@remotion/bundler';
import {getCompositions,ensureBrowser} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {findBrowser} from './browser.mjs';
const browserExecutable=await findBrowser();if(!browserExecutable)throw Error('No browser; run setup-browser.mjs --install');
const status=await ensureBrowser({browserExecutable});
const results=[];
for(const entry of ['src/index.tsx','src/marketing02-index.tsx']){
 const serveUrl=await bundle({entryPoint:resolve(entry),publicDir:resolve('public')});
 const list=await getCompositions(serveUrl,{browserExecutable,timeoutInMilliseconds:30000});
 if(!list.length)throw Error('No composition discovered');
 results.push({entry,compositions:list.map(({id,width,height,fps,durationInFrames})=>({id,width,height,fps,durationInFrames}))});
}
const report={status:'PASS_BROWSER_START_AND_COMPOSITION_ENUMERATION',browserExecutable,browserVersion:execFileSync(browserExecutable,['--version'],{encoding:'utf8'}).trim(),ensureBrowser:status,results,video03Rendered:false,mediaFramesRendered:0,azureRequests:0};
await mkdir('out/marketing03/pipeline-check',{recursive:true});await writeFile('out/marketing03/pipeline-check/remotion-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
