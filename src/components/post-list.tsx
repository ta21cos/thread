"use client";

import { useEffect, useRef } from "react";
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
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
