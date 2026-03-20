"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, FileText, BookOpen } from "lucide-react";
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

  const grouped: Record<string, NoteWithTags[]> = {};
  const ungrouped: NoteWithTags[] = [];

  for (const note of notes) {
    if (note.group) {
      if (!grouped[note.group]) {
        grouped[note.group] = [];
      }
      grouped[note.group].push(note);
    } else {
      ungrouped.push(note);
    }
  }

  const groupNames = Object.keys(grouped).sort();

  if (notes.length === 0) {
    return (
      <div className="px-2 py-2 text-center text-xs text-muted-foreground">
        No notes yet.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {groupNames.map((group) => (
        <SidebarGroup
          key={group}
          group={group}
          notes={grouped[group]}
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

function SidebarGroup({
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
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <BookOpen className="h-3 w-3" />
        <span className="truncate">{group}</span>
      </button>
      {open && (
        <ul className="ml-3 space-y-0.5">
          {notes.map((note) => (
            <li key={note.id}>
              <NoteLink
                note={note}
                isActive={pathname === `/notes/${note.id}`}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
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
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
        isActive && "bg-accent font-medium",
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-xs">{note.title}</span>
    </Link>
  );
}
