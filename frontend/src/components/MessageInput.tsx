import React, { useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  'data-testid'?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write a message...',
  disabled = false,
  autoFocus = false,
  maxLength = 1000,
  onKeyDown,
  className,
  'data-testid': dataTestId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // NOTE: Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // NOTE: Submit with Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }

    // NOTE: Call custom onKeyDown handler if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const isSubmitDisabled = disabled || !value.trim();

  return (
    <div className={cn('border-t border-border p-4', className)} data-testid={dataTestId}>
      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-lg border border-input bg-card">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={3}
            className="border-0 bg-transparent resize-none focus-visible:ring-0"
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
          disabled={isSubmitDisabled}
          type="submit"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
