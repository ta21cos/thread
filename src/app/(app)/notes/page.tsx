import Link from "next/link";
import { getNotes } from "@/app/actions/stocks";
import { NoteList } from "@/components/note-list";

export default async function NotesPage() {
  const notes = await getNotes("note");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notes</h2>
        <Link
          href="/notes/new"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          New Note
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No notes yet.</p>
          <p className="mt-1 text-sm">Create your first note to get started.</p>
        </div>
      ) : (
        <NoteList notes={notes} />
      )}
    </div>
  );
}
