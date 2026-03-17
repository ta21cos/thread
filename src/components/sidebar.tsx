import Link from "next/link";
import { Inbox } from "lucide-react";
import { ChannelList } from "./channel-list";
import { CreateChannelDialog } from "./create-channel-dialog";
import { NotesSidebarSection } from "./notes-sidebar-section";
import { ThemeToggle } from "./theme-toggle";
import type { NoteWithTags } from "@/app/actions/stocks";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function Sidebar({
  channels,
  notes,
  inboxCount,
}: {
  channels: Channel[];
  notes: NoteWithTags[];
  inboxCount?: number;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Thread</h1>
        <ThemeToggle />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Channels
          </span>
          <CreateChannelDialog />
        </div>
        <nav className="px-2">
          <ChannelList channels={channels} />
        </nav>

        <div className="px-2 pt-4 pb-2">
          <Link
            href="/inbox"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <Inbox className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>Inbox</span>
            {inboxCount !== undefined && inboxCount > 0 && (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                {inboxCount}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          <Link
            href="/notes"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground"
          >
            Notes
          </Link>
        </div>
        <nav className="px-2">
          <NotesSidebarSection notes={notes} />
        </nav>
      </div>
    </aside>
  );
}
