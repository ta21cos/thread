import React, { useState, useMemo, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useKeyboardShortcuts, Shortcut } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { ScratchPadPanel } from '@/components/scratch-pad/ScratchPadPanel';
import { CommandPalette } from '@/components/CommandPalette';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scratchPadOpen, setScratchPadOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const closeScratchPad = useCallback(() => {
    setScratchPadOpen(false);
  }, []);

  const toggleScratchPad = useCallback(() => {
    setScratchPadOpen((prev) => !prev);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        key: 'mod+/',
        handler: toggleScratchPad,
        description: 'Toggle Scratch Pad',
      },
      {
        key: 'mod+k',
        handler: toggleCommandPalette,
        description: 'Open Command Palette',
        enableInInput: true,
      },
    ],
    [toggleScratchPad, toggleCommandPalette]
  );

  useKeyboardShortcuts(shortcuts);

  if (isDesktop) {
    return (
      <div className="flex h-screen w-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full">{children}</main>
        <ScratchPadPanel open={scratchPadOpen} onClose={closeScratchPad} />
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onToggleScratchPad={toggleScratchPad}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Mobile header with hamburger */}
      <div className="flex h-12 items-center border-b border-border px-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" onClose={() => setSidebarOpen(false)} className="w-56 p-0">
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 h-full overflow-hidden">{children}</main>
      <ScratchPadPanel open={scratchPadOpen} onClose={closeScratchPad} />
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onToggleScratchPad={toggleScratchPad}
      />
    </div>
  );
};

export default AppLayout;
