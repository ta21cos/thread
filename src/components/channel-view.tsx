"use client";

import { useCallback, useState } from "react";
import { PostList } from "./post-list";
import { PostInput } from "./post-input";

type Post = {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
  isPromoted?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function ChannelView({
  channelId,
  posts: serverPosts,
  threadReplyCounts,
  highlightPostId,
}: {
  channelId: string;
  posts: Post[];
  threadReplyCounts: Record<string, number>;
  highlightPostId?: string;
}) {
  const [optimisticPosts, setOptimisticPosts] = useState<Post[]>([]);

  const handleOptimisticPost = useCallback(
    (content: string) => {
      const now = new Date();
      const optimistic: Post = {
        id: `optimistic-${Date.now()}`,
        channelId,
        content,
        authorId: "",
        createdAt: now,
        updatedAt: now,
      };
      setOptimisticPosts((prev) => [...prev, optimistic]);
    },
    [channelId],
  );

  const allPosts = [
    ...serverPosts,
    ...optimisticPosts.filter(
      (op) =>
        !serverPosts.some(
          (sp) => sp.content === op.content && sp.createdAt >= op.createdAt,
        ),
    ),
  ];

  return (
    <>
      <div className="flex-1 overflow-auto px-6">
        <PostList
          posts={allPosts}
          threadReplyCounts={threadReplyCounts}
          highlightPostId={highlightPostId}
        />
      </div>
      <div className="shrink-0 px-6 pb-4">
        <PostInput
          channelId={channelId}
          onOptimisticPost={handleOptimisticPost}
        />
      </div>
    </>
  );
}
