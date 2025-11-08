import { Hono } from 'hono';
import { mentionService } from '../../services/mention.service';
import { validateNoteId } from '../middleware/validation';
import type { MentionsResponse } from '@thread-note/shared/types';
import { convertNoteToApi } from '../../utils/converters';

const app = new Hono();

// GET /api/notes/:id/mentions - Get notes mentioning this note
app.get('/:id/mentions', validateNoteId, async (c) => {
  const params = c.req.valid('param') as { id: string };
  const { id } = params;

  // NOTE: Check if note exists first
  const { noteService } = await import('../../services/note.service');
  const note = await noteService.getNoteById(id);
  if (!note) {
    return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
  }

  const mentionsWithNotes = await mentionService.getMentionsWithNotes(id);

  const response: MentionsResponse = {
    // @ts-ignore - Drizzle returns `notes` and `mentions` from join
    mentions: mentionsWithNotes.map((item) => ({
      note: convertNoteToApi(item.notes),
      position: item.mentions.position,
    })),
  };

  return c.json(response);
});

export default app;
