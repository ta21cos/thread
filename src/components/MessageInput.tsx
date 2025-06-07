'use client';

import { useState, useRef } from 'react';

interface MessageInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  isThread?: boolean;
  parentId?: string;
}

export function MessageInput({
  onSubmit,
  placeholder = 'メッセージを入力...',
  isThread = false,
  parentId,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className={`${isThread ? 'ml-12' : ''} mb-4`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col bg-base-100 border border-base-300 rounded-lg focus-within:border-primary transition-colors">
          {/* Input area */}
          <div className="flex-1 p-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="textarea textarea-ghost w-full resize-none min-h-[40px] max-h-[120px] p-0 text-base leading-relaxed focus:outline-none"
              rows={1}
              disabled={isSubmitting}
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-2">
              {/* File upload */}
              <label className="btn btn-ghost btn-sm btn-circle" title="ファイルを添付">
                <input type="file" className="hidden" />
                📎
              </label>

              {/* Emoji picker */}
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle"
                title="絵文字を追加"
              >
                😊
              </button>

              {/* Mention */}
              <button type="button" className="btn btn-ghost btn-sm btn-circle" title="メンション">
                @
              </button>
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : '送信'}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-1 text-xs text-base-content/60">
          <kbd className="kbd kbd-xs">Enter</kbd> で送信、
          <kbd className="kbd kbd-xs">Shift</kbd> + <kbd className="kbd kbd-xs">Enter</kbd> で改行
        </div>
      </form>
    </div>
  );
}
