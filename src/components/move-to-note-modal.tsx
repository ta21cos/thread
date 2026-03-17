"use client";

import { useTransition } from "react";
import { FileText, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  moveToNote,
  moveMultipleToNote,
  mergeIntoNote,
} from "@/app/actions/stocks";
import type { NoteWithTags } from "@/app/actions/stocks";

interface MoveToNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockIds: string[];
  existingNotes: NoteWithTags[];
  onComplete: () => void;
}

export function MoveToNoteModal({
  open,
  onOpenChange,
  stockIds,
  existingNotes,
  onComplete,
}: MoveToNoteModalProps) {
  const [isPending, startTransition] = useTransition();

  const isSingle = stockIds.length === 1;

  const handleSaveAsNewNote = () => {
    startTransition(async () => {
      if (isSingle) {
        await moveToNote(stockIds[0]);
      } else {
        await moveMultipleToNote(stockIds);
      }
      onComplete();
    });
  };

  const handleMergeIntoNote = (targetNoteId: string) => {
    if (!isSingle) return;
    startTransition(async () => {
      await mergeIntoNote(stockIds[0], targetNoteId);
      onComplete();
    });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Move to Note"
      description="Save as a new note or merge into an existing note."
    >
      <CommandInput
        placeholder="Search notes..."
        disabled={isPending}
      />
      <CommandList>
        <CommandEmpty>No notes found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleSaveAsNewNote} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Save as new note
          </CommandItem>
        </CommandGroup>
        {isSingle && existingNotes.length > 0 && (
          <CommandGroup heading="Merge into existing note">
            {existingNotes.map((note) => (
              <CommandItem
                key={note.id}
                onSelect={() => handleMergeIntoNote(note.id)}
                disabled={isPending}
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <span className="truncate">{note.title}</span>
                  {note.group && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {note.group}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
