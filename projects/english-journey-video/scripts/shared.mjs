import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateVoiceManifest} from './voiceover/validate.mjs';
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';

export async function prepare() {
  const args = process.argv.slice(2);
  const voiceMode = args.includes('--voice');
  const narration = voiceMode ? JSON.parse(await readFile(path.resolve('public/voice/lesson15-writing-retry-voice/manifest.json'), 'utf8')) : undefined;
  const filename = path.resolve(args.find(arg => !arg.startsWith('--')) ?? narration?.sourceBrief ?? 'briefs/pilot-lesson15.json');
  const brief = JSON.parse(await readFile(filename, 'utf8'));
  if (!/^[a-z0-9-]+\.mp4$/.test(brief.outputName)) throw new Error('Unsafe output filename');
  if (brief.beats.length !== 5 || brief.beats[0].start !== 0 || brief.beats.at(-1).end !== brief.targetDurationSeconds || brief.beats.some((b,i)=>b.end<=b.start || (i && b.start!==brief.beats[i-1].end))) throw new Error('Timeline must cover the duration without gaps');
  if (brief.beats.find(b=>b.type==='before')?.text !== brief.facts.original || brief.beats.find(b=>b.type==='after')?.text !== brief.facts.revised) throw new Error('Sentence mismatch');
  if (narration) {
    validateVoiceManifest(narration, brief);
    const hash = data => createHash('sha256').update(data).digest('hex');
    if (hash(await readFile('briefs/lesson15-voiceover.json')) !== narration.planSha256 || hash(await readFile(filename)) !== narration.sourceBriefSha256) throw new Error('Stale narration. Run npm run tts again.');
    await readFile(path.join('public',narration.audioSrc));
  }
  await mkdir('out', {recursive:true});
  const serveUrl = await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
  const inputProps = {brief, ...(narration ? {narration} : {})};
  const browserExecutable = process.env.CHROME_PATH || undefined;
  const composition = await selectComposition({serveUrl,id:'EnglishJourney',inputProps,browserExecutable});
  return {serveUrl,composition,inputProps,browserExecutable,brief,narration,outputName:narration ? `${narration.id}.mp4` : brief.outputName};
}
