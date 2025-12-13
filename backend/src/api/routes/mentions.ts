import { createMentionService } from '../../services/mention';
import { createNoteService } from '../../services/note';
import { validateNoteId } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { errorToStatusCode, type NoteError } from '../../errors/domain-errors';
import type { MentionsResponse, ErrorResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

/**
 * NoteError を ErrorResponse に変換
 */
const toErrorResponse = (error: NoteError): ErrorResponse => ({
  error: error._tag,
  message: error.message,
});

const app = createRouter()
  // GET /api/notes/:id/mentions - Get notes mentioning this note
  .get('/:id/mentions', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const mentionService = createMentionService({ db });

    const { id } = c.req.valid('param');

    return await noteService
      .getNoteById(id)
      .andThen(() => mentionService.getMentionsWithNotes(id))
      .map((mentionsWithNotes) => {
        const response: MentionsResponse = {
          mentions: mentionsWithNotes.map((m) => ({
            note: serialize(m.notes),
            position: m.mentions.position,
          })),
        };
        return response;
      })
      .match(
        (data) => c.json(data),
        (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
      );
  });

export default app;
