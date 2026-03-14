import { getChannels } from "@/app/actions/channels";
import { ChannelList } from "./channel-list";
import { CreateChannelDialog } from "./create-channel-dialog";
import { ThemeToggle } from "./theme-toggle";

export async function Sidebar() {
  const channelList = await getChannels();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Thread</h1>
        <ThemeToggle />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Channels
          </span>
          <CreateChannelDialog />
        </div>
        <nav className="px-2">
          <ChannelList channels={channelList} />
        </nav>
      </div>
    </aside>
  );
}
