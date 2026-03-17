import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggle } from "./theme-toggle";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function MobileHeader({ channels }: { channels: Channel[] }) {
  return (
    <header className="flex h-14 items-center border-b px-4 md:hidden">
      <MobileSidebar channels={channels} />
      <h1 className="ml-3 flex-1 text-lg font-semibold">Thread</h1>
      <ThemeToggle />
    </header>
  );
}
