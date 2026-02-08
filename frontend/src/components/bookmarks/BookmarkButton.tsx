import React from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useIsBookmarked, useToggleBookmark } from '../../services/bookmark.service';

interface BookmarkButtonProps {
  noteId: string;
  className?: string;
  size?: 'sm' | 'default';
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  noteId,
  className,
  size = 'default',
}) => {
  const { data: isBookmarked, isLoading } = useIsBookmarked(noteId);
  const toggleBookmark = useToggleBookmark();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark.mutate(noteId);
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      className={cn(
        'transition-colors',
        isBookmarked && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
      onClick={handleClick}
      disabled={isLoading || toggleBookmark.isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
    </Button>
  );
};

export default BookmarkButton;
