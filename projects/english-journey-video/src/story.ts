import {z} from 'zod';
import {narrationSchema} from './voice';

export const briefSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), brand: z.string(),
  width: z.literal(1080), height: z.literal(1920), fps: z.literal(30),
  targetDurationSeconds: z.number().min(25).max(40),
  facts: z.object({original: z.string().min(1), revised: z.string().min(1)}),
  beats: z.array(z.object({start: z.number(), end: z.number(), type: z.enum(['hook','before','teach','after','cta']), text: z.string()})).length(5),
  outputName: z.string().regex(/^[a-z0-9-]+\.mp4$/),
});
export type Brief = z.infer<typeof briefSchema>;
export const propsSchema = z.object({brief: briefSchema, narration: narrationSchema.optional()});
export type Props = z.infer<typeof propsSchema>;

// Editorial reading cues for a silent video, NOT invented speech timestamps.
export const captionFor = (type: string, localSeconds: number): string => {
  if (type === 'hook') return 'Cùng xem mình sửa\nlỗi ở đâu nhé.';
  if (type === 'before') return localSeconds < 3.5 ? 'Đây là câu mình\nđã viết ở Lesson 15.' : 'Bạn thấy thiếu từ nối\ngiữa hai hành động không?';
  if (type === 'teach') return localSeconds < 3.5 ? 'Sửa chính tả\ntrước khi viết lại.' : 'Dùng “and” để nối\nhai hành động.';
  if (type === 'after') return localSeconds < 4.5 ? 'Đưa “yesterday” lên đầu\ncho câu tự nhiên hơn.' : '“for dinner” bổ sung ý:\nmua thức ăn cho bữa tối.';
  return 'English Journey';
};
