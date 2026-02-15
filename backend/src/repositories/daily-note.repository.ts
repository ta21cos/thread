/**
 * Daily Note Repository Implementation
 */

import type { ResultAsync } from 'neverthrow';
import { eq, and, gte, lte, gt } from 'drizzle-orm';
import { dailyNotes, type DailyNote, type NewDailyNote, type Database } from '../db';
import { notes } from '../models/note.schema';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery, dbQueryFirst, dbInsertReturning, dbDelete } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface DailyNoteRepository {
  readonly findById: (id: string) => ResultAsync<DailyNote | undefined, NoteError>;
  readonly findByAuthorAndDate: (
    authorId: string,
    date: string
  ) => ResultAsync<DailyNote | undefined, NoteError>;
  readonly findByAuthorAndDateRange: (
    authorId: string,
    startDate: string,
    endDate: string
  ) => ResultAsync<DailyNote[], NoteError>;
  readonly findEditedByAuthorAndDateRange: (
    authorId: string,
    startDate: string,
    endDate: string
  ) => ResultAsync<DailyNote[], NoteError>;
  readonly create: (dailyNote: NewDailyNote) => ResultAsync<DailyNote, NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

export const createDailyNoteRepository = ({ db }: { db: Database }): DailyNoteRepository => ({
  findById: (id) =>
    dbQueryFirst(
      db.select().from(dailyNotes).where(eq(dailyNotes.id, id)),
      'Failed to find daily note'
    ),

  findByAuthorAndDate: (authorId, date) =>
    dbQueryFirst(
      db
        .select()
        .from(dailyNotes)
        .where(and(eq(dailyNotes.authorId, authorId), eq(dailyNotes.date, date))),
      'Failed to find daily note by date'
    ),

  findByAuthorAndDateRange: (authorId, startDate, endDate) =>
    dbQuery(
      db
        .select()
        .from(dailyNotes)
        .where(
          and(
            eq(dailyNotes.authorId, authorId),
            gte(dailyNotes.date, startDate),
            lte(dailyNotes.date, endDate)
          )
        ),
      'Failed to find daily notes in range'
    ),

  findEditedByAuthorAndDateRange: (authorId, startDate, endDate) =>
    dbQuery(
      db
        .select()
        .from(dailyNotes)
        .innerJoin(notes, eq(dailyNotes.noteId, notes.id))
        .where(
          and(
            eq(dailyNotes.authorId, authorId),
            gte(dailyNotes.date, startDate),
            lte(dailyNotes.date, endDate),
            gt(notes.updatedAt, notes.createdAt)
          )
        )
        .then((rows) => rows.map((r) => r.daily_notes)),
      'Failed to find edited daily notes in range'
    ),

  create: (dailyNote) =>
    dbInsertReturning(
      db.insert(dailyNotes).values(dailyNote).returning(),
      'Failed to create daily note'
    ),

  delete: (id) =>
    dbDelete(db.delete(dailyNotes).where(eq(dailyNotes.id, id)), 'Failed to delete daily note'),
});
