import { z } from 'zod';

export const chatInput = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
}).strict();
export const conversationParams = z.object({ id: z.string().uuid() }).strict();
export const pageQuery = z.object({ before: z.string().uuid().optional() }).strict();
export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  return schema.parse(input);
}
