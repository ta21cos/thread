'use client';

import { useState, useRef } from 'react';

interface MessageInputProps {
  onSubmitAction: (content: string) => Promise<void>;
  placeholder?: string;
  isThread?: boolean;
}

export function MessageInput({
  onSubmitAction,
  placeholder = 'メッセージを入力...',
  isThread = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitAction(content.trim());
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
    <div className={`${isThread ? 'ml-3xl' : ''} mb-lg`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col bg-base-100 border border-base-300 rounded-lg focus-within:border-primary transition-all duration-200 ease-out shadow-sm hover:shadow-md">
          {/* Input area - Fixed container to prevent layout shift */}
          <div className="flex-1 p-md">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="textarea textarea-ghost w-full resize-none min-h-input-area max-h-textarea p-0 text-sm leading-relaxed focus:outline-none placeholder:text-base-content/50"
              rows={1}
              disabled={isSubmitting}
            />
          </div>

          {/* Toolbar - Fixed height to prevent shift */}
          <div className="flex items-center justify-between px-md pb-md pt-xs border-t border-base-200 h-12">
            <div className="flex items-center gap-xs">
              {/* File upload */}
              <label
                className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors"
                title="ファイルを添付"
              >
                <input type="file" className="hidden" />
                <span className="text-sm">📎</span>
              </label>

              {/* Emoji picker */}
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors"
                title="絵文字を追加"
              >
                <span className="text-sm">😊</span>
              </button>

              {/* Mention */}
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors"
                title="メンション"
              >
                <span className="text-sm font-medium">@</span>
              </button>
            </div>

            {/* Send button - Fixed width to prevent layout shift */}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="btn btn-primary btn-sm min-w-[60px] transition-all duration-200 ease-out disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <span className="text-sm">送信</span>
              )}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-xs text-xs text-base-content/60 flex items-center gap-xs">
          <div className="flex items-center gap-xs">
            <kbd className="kbd kbd-xs px-xs py-xs">Enter</kbd>
            <span>で送信</span>
          </div>
          <span className="text-base-content/40">•</span>
          <div className="flex items-center gap-xs">
            <kbd className="kbd kbd-xs px-xs py-xs">Shift</kbd>
            <span>+</span>
            <kbd className="kbd kbd-xs px-xs py-xs">Enter</kbd>
            <span>で改行</span>
          </div>
        </div>
      </form>
    </div>
  );
}
