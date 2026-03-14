"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Send, Pencil, Trash2, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getPost } from "@/app/actions/posts";
import {
  getReplies,
  createReply,
  updateReply,
  deleteReply,
} from "@/app/actions/post-replies";

type Post = {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type Reply = {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

function formatTimestamp(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReplyItem({
  reply,
  channelId,
}: {
  reply: Reply;
  channelId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [deleting, setDeleting] = useState(false);

  const isEdited = reply.createdAt.getTime() !== reply.updatedAt.getTime();

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await updateReply(reply.id, editContent, channelId);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(reply.content);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteReply(reply.id, channelId);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="group relative border-b border-border/50 px-3 py-3 hover:bg-muted/50">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {formatTimestamp(reply.createdAt)}
        </span>
        {isEdited && (
          <span className="text-xs italic text-muted-foreground">(edited)</span>
        )}
      </div>

      {editing ? (
        <div className="mt-1 space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="min-h-[60px]"
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-0.5">
          <MarkdownRenderer content={reply.content} />
        </div>
      )}

      {!editing && (
        <div className="absolute -top-2 right-2 hidden gap-0.5 rounded-md border bg-background p-0.5 shadow-sm group-hover:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setEditContent(reply.content);
              setEditing(true);
            }}
            aria-label="Edit reply"
            title="Edit reply"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete reply"
            title="Delete reply"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ReplyInput({
  postId,
  channelId,
  onReplySent,
}: {
  postId: string;
  channelId: string;
  onReplySent?: () => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setContent("");
    await createReply(postId, trimmed, channelId);
    setSending(false);
    onReplySent?.();
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
          placeholder="Reply in thread... (Cmd+Enter to send)"
          className="min-h-[44px] resize-none"
          rows={1}
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          className="h-[44px] w-[44px] shrink-0"
          aria-label="Send reply"
          title="Send reply"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ThreadPanelContent({
  postId,
  channelId,
  onClose,
}: {
  postId: string;
  channelId: string;
  onClose: () => void;
}) {
  const [parentPost, setParentPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshReplies = useCallback(async () => {
    const threadReplies = await getReplies(postId);
    setReplies(threadReplies);
  }, [postId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [parent, threadReplies] = await Promise.all([
        getPost(postId),
        getReplies(postId),
      ]);
      if (!mounted) return;
      setParentPost(parent ?? null);
      setReplies(threadReplies);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [postId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading thread...
      </div>
    );
  }

  if (!parentPost) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Post not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Thread</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
          aria-label="Close thread"
          title="Close thread"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b px-4 py-3">
          <div className="text-xs font-medium text-muted-foreground">
            {formatTimestamp(parentPost.createdAt)}
          </div>
          <div className="mt-0.5">
            <MarkdownRenderer content={parentPost.content} />
          </div>
        </div>

        {replies.length > 0 && (
          <div className="border-b px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </p>
          </div>
        )}

        <div className="flex flex-col">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              channelId={channelId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-4">
        <ReplyInput
          postId={postId}
          channelId={channelId}
          onReplySent={refreshReplies}
        />
      </div>
    </div>
  );
}

export function ThreadPanel({ channelId }: { channelId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("thread");
    const query = params.toString();
    router.push(query ? `?${query}` : `/channels/${channelId}`);
  };

  if (!threadId) return null;

  if (isMobile) {
    return (
      <Sheet open={!!threadId} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          className="w-full p-0 sm:max-w-full"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Thread</SheetTitle>
          </SheetHeader>
          <ThreadPanelContent
            postId={threadId}
            channelId={channelId}
            onClose={handleClose}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-l">
      <ThreadPanelContent
        postId={threadId}
        channelId={channelId}
        onClose={handleClose}
      />
    </div>
  );
}
