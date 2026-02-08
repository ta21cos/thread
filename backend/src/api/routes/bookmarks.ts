import { createBookmarkService } from '../../services/bookmark';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import { validateBookmarkNoteId } from '../../middleware/validation';
import { handleServiceResponse, handleVoidResponse } from '../middleware/response-handler';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/bookmarks - List bookmarks for current user
  .get('/', requireAuth, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const bookmarkService = createBookmarkService({ db });

    const limit = parseInt(c.req.query('limit') || '100', 10);

    return handleServiceResponse(bookmarkService.getBookmarks(authorId, limit), c, (bookmarks) => ({
      bookmarks: bookmarks.map(serialize),
    }));
  })

  // POST /api/bookmarks/:noteId - Toggle bookmark for a note
  .post('/:noteId', requireAuth, validateBookmarkNoteId, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const bookmarkService = createBookmarkService({ db });
    const { noteId } = c.req.valid('param');

    return handleServiceResponse(bookmarkService.toggleBookmark(noteId, authorId), c);
  })

  // GET /api/bookmarks/:noteId - Check if note is bookmarked
  .get('/:noteId', requireAuth, validateBookmarkNoteId, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const bookmarkService = createBookmarkService({ db });
    const { noteId } = c.req.valid('param');

    return handleServiceResponse(
      bookmarkService.isBookmarked(noteId, authorId),
      c,
      (bookmarked) => ({
        bookmarked,
      })
    );
  })

  // DELETE /api/bookmarks/:noteId - Remove bookmark
  .delete('/:noteId', requireAuth, validateBookmarkNoteId, async (c) => {
    const db = c.get('db');
    const authorId = getAuthUserId(c);
    const bookmarkService = createBookmarkService({ db });
    const { noteId } = c.req.valid('param');

    return handleVoidResponse(bookmarkService.removeBookmark(noteId, authorId), c);
  });

export default app;
