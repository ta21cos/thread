"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ExternalLink,
  FolderInput,
  Inbox,
  Square,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteStock, type NoteWithTags } from "@/app/actions/stocks";
import { MoveToNoteModal } from "@/components/move-to-note-modal";

interface InboxListProps {
  items: NoteWithTags[];
  existingNotes: NoteWithTags[];
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InboxList({ items, existingNotes }: InboxListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveTarget, setMoveTarget] = useState<{
    ids: string[];
  } | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const selectionMode = selectedIds.size > 0;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await deleteStock(id);
      router.refresh();
    });
  };

  const handleMoveToNote = (ids: string[]) => {
    setMoveTarget({ ids });
  };

  const handleMoveComplete = () => {
    setMoveTarget(null);
    setSelectedIds(new Set());
    router.refresh();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Inbox className="h-12 w-12" />
        <p className="text-sm">Your inbox is empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selectionMode && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleMoveToNote([...selectedIds])}
            >
              <FolderInput className="mr-1 h-3 w-3" />
              Move to Note
            </Button>
          </div>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className={`group rounded-lg border p-4 transition-colors hover:bg-muted/50 ${selectedIds.has(item.id) ? "border-primary/50 bg-primary/5" : ""}`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleToggleSelect(item.id)}
              className="mt-1 shrink-0"
            >
              {selectedIds.has(item.id) ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{item.title}</h3>
                {item.sourceChannelId && (
                  <Link
                    href={`/channels/${item.sourceChannelId}`}
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </Link>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.content}
              </p>
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatDate(item.createdAt)}
              </span>
            </div>

            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleMoveToNote([item.id])}
                title="Move to note"
              >
                <FolderInput className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(item.id)}
                disabled={deletingIds.has(item.id) || isPending}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {moveTarget && (
        <MoveToNoteModal
          open={!!moveTarget}
          onOpenChange={(open) => {
            if (!open) setMoveTarget(null);
          }}
          stockIds={moveTarget.ids}
          existingNotes={existingNotes}
          onComplete={handleMoveComplete}
        />
      )}
    </div>
  );
}
