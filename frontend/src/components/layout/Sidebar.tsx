import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bookmark, CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ChannelList } from '@/components/channels/ChannelList';
import { UserButton } from '@/components/UserButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = React.memo<NavItemProps>(({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
});

NavItem.displayName = 'NavItem';

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  const handleBookmarksClick = useCallback(() => handleNavigate('/bookmarks'), [handleNavigate]);

  const handleTasksClick = useCallback(() => handleNavigate('/tasks'), [handleNavigate]);

  const handleDailyClick = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    handleNavigate(`/daily/${today}`);
  }, [handleNavigate]);

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">Thread Notes</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChannelList className="px-1 pt-2" />

        <Separator className="my-2" />

        <nav className="space-y-0.5 px-2">
          <NavItem
            icon={<Bookmark className="h-4 w-4" />}
            label="Bookmarks"
            isActive={pathname === '/bookmarks'}
            onClick={handleBookmarksClick}
          />
          <NavItem
            icon={<CheckSquare className="h-4 w-4" />}
            label="Tasks"
            isActive={pathname === '/tasks'}
            onClick={handleTasksClick}
          />
          <NavItem
            icon={<Calendar className="h-4 w-4" />}
            label="Daily Notes"
            isActive={pathname.startsWith('/daily')}
            onClick={handleDailyClick}
          />
        </nav>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <UserButton />
        <div className="flex-1" />
        <KeyboardShortcutsHelp />
        <SettingsDropdown />
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Sidebar;
