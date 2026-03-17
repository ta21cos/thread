"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
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
}: {
  channels: Channel[];
  notes: NoteWithTags[];
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
