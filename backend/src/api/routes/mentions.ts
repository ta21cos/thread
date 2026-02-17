import { createMentionService } from '../../services/mention';
import { createNoteService } from '../../services/note';
import { validateNoteId } from '../../middleware/validation';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import { handleServiceResponse } from '../middleware/response-handler';
import type { MentionsResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/notes/:id/mentions - Get notes mentioning this note
  .get('/:id/mentions', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const mentionService = createMentionService({ db });
    const authorId = getAuthUserId(c);

    const { id } = c.req.valid('param');

    return handleServiceResponse(
      noteService
        .getNoteById(id, authorId)
        .andThen(() => mentionService.getMentionsWithNotes(id, authorId)),
      c,
      (mentionsWithNotes) => {
        const response: MentionsResponse = {
          mentions: mentionsWithNotes.map((m) => ({
            note: serialize(m.notes),
            position: m.mentions.position,
          })),
        };
        return response;
      }
    );
  });

export default app;
