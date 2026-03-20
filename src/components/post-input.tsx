"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/app/actions/posts";

export function PostInput({
  channelId,
  onOptimisticPost,
}: {
  channelId: string;
  onOptimisticPost?: (content: string) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setContent("");
    onOptimisticPost?.(trimmed);
    await createPost(channelId, trimmed);
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative border-t pt-3">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message... (Cmd+Enter to send)"
          className="min-h-[44px] resize-none"
          rows={1}
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          className="h-[44px] w-[44px] shrink-0"
          aria-label="Send message"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
