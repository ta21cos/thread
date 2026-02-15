import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useBookmarks } from '../services/bookmark.service';
import { useNote } from '../services/note.service';
import { getRelativeTime } from '@/lib/utils';
import type { Bookmark as BookmarkType } from '../../../shared/types';

const BookmarkCard: React.FC<{ bookmark: BookmarkType }> = ({ bookmark }) => {
  const navigate = useNavigate();
  const { data: noteData } = useNote(bookmark.noteId);

  return (
    <button
      onClick={() => navigate(`/notes/${bookmark.noteId}`)}
      className="flex w-full flex-col gap-1 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
      data-testid="bookmark-item"
    >
      <div className="flex items-center gap-2">
        <Bookmark className="h-3 w-3 fill-yellow-500 text-yellow-500" />
        <span className="font-mono text-xs text-primary">#{bookmark.noteId}</span>
        <span className="text-xs text-muted-foreground">{getRelativeTime(bookmark.createdAt)}</span>
      </div>
      {noteData?.note ? (
        <p className="text-sm text-foreground line-clamp-2">{noteData.note.content}</p>
      ) : (
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      )}
    </button>
  );
};

export const BookmarksPage: React.FC = () => {
  const { data: bookmarks, isLoading } = useBookmarks();

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-foreground">Bookmarks</h1>
            {bookmarks && (
              <span className="text-xs text-muted-foreground">({bookmarks.length})</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !bookmarks || bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bookmark className="mb-3 h-12 w-12" />
              <p className="font-medium text-foreground">No bookmarks yet</p>
              <p className="text-sm">Bookmark notes to find them quickly later.</p>
            </div>
          ) : (
            <div className="space-y-2" data-testid="bookmarks-list">
              {bookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BookmarksPage;
