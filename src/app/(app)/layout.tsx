import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { SearchModal } from "@/components/search-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <SearchModal />
    </>
  );
}
