import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note } from '../../../shared/types';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { useFocus } from '@/store/focus.context';

interface NoteEditorProps {
  initialContent?: string;
  parentNote?: Note;
  onSubmit: (content: string, isHidden?: boolean) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onMentionTrigger?: (searchTerm: string) => void;
  onMentionInsert?: (insertFn: (noteId: string) => void) => void;
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
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { registerInput, unregisterInput } = useFocus();

  // NOTE: Register input with FocusContext
  useEffect(() => {
    registerInput('note-editor', textareaRef);
    return () => {
      unregisterInput('note-editor');
    };
  }, [registerInput, unregisterInput]);

  // NOTE: Smart auto-focus - focus when editing or creating new note
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // NOTE: Small delay to ensure DOM is ready
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // NOTE: Position cursor at end when editing existing content
          if (initialContent) {
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
          }
        }
      }, 0);
    }
  }, [autoFocus, initialContent]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (newContent.length > maxLength) {
        setError(`Content exceeds ${maxLength} characters`);
        return;
      }

      setContent(newContent);
      setError(null);

      // NOTE: Get cursor position from textarea ref
      if (textareaRef.current) {
        setCursorPosition(textareaRef.current.selectionStart);

        // NOTE: Detect @ mention trigger
        if (onMentionTrigger) {
          const beforeCursor = newContent.slice(0, textareaRef.current.selectionStart);
          const mentionMatch = beforeCursor.match(/@(\w*)$/);
          if (mentionMatch) {
            onMentionTrigger(mentionMatch[1]);
          }
        }
      }
    },
    [maxLength, onMentionTrigger]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

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
      await onSubmit(content.trim(), isHidden);
      setContent('');
      setIsHidden(false);
      setError(null);

      // NOTE: Smart auto-focus - re-focus for next note if creating (not editing)
      if (!onCancel && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // NOTE: Cancel with Escape
      if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
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

  return (
    <div className="space-y-3" data-testid="note-editor">
      {parentNote && (
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

      <form onSubmit={handleSubmit}>
        <TextInput
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          autoFocus={autoFocus}
          isHidden={isHidden}
          onHiddenChange={setIsHidden}
        />

        {onCancel && (
          <div className="flex items-center gap-2 mt-2">
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
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm mt-2" data-testid="note-editor-error">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default NoteEditor;
