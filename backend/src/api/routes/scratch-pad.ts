import { createScratchPadService } from '../../services/scratch-pad';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import { validateUpdateScratchPad, validateConvertToNote } from '../../middleware/validation';
import { handleServiceResponse } from '../middleware/response-handler';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/scratch-pad - Get scratch pad for current user
  .get('/', requireAuth, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const scratchPadService = createScratchPadService({ db });

    const channelId = c.req.query('channelId') || null;

    return handleServiceResponse(
      scratchPadService.getScratchPad(authorId, channelId),
      c,
      serialize
    );
  })

  // PUT /api/scratch-pad - Update scratch pad
  .put('/', requireAuth, validateUpdateScratchPad, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const scratchPadService = createScratchPadService({ db });
    const { content, channelId } = c.req.valid('json');

    return handleServiceResponse(
      scratchPadService.updateScratchPad(authorId, content, channelId ?? null),
      c,
      serialize
    );
  })

  // POST /api/scratch-pad/convert - Convert scratch pad to note
  .post('/convert', requireAuth, validateConvertToNote, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const scratchPadService = createScratchPadService({ db });
    const { channelId } = c.req.valid('json');

    return handleServiceResponse(
      scratchPadService.convertToNote(authorId, channelId ?? null),
      c,
      serialize,
      201
    );
  });

export default app;
