import {createServer} from 'node:http';
import {once} from 'node:events';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {localTestWave} from './local-fixture.mjs';
import {saveVerifiedWave,sha256,ssml,FORMAT} from './direct-audio.mjs';

const out=resolve(process.argv[2]||'out/marketing03/pipeline-check');await mkdir(out,{recursive:true});
const run=out+'/run-'+Date.now();await mkdir(run);
const baseline=await readFile('docs/reviews/marketing03/azure-ledger.json');
const brief=JSON.parse(await readFile('briefs/marketing-video-03-approved.json','utf8'));
const expectedBody=ssml(brief.spokenSegments[0].spoken),wave=localTestWave();let requests=0;
const server=createServer(async(req,res)=>{
 requests++;const chunks=[];for await(const c of req)chunks.push(c);
 if(req.method!=='POST'||Buffer.concat(chunks).toString()!==expectedBody||req.headers['x-microsoft-outputformat']!==FORMAT){res.writeHead(400);res.end();return;}
 res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':wave.length});
 // Exercise binary chunking, not a single in-memory write disguised as HTTP.
 res.write(wave.subarray(0,71));res.write(wave.subarray(71,7103));res.end(wave.subarray(7103));
});
server.listen(0,'127.0.0.1');await once(server,'listening');
try{
 const response=await fetch('http://127.0.0.1:'+server.address().port,{method:'POST',headers:{'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':FORMAT},body:expectedBody,signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('Local mock HTTP failure');
 const bytes=Buffer.from(await response.arrayBuffer());
 const receipt=await saveVerifiedWave(bytes,run+'/LOCAL-TEST-TONE-NOT-NAMMINH.wav',{kind:'LOCAL_TEST_ONLY',description:'Two-second synthesized sine test tone; no speech and no Azure service'});
 if(receipt.sha256!==sha256(wave)||!baseline.equals(await readFile('docs/reviews/marketing03/azure-ledger.json')))throw Error('Roundtrip or ledger integrity failure');
 const result={status:'PASS_LOCAL_HTTP_BINARY_WAV_ROUNDTRIP',azureRequests:0,localHttpRequests:requests,ledgerUnchanged:true,receipt};
 await writeFile(out+'/local-smoke.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{server.close();await once(server,'close');}
