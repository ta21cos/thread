import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Hash, Search, MoreVertical, Trash2, Bookmark, Link2, Edit, Pin, Plus } from 'lucide-react';
import { Note } from '../../../shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getRelativeTime } from '@/lib/utils';
import NoteEditor from './NoteEditor';
import { ThemeToggle } from './ThemeToggle';
import { UserButton } from './UserButton';

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onCreateNote?: (content: string) => Promise<void>;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
  onCreateNote,
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});

  const filteredNotes = notes.filter(
    (note) =>
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // NOTE: Infinite scroll implementation
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading) {
        onLoadMore();
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  const handleNoteClick = useCallback(
    (noteId: string) => {
      onNoteSelect(noteId);
    },
    [onNoteSelect]
  );

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const copyLink = (noteId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?note=${noteId}`);
  };

  const toggleImageExpansion = (noteId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-background" data-testid="note-list">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold text-foreground text-lg">notes</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs" data-testid="note-list-count">
            {filteredNotes.length} notes
          </span>
          <UserButton />
          <ThemeToggle />
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-border p-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="note-list-search"
          />
        </div>
      </div>

      {/* Note Feed */}
      <ScrollArea className="flex-1">
        <div className="space-y-0 p-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'group relative w-full rounded-lg px-4 py-3 transition-colors hover:bg-accent',
                selectedNoteId === note.id && 'bg-accent/50'
              )}
              data-testid="note-item"
            >
              {/* Action Menu */}
              <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin note
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyLink(note.id)}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit note
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Note Content */}
              <button onClick={() => handleNoteClick(note.id)} className="w-full text-left">
                <div className="space-y-2">
                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Header with ID and Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded bg-primary/10 px-2 py-0.5 font-mono font-medium text-primary text-xs"
                        data-testid="note-item-id"
                      >
                        #{note.id}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {getRelativeTime(note.createdAt)}
                      </span>
                      {note.replyCount !== undefined && note.replyCount > 0 && (
                        <span
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 font-medium text-primary text-xs"
                          data-testid="note-item-reply-count"
                        >
                          {note.replyCount}
                        </span>
                      )}
                      {note.bookmarked && (
                        <Bookmark className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                    </div>
                    {note.pinned && <Pin className="h-4 w-4 fill-primary text-primary" />}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <p
                      className="text-foreground text-sm leading-relaxed"
                      data-testid="note-item-content"
                    >
                      {truncateContent(note.content)}
                    </p>

                    {/* Image Previews */}
                    {note.images && note.images.length > 0 && (
                      <div className="space-y-2">
                        {expandedImages[note.id] ? (
                          // Expanded: show all images
                          <>
                            {note.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Image ${i + 1}`}
                                className="w-full rounded-lg border border-border"
                              />
                            ))}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImageExpansion(note.id);
                              }}
                              className="text-primary text-xs hover:underline"
                            >
                              Collapse images
                            </button>
                          </>
                        ) : (
                          // Collapsed: thumbnail stack
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleImageExpansion(note.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <div className="flex -space-x-2">
                              {note.images.slice(0, 3).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`Thumbnail ${i + 1}`}
                                  className="h-12 w-12 rounded border-2 border-background object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {note.images.length} {note.images.length === 1 ? 'image' : 'images'} -
                              Click to expand
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}

          {/* Loading State */}
          {loading && (
            <div
              className="flex items-center justify-center gap-2 p-4"
              data-testid="note-list-loading"
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground text-sm">Loading more notes...</span>
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && !loading && <div ref={loadMoreRef} className="h-4" />}

          {/* Empty State */}
          {!loading && filteredNotes.length === 0 && (
            <div
              className="flex flex-col items-center justify-center gap-2 p-8"
              data-testid="note-list-empty"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Hash className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-foreground text-sm">No notes yet</p>
              <p className="text-muted-foreground text-xs">
                Create your first note to get started!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Note Editor at bottom */}
      {onCreateNote && (
        <div className="border-t border-border p-4 flex-shrink-0">
          <NoteEditor
            onSubmit={onCreateNote}
            placeholder="Message #notes"
            focusId="note-editor"
            restoreFocusOnSubmit={true}
          />
        </div>
      )}
    </div>
  );
};

export default NoteList;
