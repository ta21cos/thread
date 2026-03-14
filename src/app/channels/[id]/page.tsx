import { Suspense } from "react";
import { Hash } from "lucide-react";
import { notFound } from "next/navigation";
import { getChannel } from "@/app/actions/channels";
import { getPosts } from "@/app/actions/posts";
import { getReplyCounts } from "@/app/actions/post-replies";
import { PostList } from "@/components/post-list";
import { PostInput } from "@/components/post-input";
import { ThreadPanel } from "@/components/thread-panel";

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { id } = await params;
  const { highlight } = await searchParams;
  const channel = await getChannel(id);

  if (!channel) {
    notFound();
  }

  const posts = await getPosts(id);
  const postIds = posts.map((p) => p.id);
  const threadReplyCounts = await getReplyCounts(postIds);

  return (
    <div className="-m-6 flex h-[calc(100%+48px)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {channel.name}
            </h2>
            {channel.description && (
              <p className="text-xs text-muted-foreground">
                {channel.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto px-6">
          <PostList
            posts={posts}
            threadReplyCounts={threadReplyCounts}
            highlightPostId={highlight}
          />
        </div>
        <div className="shrink-0 px-6 pb-4">
          <PostInput channelId={id} />
        </div>
      </div>
      <Suspense>
        <ThreadPanel channelId={id} />
      </Suspense>
    </div>
  );
}
