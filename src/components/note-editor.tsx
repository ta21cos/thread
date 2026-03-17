"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagInput } from "./tag-input";
import { GroupSelect } from "./group-select";
import { createNote, updateNote, deleteNote } from "@/app/actions/stocks";
import type { NoteWithTags } from "@/app/actions/stocks";

interface NoteEditorProps {
  note?: NoteWithTags;
  groups: string[];
  tagSuggestions: string[];
}

export function NoteEditor({ note, groups, tagSuggestions }: NoteEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [group, setGroup] = useState(note?.group ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [noteId, setNoteId] = useState(note?.id);
  const noteIdRef = useRef(note?.id);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const save = useCallback((t: string, c: string, g: string, tg: string[]) => {
    if (!t.trim()) return;
    setSaveStatus("saving");

    const data = {
      title: t,
      content: c,
      group: g || null,
      tags: tg,
    };

    startTransition(async () => {
      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, data);
      } else {
        const result = await createNote(data);
        if (result && "id" in result && result.id) {
          noteIdRef.current = result.id;
          setNoteId(result.id);
          window.history.replaceState(null, "", `/notes/${result.id}`);
        }
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    });
  }, []);

  const debouncedSave = useCallback(
    (t: string, c: string, g: string, tg: string[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(t, c, g, tg), 800);
    },
    [save],
  );

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTitle(v);
    debouncedSave(v, content, group, tags);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setContent(v);
    debouncedSave(title, v, group, tags);
  }

  function handleGroupChange(v: string) {
    setGroup(v);
    debouncedSave(title, content, v, tags);
  }

  function handleTagsChange(v: string[]) {
    setTags(v);
    save(title, content, group, v);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleDelete() {
    if (!noteIdRef.current) return;
    if (!window.confirm("Delete this note?")) return;
    const id = noteIdRef.current;

    startTransition(async () => {
      await deleteNote(id);
      router.push("/notes");
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
        />
        <div className="flex shrink-0 items-center gap-1 pt-2">
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {noteId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Delete"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GroupSelect
          value={group}
          onChange={handleGroupChange}
          groups={groups}
        />
        <div className="h-4 w-px bg-border" />
        <TagInput
          tags={tags}
          onChange={handleTagsChange}
          suggestions={tagSuggestions}
        />
      </div>

      <div className="mt-6">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Write your note..."
          className="prose prose-sm dark:prose-invert min-h-[50vh] w-full max-w-none resize-y bg-transparent px-0 py-2 outline-none placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>
    </div>
  );
}
