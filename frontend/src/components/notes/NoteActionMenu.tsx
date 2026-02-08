import React from 'react';
import { MoreVertical, Trash2, Bookmark, Link2, Edit, Pin, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showHiddenToggle && onToggleHidden && (
          <>
            <DropdownMenuCheckboxItem
              checked={isHidden}
              onCheckedChange={(checked) => onToggleHidden(noteId, checked)}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Hidden
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <Pin className="mr-2 h-4 w-4" />
          Pin note
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bookmark className="mr-2 h-4 w-4" />
          Bookmark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
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
  );
};

export default NoteActionMenu;
