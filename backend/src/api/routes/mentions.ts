import { Hono } from 'hono';
import { MentionService } from '../../services/mention.service';
import { NoteService } from '../../services/note.service';
import { db } from '../../db';
import { validateNoteId } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import type { MentionsResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';

const mentionService = new MentionService({ db });
const noteService = new NoteService({ db });

const app = new Hono()
  // GET /api/notes/:id/mentions - Get notes mentioning this note
  .get('/:id/mentions', requireAuth, validateNoteId, async (c) => {
    const { id } = c.req.valid('param');

    // NOTE: Check if note exists first
    const note = await noteService.getNoteById(id);
    if (!note) {
      return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
    }

    const mentionsWithNotes = await mentionService.getMentionsWithNotes(id);

    const response: MentionsResponse = {
      mentions: mentionsWithNotes.map((m) => ({
        note: serialize(m.notes),
        position: m.mentions.position,
      })),
    };

    return c.json(response);
  });

export default app;
