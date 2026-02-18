import { createDailyNoteService } from '../../services/daily-note';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import {
  validateDate,
  validateCalendar,
  validateCreateTemplate,
  validateUpdateTemplate,
  validateTemplateId,
} from '../../middleware/validation';
import { handleServiceResponse, handleVoidResponse } from '../middleware/response-handler';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/daily-notes/:date - Get or create daily note
  .get('/:date', requireAuth, validateDate, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const dailyNoteService = createDailyNoteService({ db });
    const { date } = c.req.valid('param');
    const channelId = c.req.query('channelId');
    const templateId = c.req.query('templateId');

    if (!channelId) {
      return c.json({ error: 'channelId is required' }, 400);
    }

    return handleServiceResponse(
      dailyNoteService.getDailyNote(authorId, date, channelId, templateId),
      c,
      ({ dailyNote, note }) => ({
        dailyNote: serialize(dailyNote),
        note: serialize(note),
      })
    );
  })

  // GET /api/daily-notes/calendar/:year/:month - Get calendar for month
  .get('/calendar/:year/:month', requireAuth, validateCalendar, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const dailyNoteService = createDailyNoteService({ db });
    const { year, month } = c.req.valid('param');

    return handleServiceResponse(
      dailyNoteService.getCalendar(authorId, year, month),
      c,
      (entries) => ({ entries })
    );
  })

  // GET /api/daily-notes/templates - Get all templates
  .get('/templates', requireAuth, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const dailyNoteService = createDailyNoteService({ db });

    return handleServiceResponse(dailyNoteService.getTemplates(authorId), c, (templates) => ({
      templates: templates.map(serialize),
    }));
  })

  // POST /api/daily-notes/templates - Create template
  .post('/templates', requireAuth, validateCreateTemplate, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const dailyNoteService = createDailyNoteService({ db });
    const { name, content, isDefault } = c.req.valid('json');

    return handleServiceResponse(
      dailyNoteService.createTemplate(authorId, name, content, isDefault),
      c,
      serialize,
      201
    );
  })

  // PUT /api/daily-notes/templates/:id - Update template
  .put('/templates/:id', requireAuth, validateTemplateId, validateUpdateTemplate, async (c) => {
    const db = c.get('db');
    const dailyNoteService = createDailyNoteService({ db });
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    return handleServiceResponse(dailyNoteService.updateTemplate(id, data), c, serialize);
  })

  // DELETE /api/daily-notes/templates/:id - Delete template
  .delete('/templates/:id', requireAuth, validateTemplateId, async (c) => {
    const db = c.get('db');
    const dailyNoteService = createDailyNoteService({ db });
    const { id } = c.req.valid('param');

    return handleVoidResponse(dailyNoteService.deleteTemplate(id), c);
  });

export default app;
