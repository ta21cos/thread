/**
 * Task Repository Implementation
 */

import { ResultAsync, okAsync } from 'neverthrow';
import { eq, and, desc } from 'drizzle-orm';
import { tasks, type Task, type NewTask, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery, dbQueryFirst, dbInsertReturning, dbUpdateReturning, dbDelete } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface TaskRepository {
  readonly findById: (id: string) => ResultAsync<Task | undefined, NoteError>;
  readonly findByNoteId: (noteId: string) => ResultAsync<Task[], NoteError>;
  readonly findByAuthorId: (
    authorId: string,
    includeCompleted?: boolean,
    limit?: number
  ) => ResultAsync<Task[], NoteError>;
  readonly create: (task: NewTask) => ResultAsync<Task, NoteError>;
  readonly update: (
    id: string,
    data: Partial<Pick<Task, 'content' | 'isCompleted' | 'completedAt'>>
  ) => ResultAsync<Task, NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
  readonly deleteByNoteId: (noteId: string) => ResultAsync<void, NoteError>;
  readonly bulkCreate: (tasksToCreate: NewTask[]) => ResultAsync<Task[], NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

export const createTaskRepository = ({ db }: { db: Database }): TaskRepository => ({
  findById: (id) =>
    dbQueryFirst(db.select().from(tasks).where(eq(tasks.id, id)), 'Failed to find task'),

  findByNoteId: (noteId) =>
    dbQuery(
      db.select().from(tasks).where(eq(tasks.noteId, noteId)).orderBy(tasks.position),
      'Failed to find tasks by note'
    ),

  findByAuthorId: (authorId, includeCompleted = true, limit = 100) => {
    const condition = includeCompleted
      ? eq(tasks.authorId, authorId)
      : and(eq(tasks.authorId, authorId), eq(tasks.isCompleted, false));

    return dbQuery(
      db.select().from(tasks).where(condition).orderBy(desc(tasks.createdAt)).limit(limit),
      'Failed to find tasks by author'
    );
  },

  create: (task) =>
    dbInsertReturning(db.insert(tasks).values(task).returning(), 'Failed to create task'),

  update: (id, data) =>
    dbUpdateReturning(
      db
        .update(tasks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning(),
      'Failed to update task'
    ),

  delete: (id) => dbDelete(db.delete(tasks).where(eq(tasks.id, id)), 'Failed to delete task'),

  deleteByNoteId: (noteId) =>
    dbDelete(db.delete(tasks).where(eq(tasks.noteId, noteId)), 'Failed to delete tasks by note'),

  bulkCreate: (tasksToCreate) =>
    tasksToCreate.length === 0
      ? okAsync([])
      : dbQuery(db.insert(tasks).values(tasksToCreate).returning(), 'Failed to bulk create tasks'),
});
