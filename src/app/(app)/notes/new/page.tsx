import { getGroups, getTags } from "@/app/actions/stocks";
import { NoteEditor } from "@/components/note-editor";

export default async function NewNotePage() {
  const [groups, tagSuggestions] = await Promise.all([getGroups(), getTags()]);

  return <NoteEditor groups={groups} tagSuggestions={tagSuggestions} />;
}
