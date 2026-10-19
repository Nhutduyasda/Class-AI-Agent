import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {makePlan,segment,ssmlFor,billing,escapeXml,digest,validatePlan,containedPath,safeId} from './core.mjs';
import {validateAuthorization,validateVoiceEvidence,checkVoices,runPlan,validateBriefSource} from './runner.mjs';
import {buildTimeline,subtitles} from './timing.mjs';
import {inspectWave} from '../marketing03/direct-audio.mjs';
import {activeAtFrame} from '../../src/BilingualVoiceClock.ts';
const profile=JSON.parse(await readFile('config/bilingual-voice.json','utf8'));
const price=JSON.parse(await readFile('config/bilingual-neural-price.json','utf8'));
const sample=JSON.parse(await readFile('briefs/bilingual-sample-approved.json','utf8'));
function planFor(text='Ví dụ: I saw a cat.',mode='multivoice',id='offline-test'){
 const brief={id,approved:true,spokenSegments:[{id:'demo',spoken:text}]};return makePlan(brief,Buffer.from(JSON.stringify(brief)),profile,price,{mode});
}
function auth(plan,patch={}){return {scope:'BILINGUAL_V1',liveSynthesisAllowed:true,approvalId:'OFFLINE_TEST_ONLY',productionId:plan.productionId,planSha256:plan.planSha256,expiresAt:new Date(Date.now()+3600000).toISOString(),limitUsd:.01,maxRequests:plan.requestCount,requestIds:plan.requests.map(r=>r.id),maxAttemptsPerRequest:1,mode:plan.mode,priceUsdPerMillion:price.usdPerMillion,...patch};}
function fixtureWave(){
 // Synthetic tone tests binary transport/storage only; never a voice-quality sample.
 const n=48000,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.sin(i*Math.PI*2*440/48000)*1000),44+i*2);return b;
}
for(const text of [...profile.englishExamples])test('English clause / canonical: '+text,()=>{
 const input='Ví dụ: '+text+' Sau đó, mình tự luyện.';const r=segment(input,{},profile);assert.equal(r.spans.map(s=>s.text).join(''),input);assert.ok(r.spans.some(s=>s.text.includes(text)&&s.voice==='en-US-AndrewNeural'));assert.equal(r.warnings.length,0);
});
test('mixed example selects Vietnamese, Andrew sentence and contextual article',()=>{
 const text='Ví dụ, mình viết: I saw a cat. Vì đang nói đến một con mèo chưa xác định, mình dùng A.';const r=segment(text,{},profile);assert.equal(r.spans.map(s=>s.text).join(''),text);assert.ok(r.spans.some(s=>s.text==='A'&&s.phoneme==='ə'&&s.voice==='en-US-AndrewNeural'));assert.equal(r.spans[0].voice,'vi-VN-NamMinhNeural');assert.equal(r.warnings.length,0);
});
test('contextual A / AN / THE including a list',()=>{
 const r=segment('A, AN, THE… mình dùng AN. Mình chọn THE.',{},profile);for(const word of ['A','AN','THE'])assert.ok(r.spans.some(s=>s.text===word&&s.language==='en-US'&&s.phoneme));
});
test('Vietnamese letters and proper names are not blindly English',()=>{
 const r=segment('Bạn An học lớp A. AI và ChatGPT giúp mình.',{},profile);assert.ok(!r.spans.some(s=>s.language==='en-US'));assert.equal(r.spans.map(s=>s.text).join(''),'Bạn An học lớp A. AI và ChatGPT giúp mình.');
});
test('named term Error Log is Andrew; ChatGPT protected by default',()=>{
 const r=segment('Mình nhờ ChatGPT kiểm tra Error Log.',{},profile);assert.ok(r.spans.some(s=>s.text==='ChatGPT'&&s.language==='vi-VN'));assert.ok(r.spans.some(s=>s.text==='Error Log'&&s.language==='en-US'));
});
test('manual pronunciation metadata supports proper names in either language',()=>{
 const t='Mình nhờ John kiểm tra.';const start=t.indexOf('John');const r=segment(t,{spans:[{start,end:start+4,text:'John',language:'en-US'}]},profile);assert.ok(r.spans.some(s=>s.text==='John'&&s.language==='en-US'));assert.equal(r.warnings.length,0);
 const vi=segment(t,{spans:[{start,end:start+4,text:'John',language:'vi-VN'}]},profile);assert.equal(vi.warnings.length,0);
});
test('unknown Latin text blocks live plan until classified',()=>{
 const plan=planFor('Ví dụ: beautiful tomorrow.');assert.ok(plan.warnings.length>0);assert.throws(()=>validateAuthorization(plan,auth(plan),null,{offline:true}),/UNRESOLVED/);
});
test('stale, overlapping or invalid manual metadata rejected',()=>{
 assert.throws(()=>segment('I saw a cat.',{spans:[{start:0,end:1,text:'X',language:'en-US'}]},profile));
 assert.throws(()=>segment('I saw a cat.',{spans:[{start:0,end:5,text:'I saw',language:'en-US'},{start:3,end:5,text:'aw',language:'vi-VN'}]},profile));
 assert.throws(()=>segment('I saw a cat.',{spans:[{start:0,end:1,text:'I',language:'en-US',phoneme:'<bad>'}]},profile));
});
test('exact copy includes whitespace, XML-sensitive characters and Unicode',()=>{
 const text='Ví dụ:\n  I saw a cat. & <x> "đúng" — 😀';const r=segment(text,{},profile);assert.equal(r.spans.map(s=>s.text).join(''),text);const ssml=ssmlFor(r.spans);assert.ok(ssml.includes('&amp;'));assert.ok(ssml.includes('&lt;x&gt;'));assert.ok(ssml.includes('&quot;'));assert.ok(!ssml.includes('<x>'));assert.equal(escapeXml("'"),'&apos;');
});
test('SSML does not inject rate, pitch, translation or language-only fallback',()=>{
 const plan=planFor();const xml=plan.requests[0].ssml;assert.match(xml,/vi-VN-NamMinhNeural/);assert.match(xml,/en-US-AndrewNeural/);assert.ok(!/<(?:lang|prosody|sub)\b/.test(xml));
});
test('billable markup count includes phonemes; text codepoints differ',()=>{
 const plain=ssmlFor([{text:'A',voice:'en-US-AndrewNeural'}]),ph=ssmlFor([{text:'A',voice:'en-US-AndrewNeural',phoneme:'ə'}]);assert.equal(billing(plain).billableCharacters,1);assert.ok(billing(ph).billableCharacters>1);assert.equal(billing(ssmlFor([{text:'😀',voice:'en-US-AndrewNeural'}])).billableCharacters,1);
});
test('multi-voice preferred: one request, and fallback split preserves exact text',()=>{
 const a=makePlan(sample,Buffer.from(JSON.stringify(sample)),profile,price);assert.equal(a.requestCount,1);assert.equal(a.warnings.length,0);assert.equal(a.requests.map(r=>r.text).join(''),sample.spokenSegments[0].spoken);
 const b=makePlan(sample,Buffer.from(JSON.stringify(sample)),profile,price,{mode:'split'});assert.ok(b.requestCount>1);assert.equal(b.requests.map(r=>r.text).join(''),sample.spokenSegments[0].spoken);assert.notEqual(a.planSha256,b.planSha256);
});
test('new scoped cost approval required; old video budgets never work',()=>{
 const plan=planFor();for(const policy of [null,{}, {liveSynthesisAllowed:true,limitUsd:.05},auth(plan,{scope:'VIDEO04'}),auth(plan,{maxRequests:100}),auth(plan,{planSha256:'bad'}),auth(plan,{limitUsd:0}),auth(plan,{expiresAt:'2020-01-01'}),auth(plan,{maxAttemptsPerRequest:2}),auth(plan,{priceUsdPerMillion:999})])assert.throws(()=>validateAuthorization(plan,policy,null,{offline:true}));assert.doesNotThrow(()=>validateAuthorization(plan,auth(plan),null,{offline:true}));
});
test('historical video IDs protected at live boundary',()=>{
 const p=planFor('I saw a cat.','multivoice','marketing-video-04');assert.throws(()=>validateAuthorization(p,auth(p),null,{offline:true}),/HISTORICAL/);
});
test('plan and SSML integrity are bound',()=>{
 const plan=planFor();validatePlan(plan);const changed=structuredClone(plan);changed.requests[0].ssml+=' ';assert.throws(()=>validatePlan(changed),/PLAN_CHANGED/);
});
test('regional voice catalogue check is GET-only and requires both exact Neural voices',async()=>{
 let calls=0;const response=await checkVoices({SPEECH_KEY:'offline-fixture-key'},async(url,opts)=>{calls++;assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');assert.match(url,/southeastasia/);return {ok:true,json:async()=>[{ShortName:'vi-VN-NamMinhNeural',VoiceType:'Neural'},{ShortName:'en-US-AndrewNeural',VoiceType:'Neural'}]};});assert.equal(calls,1);validateVoiceEvidence(response);assert.throws(()=>validateVoiceEvidence({...response,voices:response.voices.slice(0,1)}));assert.throws(()=>validateVoiceEvidence({...response,checkedAt:'2020-01-01'}));
});
test('live validation requires current voice and public price evidence, without synthesis',()=>{
 const plan=planFor(),e={kind:'AZURE_VOICES_LIST',region:'southeastasia',resource:'english-journey-namminh',endpoint:'https://southeastasia.tts.speech.microsoft.com/cognitiveservices/voices/list',checkedAt:new Date().toISOString(),voices:[{ShortName:'vi-VN-NamMinhNeural',VoiceType:'Neural'},{ShortName:'en-US-AndrewNeural',VoiceType:'Neural'}]};
 assert.doesNotThrow(()=>validateAuthorization(plan,auth(plan),e));assert.throws(()=>validateAuthorization(plan,auth(plan),null));
 const old=structuredClone(plan);old.pricing.checkedAt='2020-01-01';delete old.planSha256;old.planSha256=digest(JSON.stringify(old));assert.throws(()=>validateAuthorization(old,auth(old),e),/CURRENT_NEURAL_PRICE/);
});
test('Windows paths, traversal and reserved device names',()=>{
 const win=path.win32;assert.equal(containedPath('C:\\Video Root',['out','bilingual','mẫu.wav'],win),'C:\\Video Root\\out\\bilingual\\mẫu.wav');for(const pieces of [['..','secret'],['D:\\escape'],['C:\\Video Root2\\x']])assert.throws(()=>containedPath('C:\\Video Root',pieces,win));assert.equal(safeId('CON'),false);assert.equal(safeId('../demo'),false);assert.equal(safeId('new-video-05'),true);
});
test('WAV validation detects malformed, truncated and wrong sample-rate payloads',()=>{
 const b=fixtureWave();assert.equal(inspectWave(b).sampleRate,48000);assert.throws(()=>inspectWave(b.subarray(0,b.length-1)));const wrong=Buffer.from(b);wrong.writeUInt32LE(24000,24);assert.throws(()=>inspectWave(wrong));
});
async function testRoot(){await mkdir('.cache/bilingual-tests',{recursive:true});return mkdtemp(path.resolve('.cache/bilingual-tests/case-'));}
test('offline transport verifies WAV; successful cached rerun sends zero more calls',async()=>{
 const root=await testRoot(),plan=planFor();let calls=0;const transport=async()=>{calls++;return fixtureWave();};const cfg={projectRoot:root,plan,authorization:auth(plan),offline:true,transport};const a=await runPlan(cfg);assert.equal(a.status,'ALL_WAV_VERIFIED');await runPlan(cfg);assert.equal(calls,1);const ledger=JSON.parse(await readFile(path.join(a.output,'ledger.json')));assert.equal(ledger.kind,'OFFLINE_FIXTURE_ONLY');
 await writeFile(path.join(a.output,'demo.wav'),Buffer.from('CORRUPTED'));await assert.rejects(runPlan(cfg));assert.equal(calls,1);
});
test('ambiguous attempt persists and stops ALL subsequent requests and reruns',async()=>{
 const root=await testRoot(),plan=planFor('Ví dụ: I saw a cat.','split');let calls=0;const cfg={projectRoot:root,plan,authorization:auth(plan),offline:true,transport:async()=>{calls++;throw Error('SIMULATED_TIMEOUT');}};await assert.rejects(runPlan(cfg));await assert.rejects(runPlan(cfg));assert.equal(calls,1);const ledger=JSON.parse(await readFile(path.join(root,'out/bilingual/offline-test/ledger.json')));assert.equal(ledger.calls[0].attempts,1);assert.equal(ledger.calls[0].status,'FAILED_OR_AMBIGUOUS_NO_RETRY');assert.ok(ledger.calls.slice(1).every(c=>c.attempts===0));
});
test('missing cost approval cannot enter transport',async()=>{
 const root=await testRoot(),plan=planFor();let calls=0;await assert.rejects(runPlan({projectRoot:root,plan,authorization:{},offline:true,transport:async()=>{calls++;return fixtureWave();}}));assert.equal(calls,0);
});
test('live source is reread and any script change after planning is rejected',async()=>{
 const root=await testRoot(),brief={id:'new-video-05',approved:true,spokenSegments:[{id:'demo',spoken:'I saw a cat.'}]},bytes=Buffer.from(JSON.stringify(brief));await mkdir(path.join(root,'briefs'));await writeFile(path.join(root,'briefs/new.json'),bytes);const plan=makePlan(brief,bytes,profile,price,{briefRelativePath:'briefs/new.json'});await validateBriefSource(root,plan);await writeFile(path.join(root,'briefs/new.json'),JSON.stringify({...brief,spokenSegments:[{id:'demo',spoken:'I ate an apple.'}]}));await assert.rejects(validateBriefSource(root,plan),/APPROVED_BRIEF_CHANGED/);
});
test('session lock prevents two simultaneous offline submissions',async()=>{
 const root=await testRoot(),plan=planFor();let release,entered;const enteredPromise=new Promise(r=>{entered=r;});const gate=new Promise(r=>{release=r;});let calls=0;
 const cfg={projectRoot:root,plan,authorization:auth(plan),offline:true,transport:async()=>{calls++;entered();await gate;return fixtureWave();}};
 const first=runPlan(cfg);await enteredPromise;await assert.rejects(runPlan(cfg));release();await first;assert.equal(calls,1);
});
test('split fallback cannot reuse a multi-voice cost authorization',()=>{
 const multi=planFor(),split=planFor('Ví dụ: I saw a cat.','split');assert.throws(()=>validateAuthorization(split,auth(multi),null,{offline:true}));
});
function timingFixture(mode='multivoice'){
 const plan=planFor('Ví dụ: I saw a cat. Mình dùng A.',mode);const files=plan.requests.map(r=>({id:r.id,kind:'OFFLINE_FIXTURE_ONLY',sha256:digest(r.text),sampleRate:48000,samples:480000,planSha256:plan.planSha256})),obs=[];
 for(const r of plan.requests){const words=[...r.text.matchAll(/\S+/g)];words.forEach((w,i)=>obs.push({requestId:r.id,audioSha256:digest(r.text),kind:'AZURE_BOUNDARY',textStart:w.index,textEnd:w.index+w[0].length,canonicalText:w[0],startMs:100+i*180,endMs:230+i*180}));}return {plan,files,obs};
}
for(const mode of ['multivoice','split'])test('observed timing, voice spans, article events and canonical subtitles: '+mode,()=>{
 const {plan,files,obs}=timingFixture(mode),m=buildTimeline(plan,files,obs,{allowOffline:true});assert.equal(m.fps,30);assert.ok(m.voiceSpans.some(s=>s.voice==='en-US-AndrewNeural'));assert.ok(m.events.some(e=>e.article==='A'));assert.ok(m.durationSeconds>=10);assert.match(subtitles(m.pages),/I saw a cat\./);assert.match(subtitles(m.pages,'vtt'),/^WEBVTT/);assert.ok(m.segments.every(s=>s.speechEndMs<s.endMs));
});
test('mock or incomplete timing cannot masquerade as production',()=>{
 const {plan,files,obs}=timingFixture();assert.throws(()=>buildTimeline(plan,files,obs));assert.throws(()=>buildTimeline(plan,files,[],{allowOffline:true}));for(const patch of [{startMs:NaN},{audioSha256:'bad'},{endMs:999999},{canonicalText:'rewritten'},{kind:'EVEN_SPLIT'}]){const changed=structuredClone(obs);Object.assign(changed[0],patch);assert.throws(()=>buildTimeline(plan,files,changed,{allowOffline:true}));}
});
test('Remotion clock uses actual frame time for Andrew, captions and article animation',()=>{
 const {plan,files,obs}=timingFixture(),m=buildTimeline(plan,files,obs,{allowOffline:true});const span=m.voiceSpans.find(s=>s.language==='en-US'),frame=Math.ceil(span.startMs*.03),clock=activeAtFrame(m,frame);assert.equal(clock.voiceSpan.voice,'en-US-AndrewNeural');assert.ok(clock.caption);const event=m.events.at(-1);assert.equal(activeAtFrame(m,event.frame).articleEvent.article,event.article);assert.equal(activeAtFrame(m,0).voiceSpan,null);assert.equal(activeAtFrame(m,m.durationInFrames).articleEvent,null);
});
test('phrase-closing quotes do not assign English audio to the following Vietnamese voice',()=>{
 const text='‘I saw a cat.’ Mình tự luyện.',brief={id:'quoted-fixture',approved:true,spokenSegments:[{id:'demo',spoken:text,voiceProduction:{spans:[{start:1,end:13,text:'I saw a cat.',language:'en-US'}]}}]};
 const plan=makePlan(brief,Buffer.from(JSON.stringify(brief)),profile,price),hash=digest(text),files=[{id:'demo',kind:'OFFLINE_FIXTURE_ONLY',sha256:hash,sampleRate:48000,samples:144000,planSha256:plan.planSha256}];
 const obs=[{requestId:'demo',audioSha256:hash,kind:'LOCAL_ASR_OBSERVED',textStart:0,textEnd:14,canonicalText:text.slice(0,14),startMs:100,endMs:900},{requestId:'demo',audioSha256:hash,kind:'LOCAL_ASR_OBSERVED',textStart:15,textEnd:text.length,canonicalText:text.slice(15),startMs:1200,endMs:1800}];
 const m=buildTimeline(plan,files,obs,{allowOffline:true});assert.equal(m.voiceSpans.find(s=>s.language==='vi-VN').startMs,1200);assert.equal(m.voiceSpans.find(s=>s.language==='en-US').endMs,900);
});
