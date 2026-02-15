import React from 'react';
import { Link2, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';

interface NoteActionMenuProps {
  noteId: string;
  isHidden?: boolean;
  showHiddenToggle?: boolean;
  onToggleHidden?: (noteId: string, isHidden: boolean) => void;
  onCopyLink?: (noteId: string) => void;
}

export const NoteActionMenu: React.FC<NoteActionMenuProps> = ({
  noteId,
  isHidden = false,
  showHiddenToggle = false,
  onToggleHidden,
  onCopyLink,
}) => {
  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink(noteId);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}?note=${noteId}`);
    }
  };

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-background px-0.5 py-0.5 shadow-sm">
      <BookmarkButton noteId={noteId} size="sm" />
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        <Link2 className="h-3.5 w-3.5" />
      </Button>
      {showHiddenToggle && onToggleHidden && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onToggleHidden(noteId, !isHidden)}
          aria-label={isHidden ? 'Show note' : 'Hide note'}
        >
          {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
};

export default NoteActionMenu;
