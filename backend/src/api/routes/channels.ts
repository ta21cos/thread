import { createChannelService } from '../../services/channel';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import {
  validateCreateChannel,
  validateUpdateChannel,
  validateChannelId,
} from '../../middleware/validation';
import { handleServiceResponse, handleVoidResponse } from '../middleware/response-handler';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/channels - List channels for current user
  .get('/', requireAuth, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const channelService = createChannelService({ db });

    return handleServiceResponse(channelService.getChannelsByAuthor(authorId), c, (channels) => ({
      channels: channels.map(serialize),
    }));
  })

  // POST /api/channels - Create channel
  .post('/', requireAuth, validateCreateChannel, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const channelService = createChannelService({ db });
    const data = c.req.valid('json');

    return handleServiceResponse(channelService.createChannel(authorId, data), c, serialize, 201);
  })

  // GET /api/channels/:id - Get channel by ID
  .get('/:id', requireAuth, validateChannelId, async (c) => {
    const db = c.get('db');
    const channelService = createChannelService({ db });
    const { id } = c.req.valid('param');

    return handleServiceResponse(channelService.getChannelById(id), c, serialize);
  })

  // PUT /api/channels/:id - Update channel
  .put('/:id', requireAuth, validateChannelId, validateUpdateChannel, async (c) => {
    const db = c.get('db');
    const channelService = createChannelService({ db });
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    return handleServiceResponse(channelService.updateChannel(id, data), c, serialize);
  })

  // DELETE /api/channels/:id - Delete channel
  .delete('/:id', requireAuth, validateChannelId, async (c) => {
    const db = c.get('db');
    const channelService = createChannelService({ db });
    const { id } = c.req.valid('param');

    return handleVoidResponse(channelService.deleteChannel(id), c);
  })

  // POST /api/channels/default - Ensure default channel exists
  .post('/default', requireAuth, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const channelService = createChannelService({ db });

    return handleServiceResponse(channelService.ensureDefaultChannel(authorId), c, serialize);
  });

export default app;
