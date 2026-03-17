import { notFound } from "next/navigation";
import { getNoteById, getGroups, getTags } from "@/app/actions/stocks";
import { NoteEditor } from "@/components/note-editor";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [note, groups, tagSuggestions] = await Promise.all([
    getNoteById(id),
    getGroups(),
    getTags(),
  ]);

  if (!note) {
    notFound();
  }

  return (
    <NoteEditor note={note} groups={groups} tagSuggestions={tagSuggestions} />
  );
}
