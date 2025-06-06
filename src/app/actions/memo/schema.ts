import { z } from 'zod';

// Define the memo schemas using zod
export const NewMemoSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  user_id: z.string().uuid('Invalid user ID'),
  parent_id: z.string().uuid('Invalid parent memo ID').nullable(),
});

export const MemoIdSchema = z.object({
  memoId: z.string().uuid('Invalid memo ID'),
});

export const ImageUploadSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Infer types from schemas for type safety
export type NewMemoInput = z.infer<typeof NewMemoSchema>;
export type MemoIdInput = z.infer<typeof MemoIdSchema>;
export type ImageUploadInput = z.infer<typeof ImageUploadSchema>;
