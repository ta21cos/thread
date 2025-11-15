import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note } from '../../../shared/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFocusManager } from '@/hooks/useFocusManager';

interface NoteEditorProps {
  initialContent?: string;
  parentNote?: Note;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onMentionTrigger?: (searchTerm: string) => void;
  onMentionInsert?: (insertFn: (noteId: string) => void) => void;
  focusId?: string; // Unique ID for focus management
  restoreFocusOnSubmit?: boolean; // Auto-focus after submit
  compactMode?: boolean; // Compact layout for reply inputs
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialContent = '',
  parentNote,
  onSubmit,
  onCancel,
  placeholder = 'Write a note...',
  maxLength = 1000,
  autoFocus = false,
  onMentionTrigger,
  onMentionInsert,
  focusId = 'note-editor',
  restoreFocusOnSubmit = true,
  compactMode = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Register with focus manager
  const { focus } = useFocusManager({
    id: focusId,
    ref: textareaRef,
    autoFocus,
    priority: parentNote ? 5 : 10, // Higher priority for main editor
  });

  // Track focus state for compact mode
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('blur', handleBlur);

    return () => {
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;

      if (newContent.length > maxLength) {
        setError(`Content exceeds ${maxLength} characters`);
        return;
      }

      setContent(newContent);
      setError(null);
      setCursorPosition(e.target.selectionStart);

      // NOTE: Detect @ mention trigger
      if (onMentionTrigger) {
        const beforeCursor = newContent.slice(0, e.target.selectionStart);
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        if (mentionMatch) {
          onMentionTrigger(mentionMatch[1]);
        }
      }
    },
    [maxLength, onMentionTrigger]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    if (content.length > maxLength) {
      setError(`Content exceeds ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(content.trim());
      setContent('');
      setError(null);

      // Auto-restore focus after submit (chat-like UX)
      if (restoreFocusOnSubmit) {
        setTimeout(() => {
          focus();
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // NOTE: Submit with Cmd/Ctrl + Enter
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e as React.FormEvent);
      }

      // NOTE: Cancel with Escape
      if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  const insertMention = useCallback(
    (noteId: string) => {
      if (!textareaRef.current) return;

      const beforeCursor = content.slice(0, cursorPosition);
      const afterCursor = content.slice(cursorPosition);

      // NOTE: Replace the partial mention with complete one
      const beforeWithoutPartial = beforeCursor.replace(/@\w*$/, '');
      const newContent = `${beforeWithoutPartial}@${noteId} ${afterCursor}`;

      setContent(newContent);

      // NOTE: Move cursor after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = beforeWithoutPartial.length + noteId.length + 2;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
          textareaRef.current.focus();
        }
      }, 0);
    },
    [content, cursorPosition]
  );

  // NOTE: Expose insertMention function to parent component
  useEffect(() => {
    if (onMentionInsert) {
      onMentionInsert(insertMention);
    }
  }, [onMentionInsert, insertMention]);

  // Dynamic placeholder based on context
  const dynamicPlaceholder = placeholder || (
    parentNote
      ? 'Reply... @ID to mention • Ctrl+Enter to send'
      : 'Start a new thread... @ID to mention • Ctrl+Enter to send'
  );

  // Adjust rows based on compact mode and focus state
  const textareaRows = compactMode ? (isFocused ? 3 : 1) : 3;

  return (
    <div className="space-y-3" data-testid="note-editor">
      {parentNote && !compactMode && (
        <div className="rounded-lg bg-accent p-3">
          <span className="block text-muted-foreground text-xs mb-1">
            Replying to #{parentNote.id}
          </span>
          <div className="text-foreground text-sm">
            {parentNote.content.substring(0, 100)}
            {parentNote.content.length > 100 && '...'}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={dynamicPlaceholder}
            className={cn(
              'resize-none transition-all duration-200',
              compactMode ? 'min-h-10' : 'min-h-20',
              isFocused && 'ring-2 ring-primary ring-offset-2',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            disabled={isSubmitting}
            rows={textareaRows}
            data-testid="note-editor-textarea"
          />

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-xs" data-testid="note-editor-char-count">
              <span className={cn(content.length > maxLength * 0.9 && 'text-warning')}>
                {content.length} / {maxLength}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  data-testid="note-editor-cancel"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !content.trim() || content.length > maxLength}
                data-testid="note-editor-submit"
              >
                {isSubmitting ? 'Saving...' : parentNote ? 'Reply' : 'Create Note'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm" data-testid="note-editor-error">
              {error}
            </div>
          )}
        </div>

        <div className="text-muted-foreground text-xs">
          <span>Tip: Use @ID to mention other notes • Press Cmd/Ctrl+Enter to submit</span>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;
