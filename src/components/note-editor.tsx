"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createNote, updateNote, deleteNote } from "@/app/actions/stocks";
import type { NoteWithTags } from "@/app/actions/stocks";
import { TagInput } from "./tag-input";
import { GroupSelect } from "./group-select";
import { Button } from "@/components/ui/button";

interface NoteEditorProps {
  note?: NoteWithTags;
  groups: string[];
  tagSuggestions: string[];
}

export function NoteEditor({ note, groups, tagSuggestions }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [group, setGroup] = useState(note?.group ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!title.trim() || saving) return;
    setSaving(true);

    const data = {
      title,
      content,
      group: group || null,
      tags,
    };

    if (note) {
      await updateNote(note.id, data);
    } else {
      const result = await createNote(data);
      if (result && "id" in result && result.id) {
        router.push(`/notes/${result.id}`);
        return;
      }
    }

    setSaving(false);
  }, [title, content, group, tags, note, saving, router]);

  async function handleDelete() {
    if (!note) return;
    if (!confirm("Delete this note?")) return;
    await deleteNote(note.id);
    router.push("/notes");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4" onKeyDown={handleKeyDown}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border-none bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground"
      />

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Group
        </label>
        <GroupSelect value={group} onChange={setGroup} groups={groups} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Tags
        </label>
        <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note in Markdown..."
          rows={16}
          className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={!title.trim() || saving}>
          {saving ? "Saving..." : note ? "Save" : "Create"}
        </Button>
        {note && (
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Cmd+Enter to save</span>
      </div>
    </div>
  );
}
