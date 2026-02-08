import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Hash, Search, Plus } from 'lucide-react';
import { Note } from '../../../shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoteItem } from './notes';
import NoteEditor from './NoteEditor';
import { ThemeToggle } from './ThemeToggle';
import { UserButton } from './UserButton';
import { SettingsDropdown } from './SettingsDropdown';
import { useSettings } from '@/store/settings.store';
import { useToggleMap } from '@/hooks/useToggleMap';

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onCreateNote?: (content: string, isHidden?: boolean) => Promise<void>;
  onToggleHidden?: (noteId: string, isHidden: boolean) => Promise<void>;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
  onCreateNote,
  onToggleHidden,
}) => {
  const { showHiddenNotes } = useSettings();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedImages, toggleImageExpansion] = useToggleMap();

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
          <SettingsDropdown />
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
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-0 p-4">
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                isImageExpanded={expandedImages[note.id] ?? false}
                showHiddenToggle={showHiddenNotes}
                onClick={handleNoteClick}
                onToggleImageExpansion={toggleImageExpansion}
                onToggleHidden={onToggleHidden}
              />
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
      </div>

      {/* Note Editor at bottom */}
      {onCreateNote && (
        <div className="border-t border-border p-4 flex-shrink-0">
          <NoteEditor onSubmit={onCreateNote} placeholder="Message #notes" />
        </div>
      )}
    </div>
  );
};

export default NoteList;
