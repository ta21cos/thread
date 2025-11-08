import { Hono } from 'hono';
import { searchService } from '../../services/search.service';
import { validateSearch } from '../middleware/validation';
import type { SearchResponse } from '@thread-note/shared/types';
import { convertNoteToApi } from '../../utils/converters';

const app = new Hono();

// GET /api/notes/search - Search notes
// @ts-expect-error - Hono type inference issue with middleware validators
app.get('/search', validateSearch, async (c) => {
  // @ts-ignore
  const query = c.req.valid('query') as { q: string; type: 'content' | 'mention'; limit: number };
  const { q, type, limit } = query;

  let results;
  if (type === 'mention') {
    results = await searchService.searchByMention(q);
  } else {
    results = await searchService.searchByContent(q, limit);
  }

  const response: SearchResponse = {
    results: results.map(convertNoteToApi),
    total: results.length,
  };

  return c.json(response);
});

export default app;
