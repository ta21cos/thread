import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useKeyboardShortcuts, Shortcut } from '@/hooks/useKeyboardShortcuts';
import { useChannels } from '@/services/channel.service';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { ScratchPadPanel } from '@/components/scratch-pad/ScratchPadPanel';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scratchPadOpen, setScratchPadOpen] = useState(false);
  const navigate = useNavigate();
  const { data: channels } = useChannels();

  const toggleScratchPad = useCallback(() => {
    setScratchPadOpen((prev) => !prev);
  }, []);

  const shortcuts = useMemo<Shortcut[]>(() => {
    const base: Shortcut[] = [
      {
        key: 'mod+b',
        handler: () => navigate('/bookmarks'),
        description: 'Go to Bookmarks',
      },
      {
        key: 'mod+t',
        handler: () => navigate('/tasks'),
        description: 'Go to Tasks',
      },
      {
        key: 'mod+d',
        handler: () => {
          const today = new Date().toISOString().split('T')[0];
          navigate(`/daily/${today}`);
        },
        description: 'Go to Daily Notes',
      },
      {
        key: 'mod+/',
        handler: toggleScratchPad,
        description: 'Toggle Scratch Pad',
      },
    ];

    // NOTE: Cmd+1~9 for channel switching
    if (channels) {
      channels.slice(0, 9).forEach((channel, index) => {
        base.push({
          key: `mod+${index + 1}`,
          handler: () => navigate(`/channels/${channel.id}`),
          description: `Switch to channel: ${channel.name}`,
        });
      });
    }

    return base;
  }, [navigate, channels, toggleScratchPad]);

  useKeyboardShortcuts(shortcuts);

  if (isDesktop) {
    return (
      <div className="flex h-screen w-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full">{children}</main>
        <ScratchPadPanel open={scratchPadOpen} onClose={() => setScratchPadOpen(false)} />
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
      <ScratchPadPanel open={scratchPadOpen} onClose={() => setScratchPadOpen(false)} />
    </div>
  );
};

export default AppLayout;
