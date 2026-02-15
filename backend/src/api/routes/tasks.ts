import { createTaskService } from '../../services/task';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import { validateTaskId } from '../../middleware/validation';
import { handleServiceResponse } from '../middleware/response-handler';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/tasks - List tasks for current user
  .get('/', requireAuth, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const taskService = createTaskService({ db });

    const includeCompleted = c.req.query('includeCompleted') !== 'false';
    const limit = parseInt(c.req.query('limit') || '100', 10);

    return handleServiceResponse(
      taskService.getTasks(authorId, includeCompleted, limit),
      c,
      (tasks) => ({
        tasks: tasks.map(serialize),
      })
    );
  })

  // PATCH /api/tasks/:id/toggle - Toggle task completion
  .patch('/:id/toggle', requireAuth, validateTaskId, async (c) => {
    const db = c.get('db');
    const taskService = createTaskService({ db });
    const { id } = c.req.valid('param');

    return handleServiceResponse(taskService.toggleTask(id), c, serialize);
  });

export default app;
