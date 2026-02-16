/**
 * Daily Note Service Implementation
 */

import { okAsync, errAsync } from 'neverthrow';
import { type Template, type Database } from '../../db';
import { dailyNoteNotFoundError, templateNotFoundError } from '../../errors/domain-errors';
import { createDailyNoteRepository } from '../../repositories/daily-note.repository';
import { createTemplateRepository } from '../../repositories/template.repository';
import { ensureExists, getOrCreate } from '../../repositories/helpers';
import { createNoteService } from '../note';
import { generateId } from '../../utils/id-generator';
import type { DailyNoteServiceHandle, CalendarEntry } from './types';

// ==========================================
// Template Placeholder Processing
// ==========================================

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_JP = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

const processTemplate = (template: string, date: string): string => {
  const d = new Date(date);
  const replacements: Record<string, string> = {
    '{{date}}': date,
    '{{year}}': String(d.getFullYear()),
    '{{month}}': String(d.getMonth() + 1).padStart(2, '0'),
    '{{day}}': String(d.getDate()).padStart(2, '0'),
    '{{weekday}}': WEEKDAYS[d.getDay()],
    '{{weekday_jp}}': WEEKDAYS_JP[d.getDay()],
  };

  return Object.entries(replacements).reduce(
    (result, [placeholder, value]) =>
      result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value),
    template
  );
};

// ==========================================
// Handle Implementation (Factory)
// ==========================================

export const createDailyNoteService = ({ db }: { db: Database }): DailyNoteServiceHandle => {
  const dailyNoteRepo = createDailyNoteRepository({ db });
  const templateRepo = createTemplateRepository({ db });
  const noteService = createNoteService({ db });
  const ensureTemplateExists = ensureExists<Template>(templateNotFoundError);

  const createDefaultTemplate = (authorId: string) =>
    templateRepo.create({
      id: generateId(),
      authorId,
      name: 'Default',
      content: '# {{date}} ({{weekday}})\n\n## Today\n\n- \n\n## Notes\n\n',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const getOrCreateDefaultTemplate = (authorId: string) =>
    templateRepo
      .findDefaultByAuthorId(authorId)
      .andThen(getOrCreate(() => createDefaultTemplate(authorId)));

  const formatDate = (year: number, month: number, day?: number) =>
    day
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${year}-${String(month).padStart(2, '0')}`;

  return {
    getDailyNote: (authorId, date, templateId) =>
      dailyNoteRepo.findByAuthorAndDate(authorId, date).andThen((existing) =>
        existing
          ? noteService.getNoteById(existing.noteId).map((note) => ({ dailyNote: existing, note }))
          : (templateId
              ? templateRepo.findById(templateId).andThen(ensureTemplateExists(templateId))
              : getOrCreateDefaultTemplate(authorId)
            ).andThen((template) =>
              noteService
                .createNote({
                  content: processTemplate(template.content, date),
                  authorId,
                  isHidden: false,
                })
                .andThen((note) =>
                  dailyNoteRepo
                    .create({
                      id: generateId(),
                      noteId: note.id,
                      authorId,
                      date,
                      createdAt: new Date(),
                    })
                    .map((dailyNote) => ({ dailyNote, note }))
                )
            )
      ),

    getCalendar: (authorId, year, month) =>
      dailyNoteRepo
        .findEditedByAuthorAndDateRange(
          authorId,
          `${formatDate(year, month)}-01`,
          `${formatDate(year, month)}-31`
        )
        .map((editedNotes) => {
          const editedDates = new Set(editedNotes.map((dn) => dn.date));
          const daysInMonth = new Date(year, month, 0).getDate();
          return Array.from({ length: daysInMonth }, (_, i) => {
            const dateStr = formatDate(year, month, i + 1);
            return { date: dateStr, hasNote: editedDates.has(dateStr) } as CalendarEntry;
          });
        }),

    getTemplates: (authorId) => templateRepo.findByAuthorId(authorId),

    createTemplate: (authorId, name, content, isDefault = false) =>
      templateRepo.create({
        id: generateId(),
        authorId,
        name,
        content,
        isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),

    updateTemplate: (templateId, data) =>
      templateRepo
        .findById(templateId)
        .andThen(ensureTemplateExists(templateId))
        .andThen(() => templateRepo.update(templateId, data)),

    deleteTemplate: (templateId) =>
      templateRepo
        .findById(templateId)
        .andThen(ensureTemplateExists(templateId))
        .andThen(() => templateRepo.delete(templateId)),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

export const createMockDailyNoteService = (
  overrides: Partial<DailyNoteServiceHandle> = {}
): DailyNoteServiceHandle => ({
  getDailyNote: () => errAsync(dailyNoteNotFoundError('mock')),
  getCalendar: () => okAsync([]),
  getTemplates: () => okAsync([]),
  createTemplate: () => errAsync(templateNotFoundError('mock')),
  updateTemplate: () => errAsync(templateNotFoundError('mock')),
  deleteTemplate: () => errAsync(templateNotFoundError('mock')),
  ...overrides,
});
