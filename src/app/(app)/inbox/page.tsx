import { Inbox } from "lucide-react";
import { getInboxItems, getNotes } from "@/app/actions/stocks";
import { InboxList } from "@/components/inbox-list";

export default async function InboxPage() {
  const [items, notes] = await Promise.all([getInboxItems(), getNotes("note")]);

  return (
    <div className="-m-6 flex h-[calc(100%+48px)] flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
        <Inbox className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Inbox</h2>
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">
        <InboxList items={items} existingNotes={notes} />
      </div>
    </div>
  );
}
