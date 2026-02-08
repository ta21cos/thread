import React from 'react';
import { Bookmark, Pin, EyeOff } from 'lucide-react';
import { Note } from '../../../../shared/types';
import { cn, getRelativeTime } from '@/lib/utils';
import { NoteActionMenu } from './NoteActionMenu';
import { ImagePreview } from './ImagePreview';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  isImageExpanded: boolean;
  showHiddenToggle: boolean;
  onClick: (noteId: string) => void;
  onToggleImageExpansion: (noteId: string) => void;
  onToggleHidden?: (noteId: string, isHidden: boolean) => void;
}

const truncateContent = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isSelected,
  isImageExpanded,
  showHiddenToggle,
  onClick,
  onToggleImageExpansion,
  onToggleHidden,
}) => {
  return (
    <div
      className={cn(
        'group relative w-full rounded-lg px-4 py-3 transition-colors hover:bg-accent',
        isSelected && 'bg-accent/50'
      )}
      data-testid="note-item"
    >
      {/* Action Menu */}
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <NoteActionMenu
          noteId={note.id}
          isHidden={note.isHidden}
          showHiddenToggle={showHiddenToggle}
          onToggleHidden={onToggleHidden}
        />
      </div>

      {/* Note Content */}
      <button onClick={() => onClick(note.id)} className="w-full text-left">
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
              {note.isHidden && (
                <span title="Hidden note">
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                </span>
              )}
              {note.replyCount !== undefined && note.replyCount > 0 && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 font-medium text-primary text-xs"
                  data-testid="note-item-reply-count"
                >
                  {note.replyCount}
                </span>
              )}
              {note.bookmarked && <Bookmark className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
            </div>
            {note.pinned && <Pin className="h-4 w-4 fill-primary text-primary" />}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <p className="text-foreground text-sm leading-relaxed" data-testid="note-item-content">
              {truncateContent(note.content)}
            </p>

            {/* Image Previews */}
            {note.images && note.images.length > 0 && (
              <ImagePreview
                images={note.images}
                isExpanded={isImageExpanded}
                onToggle={() => onToggleImageExpansion(note.id)}
              />
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

export default NoteItem;
