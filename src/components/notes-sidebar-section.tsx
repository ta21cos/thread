"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteWithTags } from "@/app/actions/stocks";

interface NotesSidebarSectionProps {
  notes: NoteWithTags[];
  onNavigate?: () => void;
}

export function NotesSidebarSection({
  notes,
  onNavigate,
}: NotesSidebarSectionProps) {
  const pathname = usePathname();

  const grouped = new Map<string, NoteWithTags[]>();
  const ungrouped: NoteWithTags[] = [];

  for (const note of notes) {
    if (note.group) {
      const list = grouped.get(note.group) ?? [];
      list.push(note);
      grouped.set(note.group, list);
    } else {
      ungrouped.push(note);
    }
  }

  const sortedGroups = [...grouped.keys()].sort();

  if (notes.length === 0) {
    return (
      <div className="px-2 py-2 text-center text-xs text-muted-foreground">
        No notes yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedGroups.map((group) => (
        <GroupSection
          key={group}
          group={group}
          notes={grouped.get(group)!}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
      {ungrouped.map((note) => (
        <NoteLink
          key={note.id}
          note={note}
          isActive={pathname === `/notes/${note.id}`}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function GroupSection({
  group,
  notes,
  pathname,
  onNavigate,
}: {
  group: string;
  notes: NoteWithTags[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
        />
        <span className="truncate">{group}</span>
        <span className="ml-auto text-[10px]">{notes.length}</span>
      </button>
      {open && (
        <div className="ml-2">
          {notes.map((note) => (
            <NoteLink
              key={note.id}
              note={note}
              isActive={pathname === `/notes/${note.id}`}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteLink({
  note,
  isActive,
  onNavigate,
}: {
  note: NoteWithTags;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/notes/${note.id}`}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
        isActive && "bg-accent font-medium",
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{note.title}</span>
    </Link>
  );
}
