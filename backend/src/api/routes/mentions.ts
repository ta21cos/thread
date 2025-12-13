import { MentionService } from '../../services/mention.service';
import { createNoteService } from '../../services/note';

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

    // NOTE: Check if note exists first using ResultAsync
    const noteResult = await noteService.getNoteById(id);

    if (noteResult.isErr()) {
      const error = noteResult.error;
      if (error._tag === 'NoteNotFoundError') {
        return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
      }
      return c.json({ error: error._tag, message: error.message }, 500);
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
