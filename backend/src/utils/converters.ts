// NOTE: Utility functions to convert DB entities to API types
import type { Note as DbNote } from '../db';
import type { Note as ApiNote, Mention as ApiMention } from '@thread-note/shared/types';
import type { Mention as DbMention } from '../db';

export const convertNoteToApi = (note: DbNote): ApiNote => ({
  id: note.id,
  content: note.content,
  parentId: note.parentId,
  createdAt: note.createdAt.toISOString(),
  updatedAt: note.updatedAt.toISOString(),
  depth: note.depth,
});

export const convertNoteWithReplyCountToApi = (note: DbNote & { replyCount: number }): ApiNote => ({
  ...convertNoteToApi(note),
  replyCount: note.replyCount,
});

export const convertMentionToApi = (mention: DbMention): ApiMention => ({
  id: mention.id,
  fromNoteId: mention.fromNoteId,
  toNoteId: mention.toNoteId,
  position: mention.position,
  createdAt: mention.createdAt.toISOString(),
});
