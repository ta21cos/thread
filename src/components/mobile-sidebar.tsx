"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChannelList } from "./channel-list";
import { CreateChannelDialog } from "./create-channel-dialog";
import { NotesSidebarSection } from "./notes-sidebar-section";
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

export function MobileSidebar({
  channels,
  notes,
  inboxCount,
}: {
  channels: Channel[];
  notes: NoteWithTags[];
  inboxCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 overflow-auto p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Thread</SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Channels
          </span>
          <CreateChannelDialog />
        </div>
        <nav className="px-2 pb-4">
          <ChannelList channels={channels} onNavigate={() => setOpen(false)} />
        </nav>

        <div className="px-2 pb-2">
          <Link
            href="/inbox"
            onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground"
          >
            Notes
          </Link>
        </div>
        <nav className="px-2 pb-4">
          <NotesSidebarSection
            notes={notes}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
