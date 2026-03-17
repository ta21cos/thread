import { getChannels } from "@/app/actions/channels";
import { getNotes } from "@/app/actions/stocks";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { SearchModal } from "@/components/search-modal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [channelList, noteList] = await Promise.all([
    getChannels(),
    getNotes("note"),
  ]);

  return (
    <>
      <div className="flex h-screen">
        <Sidebar channels={channelList} notes={noteList} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader channels={channelList} notes={noteList} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <SearchModal />
    </>
  );
}
