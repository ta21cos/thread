import { getChannels } from "@/app/actions/channels";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggle } from "./theme-toggle";

export async function MobileHeader() {
  const channelList = await getChannels();

  return (
    <header className="flex h-14 items-center border-b px-4 md:hidden">
      <MobileSidebar channels={channelList} />
      <h1 className="ml-3 flex-1 text-lg font-semibold">Thread</h1>
      <ThemeToggle />
    </header>
  );
}
