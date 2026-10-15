import test from 'node:test';
import assert from 'node:assert/strict';
import {getPlan,ssml,isPcmWave48kMono,VOICE} from './azure-namminh-auditions.mjs';
const brief={approval:{status:'OWNER_APPROVED_V1_1',spokenCopyLocked:true},spokenSegments:[
{id:'hook',spoken:'Học 10 từ tiếng Anh hôm nay… vài ngày sau quên gần hết? Bạn có đang như vậy không?'},
{id:'demo',spoken:'Ví dụ với từ improve, nghĩa là cải thiện. AI không chỉ giải thích, mà còn yêu cầu mình tự đặt câu. Mình viết: I want to improve my English. Sau đó, AI kiểm tra và giúp mình sửa nếu có lỗi.'}
]};
test('two approved samples have exactly 270 characters and expected quote',()=>{
 const p=getPlan(brief);assert.deepEqual(p.entries.map(x=>x.id),['A-HOOK','B-DEMO']);
 assert.equal(p.characters,270);assert.equal(p.estimatedUSD,0.00405);
});
test('rejects changed approval and excessive chars',()=>{
 assert.throws(()=>getPlan({...brief,approval:{status:'DRAFT'}}));
 assert.throws(()=>getPlan({...brief,spokenSegments:[brief.spokenSegments[0],{id:'demo',spoken:'X'.repeat(400)}]}));
});
test('voice matches Nam Minh and SSML does not shift pitch or rate',()=>{
 const s=ssml('mình & bạn <học>');
 assert.ok(s.includes('name="'+VOICE+'"'));
 assert.ok(s.includes('mình &amp; bạn &lt;học&gt;'));
 assert.ok(!s.includes('prosody'));
});
test('detects malformed audio',()=>{
 assert.equal(isPcmWave48kMono(Buffer.from('error message')),false);
 const b=Buffer.alloc(44);b.write('RIFF',0);b.write('WAVE',8);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt16LE(16,34);
 assert.equal(isPcmWave48kMono(b),true);
});
