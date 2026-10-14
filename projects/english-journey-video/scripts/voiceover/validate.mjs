import assert from 'node:assert/strict';

export function validateVoiceManifest(m, brief) {
  assert.equal(m.fps,30);
  assert.ok(m.durationSeconds >= 35 && m.durationSeconds <= 45);
  assert.equal(m.durationInFrames,Math.round(m.durationSeconds*m.fps));
  assert.equal(m.totalSamples,Math.round(m.durationSeconds*m.sampleRate));
  assert.deepEqual(m.scenes.map(s=>s.type),['hook','before','teach','after','cta']);
  assert.equal(m.scenes[0].startFrame,0);
  assert.equal(m.scenes.at(-1).endFrame,m.durationInFrames);
  for(const [index,scene] of m.scenes.entries()) {
    if(index) assert.equal(scene.startFrame,m.scenes[index-1].endFrame,'Scene gap/overlap');
    assert.ok(scene.endFrame > scene.startFrame);
  }
  assert.equal(m.facts.original,brief.facts.original);
  assert.equal(m.facts.revised,brief.facts.revised);
  assert.ok(m.segments.length && m.tokens.length && m.pages.length);
  for(const segment of m.segments) {
    const scene=m.scenes.find(s=>s.type===segment.scene);
    assert.ok(segment.startMs >= scene.startFrame*1000/30-0.001);
    assert.ok(segment.endMs <= scene.endFrame*1000/30+0.001,'Scene cuts an audio segment');
    assert.ok(segment.speechEndMs <= segment.endMs,'Speech clipped');
    const tokens=m.tokens.filter(t=>t.segmentId===segment.id);
    assert.equal(tokens.map(t=>t.text).join(' '),segment.text,'Transcript differs from boundaries');
    if(segment.approvedFact) assert.equal(segment.text,brief.facts[segment.approvedFact]);
    for(const token of tokens) assert.ok(token.startMs >= segment.startMs && token.endMs <= segment.endMs+0.001 && token.endMs > token.startMs);
  }
  for(const [index,token] of m.tokens.entries()) {
    if(index) assert.ok(token.startMs >= m.tokens[index-1].endMs-0.001,'Overlapping word times');
  }
  assert.deepEqual(m.pages.flatMap(p=>p.tokens),m.tokens,'Subtitle pages lost or invented words');
  for(const [index,page] of m.pages.entries()) {
    assert.equal(page.startMs,page.tokens[0].startMs);
    assert.equal(page.endMs,page.tokens.at(-1).endMs);
    assert.equal(page.text,page.tokens.map(t=>t.text).join(' '));
    assert.ok(page.tokens.length <= 6 && page.text.length <= 42,'Caption page too long');
    if(index) assert.ok(page.startMs >= m.pages[index-1].endMs-0.001);
  }
  return true;
}
