import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder = 'Type a message...',
      disabled = false,
      autoFocus = false,
      className,
      onKeyDown,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (onKeyDown) {
          onKeyDown(e);
        }

        // NOTE: Submit with Cmd/Ctrl + Enter
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmit();
        }
      },
      [onKeyDown, onSubmit]
    );

    // NOTE: Auto-resize textarea based on content (max 3 rows)
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const maxHeight = lineHeight * 3;

      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }, [value, textareaRef]);

    return (
      <div className={cn('flex items-end gap-2', className)}>
        <div className="flex-1 rounded-lg border border-input bg-card">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            className="border-0 bg-transparent focus-visible:ring-0 min-h-[72px] resize-none"
            rows={3}
          />
          <div className="flex items-center gap-1 px-3 pb-2">
            <Button size="icon" variant="ghost" className="h-7 w-7" type="button">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" type="button">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          type="button"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
