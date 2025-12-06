import { SearchService } from '../../services/search.service';
import { validateSearch } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import type { SearchResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/notes/search - Search notes
  .get('/search', requireAuth, validateSearch, async (c) => {
    const db = c.get('db');

    const searchService = new SearchService({ db });

    const { q, type, limit } = c.req.valid('query');

    let results;
    if (type === 'mention') {
      results = await searchService.searchByMention(q);
    } else {
      results = await searchService.searchByContent(q, limit);
    }

    const response: SearchResponse = {
      results: results.map(serialize),
      total: results.length,
    };

    return c.json(response);
  });

export default app;
