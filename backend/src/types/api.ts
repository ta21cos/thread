import type {
  Note as DbNote,
  Mention as DbMention,
  NoteWithReplyCount as DbNoteWithReplyCount,
} from '../db';

// NOTE: Utility type to convert Date fields to string (matches JSON.stringify behavior)
type DateToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

// NOTE: API types automatically match what JSON.stringify produces
export type ApiNote = DateToString<DbNote>;
export type ApiNoteWithReplyCount = DateToString<DbNoteWithReplyCount>;
export type ApiMention = DateToString<DbMention>;

export const serialize = <T>(data: T): DateToString<T> => {
  return JSON.parse(JSON.stringify(data)) as DateToString<T>;
};
