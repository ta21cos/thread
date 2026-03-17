"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostItem } from "@/components/post-item";
import { MessageCircle } from "lucide-react";

type Post = {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
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
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
