/**
 * Daily Note Service Types
 */

import type { ResultAsync } from 'neverthrow';
import type { DailyNote, Note, Template } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Output Types
// ==========================================

export interface DailyNoteWithNote {
  dailyNote: DailyNote;
  note: Note;
}

export interface CalendarEntry {
  date: string;
  hasNote: boolean;
}

// ==========================================
// Handle Interface (Public API)
// ==========================================

export interface DailyNoteServiceHandle {
  /** 日付の日記を取得（なければ作成） */
  readonly getDailyNote: (
    authorId: string,
    date: string,
    channelId: string,
    templateId?: string
  ) => ResultAsync<DailyNoteWithNote, NoteError>;
  /** 月のカレンダーを取得 */
  readonly getCalendar: (
    authorId: string,
    year: number,
    month: number
  ) => ResultAsync<CalendarEntry[], NoteError>;
  /** テンプレート一覧を取得 */
  readonly getTemplates: (authorId: string) => ResultAsync<Template[], NoteError>;
  /** テンプレートを作成 */
  readonly createTemplate: (
    authorId: string,
    name: string,
    content: string,
    isDefault?: boolean
  ) => ResultAsync<Template, NoteError>;
  /** テンプレートを更新 */
  readonly updateTemplate: (
    templateId: string,
    data: { name?: string; content?: string; isDefault?: boolean }
  ) => ResultAsync<Template, NoteError>;
  /** テンプレートを削除 */
  readonly deleteTemplate: (templateId: string) => ResultAsync<void, NoteError>;
}
