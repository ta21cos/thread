"use client";

import { useTransition } from "react";
import { FilePlus, FileText } from "lucide-react";
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

  const handleCreateNew = () => {
    startTransition(async () => {
      if (isSingle) {
        await moveToNote(stockIds[0]);
      } else {
        await moveMultipleToNote(stockIds);
      }
      onComplete();
    });
  };

  const handleMerge = (targetNoteId: string) => {
    startTransition(async () => {
      for (const stockId of stockIds) {
        await mergeIntoNote(stockId, targetNoteId);
      }
      onComplete();
    });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Move to Note"
      description="Save as a new note or merge into an existing one"
    >
      <CommandInput placeholder="Search notes..." disabled={isPending} />
      <CommandList>
        <CommandEmpty>No matching notes found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleCreateNew} disabled={isPending}>
            <FilePlus className="mr-2 h-4 w-4" />
            Save as new note
          </CommandItem>
        </CommandGroup>
        {existingNotes.length > 0 && (
          <CommandGroup heading="Merge into existing note">
            {existingNotes.map((note) => (
              <CommandItem
                key={note.id}
                onSelect={() => handleMerge(note.id)}
                disabled={isPending}
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{note.title}</span>
                  {note.group && (
                    <span className="text-xs text-muted-foreground">
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
