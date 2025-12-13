import { createSearchService } from '../../services/search';
import { validateSearch } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { errorToStatusCode, type NoteError } from '../../errors/domain-errors';
import type { SearchResponse, ErrorResponse } from '@thread-note/shared/types';
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
  // GET /api/notes/search - Search notes
  .get('/search', requireAuth, validateSearch, async (c) => {
    const db = c.get('db');
    const searchService = createSearchService({ db });

    const { q, type, limit } = c.req.valid('query');

    const searchResult =
      type === 'mention'
        ? searchService.searchByMention(q)
        : searchService.searchByContent(q, limit);

    return await searchResult
      .map((results) => {
        const response: SearchResponse = {
          results: results.map(serialize),
          total: results.length,
        };
        return response;
      })
      .match(
        (data) => c.json(data),
        (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
      );
  });

export default app;
