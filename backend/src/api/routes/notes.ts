import { Hono } from 'hono';
import { noteService } from '../../services/note.service';
import { threadService } from '../../services/thread.service';
import { deleteService } from '../../services/delete.service';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../middleware/validation';
import type {
  NoteListResponse,
  NoteDetailResponse,
} from '@thread-note/shared/types';
import { convertNoteToApi, convertNoteWithReplyCountToApi } from '../../utils/converters';

const app = new Hono();

// GET /api/notes - List root notes
// @ts-expect-error - Hono type inference issue with middleware validators
app.get('/', validatePagination, async (c) => {
  // @ts-ignore
  const query = c.req.valid('query') as { limit: number; offset: number };
  const { limit, offset } = query;
  const result = await noteService.getRootNotes(limit, offset);

  const response: NoteListResponse = {
    notes: result.notes.map(convertNoteWithReplyCountToApi),
    total: result.total,
    hasMore: result.hasMore,
  };

  return c.json(response);
});

// POST /api/notes - Create note
app.post('/', validateCreateNote, async (c) => {
  const data = c.req.valid('json') as { content: string; parentId?: string };
  const note = await noteService.createNote(data);
  return c.json(convertNoteToApi(note), 201);
});

// GET /api/notes/:id - Get note with thread
app.get('/:id', validateNoteId, async (c) => {
  const params = c.req.valid('param') as { id: string };
  const { id } = params;
  const includeThread = c.req.query('includeThread') !== 'false';

  const note = await noteService.getNoteById(id);
  if (!note) {
    return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
  }

  if (includeThread) {
    const thread = await threadService.getThread(id);
    const response: NoteDetailResponse = {
      note: convertNoteToApi(note),
      thread: thread.map(convertNoteToApi),
    };
    return c.json(response);
  } else {
    const response = {
      note: convertNoteToApi(note),
    };
    return c.json(response);
  }
});

// PUT /api/notes/:id - Update note
app.put('/:id', validateNoteId, validateUpdateNote, async (c) => {
  const params = c.req.valid('param') as { id: string };
  const { id } = params;
  const data = c.req.valid('json') as { content: string };

  const updated = await noteService.updateNote(id, data);
  return c.json(convertNoteToApi(updated));
});

// DELETE /api/notes/:id - Delete note (cascade)
app.delete('/:id', validateNoteId, async (c) => {
  const params = c.req.valid('param') as { id: string };
  const { id } = params;
  await deleteService.deleteNote(id);
  return c.body(null, 204);
});

export default app;
