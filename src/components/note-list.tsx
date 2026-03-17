"use client";

import Link from "next/link";
import type { NoteWithTags } from "@/app/actions/stocks";

interface NoteListProps {
  notes: NoteWithTags[];
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NoteItem({ note }: { note: NoteWithTags }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="block rounded-md px-3 py-2 transition-colors hover:bg-accent"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-medium">{note.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(note.updatedAt)}
        </span>
      </div>
      {note.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function NoteList({ notes }: NoteListProps) {
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

  return (
    <div className="space-y-6">
      {sortedGroups.map((group) => (
        <section key={group}>
          <h3 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">
            {group}
          </h3>
          <div className="space-y-0.5">
            {grouped.get(group)!.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        </section>
      ))}
      {ungrouped.length > 0 && (
        <section>
          {sortedGroups.length > 0 && (
            <h3 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">
              Ungrouped
            </h3>
          )}
          <div className="space-y-0.5">
            {ungrouped.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
