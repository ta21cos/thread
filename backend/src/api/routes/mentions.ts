import { MentionService } from '../../services/mention.service';
import { createNoteService } from '../../services/note.service';

import { validateNoteId } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import type { MentionsResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/notes/:id/mentions - Get notes mentioning this note
  .get('/:id/mentions', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');

    const noteService = createNoteService({ db });

    const mentionService = new MentionService({ db });

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
