"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostItem } from "@/components/post-item";
import { PromoteDialog } from "@/components/promote-dialog";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Post = {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
  isPromoted?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function PostList({
  posts,
  threadReplyCounts,
  highlightPostId,
}: {
  posts: Post[];
  threadReplyCounts?: Record<string, number>;
  highlightPostId?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [promoteTarget, setPromoteTarget] = useState<{
    mode:
      | { type: "single"; postId: string; content: string; hasThread: boolean }
      | { type: "multiple"; postIds: string[]; firstContent: string };
  } | null>(null);

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    if (highlightPostId) {
      const el = document.getElementById(`post-${highlightPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts.length, highlightPostId]);

  const handleOpenThread = useCallback(
    (postId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("thread", postId);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleToggleSelect = useCallback((postId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const handlePromoteSingle = useCallback(
    (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const content = post.content.slice(0, 30).replace(/\n/g, " ");
      const hasThread = (threadReplyCounts?.[postId] ?? 0) > 0;
      setPromoteTarget({
        mode: {
          type: "single",
          postId,
          content,
          hasThread,
        },
      });
    },
    [posts, threadReplyCounts],
  );

  const handleBulkPromote = useCallback(() => {
    const ids = [...selectedIds];
    const firstPost = posts.find((p) => ids.includes(p.id));
    const firstContent = firstPost
      ? firstPost.content.slice(0, 30).replace(/\n/g, " ")
      : "";
    setPromoteTarget({
      mode: {
        type: "multiple",
        postIds: ids,
        firstContent,
      },
    });
  }, [selectedIds, posts]);

  const handlePromoteComplete = useCallback(() => {
    setPromoteTarget(null);
    setSelectedIds(new Set());
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
        <MessageCircle className="h-10 w-10" />
        <p className="text-sm">No posts yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-1 py-4">
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            threadReplyCount={threadReplyCounts?.[post.id]}
            highlight={post.id === highlightPostId}
            onOpenThread={handleOpenThread}
            onPromote={handlePromoteSingle}
            isSelected={selectedIds.has(post.id)}
            onToggleSelect={handleToggleSelect}
            selectionMode={selectionMode}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {selectionMode && (
        <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelSelection}>
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleBulkPromote}>
              Promote {selectedIds.size} posts
            </Button>
          </div>
        </div>
      )}

      {promoteTarget && (
        <PromoteDialog
          open={!!promoteTarget}
          onOpenChange={(open) => {
            if (!open) setPromoteTarget(null);
          }}
          mode={promoteTarget.mode}
          onComplete={handlePromoteComplete}
        />
      )}
    </div>
  );
}
