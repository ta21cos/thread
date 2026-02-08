/**
 * Template Repository Implementation
 */

import type { ResultAsync } from 'neverthrow';
import { eq, and } from 'drizzle-orm';
import { templates, type Template, type NewTemplate, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery, dbQueryFirst, dbInsertReturning, dbUpdateReturning, dbDelete } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface TemplateRepository {
  readonly findById: (id: string) => ResultAsync<Template | undefined, NoteError>;
  readonly findByAuthorId: (authorId: string) => ResultAsync<Template[], NoteError>;
  readonly findDefaultByAuthorId: (
    authorId: string
  ) => ResultAsync<Template | undefined, NoteError>;
  readonly create: (template: NewTemplate) => ResultAsync<Template, NoteError>;
  readonly update: (
    id: string,
    data: Partial<Pick<Template, 'name' | 'content' | 'isDefault'>>
  ) => ResultAsync<Template, NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

export const createTemplateRepository = ({ db }: { db: Database }): TemplateRepository => ({
  findById: (id) =>
    dbQueryFirst(
      db.select().from(templates).where(eq(templates.id, id)),
      'Failed to find template'
    ),

  findByAuthorId: (authorId) =>
    dbQuery(
      db.select().from(templates).where(eq(templates.authorId, authorId)),
      'Failed to find templates by author'
    ),

  findDefaultByAuthorId: (authorId) =>
    dbQueryFirst(
      db
        .select()
        .from(templates)
        .where(and(eq(templates.authorId, authorId), eq(templates.isDefault, true))),
      'Failed to find default template'
    ),

  create: (template) =>
    dbInsertReturning(
      db.insert(templates).values(template).returning(),
      'Failed to create template'
    ),

  update: (id, data) =>
    dbUpdateReturning(
      db
        .update(templates)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(templates.id, id))
        .returning(),
      'Failed to update template'
    ),

  delete: (id) =>
    dbDelete(db.delete(templates).where(eq(templates.id, id)), 'Failed to delete template'),
});
