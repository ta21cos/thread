import { createSearchService } from '../../services/search';
import { validateSearch } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { handleServiceResponse } from '../middleware/response-handler';
import type { SearchResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/notes/search - Search notes
  .get('/search', requireAuth, validateSearch, async (c) => {
    const db = c.get('db');
    const searchService = createSearchService({ db });

    const { q, type, limit } = c.req.valid('query');

    const searchResult =
      type === 'mention'
        ? searchService.searchByMention(q)
        : searchService.searchByContent(q, limit);

    return handleServiceResponse(searchResult, c, (results) => {
      const response: SearchResponse = {
        results: results.map(serialize),
        total: results.length,
      };
      return response;
    });
  });

export default app;
