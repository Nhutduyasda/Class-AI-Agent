import {z} from 'zod';

const tokenSchema = z.object({text:z.string(),startMs:z.number().nonnegative(),endMs:z.number().positive(),segmentId:z.string(),scene:z.string()});
export const narrationSchema = z.object({
  id:z.string().regex(/^[a-z0-9-]+$/), audioSrc:z.string().regex(/^voice\/[a-z0-9-]+\/narration\.wav$/),
  durationInFrames:z.number().int().positive(),durationSeconds:z.number().min(35).max(45),fps:z.literal(30),
  scenes:z.array(z.object({type:z.enum(['hook','before','teach','after','cta']),startFrame:z.number().int().nonnegative(),endFrame:z.number().int().positive()})).length(5),
  tokens:z.array(tokenSchema),
  pages:z.array(z.object({startMs:z.number(),endMs:z.number(),text:z.string(),tokens:z.array(tokenSchema)})),
});
export type Narration = z.infer<typeof narrationSchema>;

export function pageAt(narration: Narration, milliseconds: number) {
  return narration.pages.find(page=>milliseconds >= page.startMs && milliseconds < page.endMs);
}
export function voiceSceneAt(narration: Narration, frame: number) {
  return narration.scenes.find(scene=>frame >= scene.startFrame && frame < scene.endFrame) ?? narration.scenes[4];
}
