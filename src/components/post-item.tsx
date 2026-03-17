"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  Check,
  X,
  MessageSquare,
  Archive,
  Square,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { updatePost, deletePost } from "@/app/actions/posts";

type Post = {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
  isPromoted?: boolean;
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

export const PostItem = memo(function PostItem({
  post,
  threadReplyCount,
  highlight,
  onOpenThread,
  onPromote,
  isSelected,
  onToggleSelect,
  selectionMode,
}: {
  post: Post;
  threadReplyCount?: number;
  highlight?: boolean;
  onOpenThread: (postId: string) => void;
  onPromote?: (postId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (postId: string) => void;
  selectionMode?: boolean;
}) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (highlight && highlightRef.current) {
      const el = highlightRef.current;
      el.classList.add("bg-yellow-100", "dark:bg-yellow-900/30");
      const timer = setTimeout(() => {
        el.classList.remove("bg-yellow-100", "dark:bg-yellow-900/30");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  const [editContent, setEditContent] = useState(post.content);
  const [deleting, setDeleting] = useState(false);

  const isEdited = post.createdAt.getTime() !== post.updatedAt.getTime();

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await updatePost(post.id, post.channelId, editContent);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deletePost(post.id, post.channelId);
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

  const handleClick = () => {
    if (editing) return;
    if (selectionMode && onToggleSelect) {
      onToggleSelect(post.id);
    } else {
      onOpenThread(post.id);
    }
  };

  return (
    <div
      ref={highlightRef}
      id={`post-${post.id}`}
      className={`group relative cursor-pointer border-b border-border/50 px-3 py-3 transition-colors duration-150 hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""}`}
      onClick={handleClick}
    >
      <div className="flex items-baseline gap-2">
        {selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(post.id);
            }}
            className="relative top-0.5 shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {formatTimestamp(post.createdAt)}
        </span>
        {post.isPromoted && (
          <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            📌 Stocked
          </span>
        )}
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
          <MarkdownRenderer content={post.content} />
        </div>
      )}

      {threadReplyCount !== undefined && threadReplyCount > 0 && !editing && (
        <button
          onClick={() => onOpenThread(post.id)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {threadReplyCount} {threadReplyCount === 1 ? "reply" : "replies"}
        </button>
      )}

      {!editing && (
        <div
          className="absolute -top-2 right-2 hidden gap-0.5 rounded-md border bg-background p-0.5 shadow-sm group-hover:flex"
          onClick={(e) => e.stopPropagation()}
        >
          {!selectionMode && onToggleSelect && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onToggleSelect(post.id)}
              aria-label="Select post"
              title="Select post"
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
          {!post.isPromoted && onPromote && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onPromote(post.id)}
              aria-label="Promote to inbox"
              title="Promote to inbox"
            >
              <Archive className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onOpenThread(post.id)}
            aria-label="Reply in thread"
            title="Reply in thread"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setEditContent(post.content);
              setEditing(true);
            }}
            aria-label="Edit post"
            title="Edit post"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete post"
            title="Delete post"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
});
