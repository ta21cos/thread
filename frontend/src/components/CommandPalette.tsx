import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, CheckSquare, Calendar, Hash, StickyNote, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useChannels } from '@/services/channel.service';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
}

interface CommandOptionProps {
  cmd: CommandItem;
  isSelected: boolean;
  onExecute: (cmd: CommandItem) => void;
  onSelect: (index: number) => void;
  globalIndex: number;
}

const CommandOption = React.memo<CommandOptionProps>(
  ({ cmd, isSelected, onExecute, onSelect, globalIndex }) => {
    const handleClick = useCallback(() => onExecute(cmd), [onExecute, cmd]);
    const handleMouseEnter = useCallback(() => onSelect(globalIndex), [onSelect, globalIndex]);

    return (
      <button
        role="option"
        aria-selected={isSelected}
        data-selected={isSelected}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground'
        )}
      >
        {cmd.icon}
        <span>{cmd.label}</span>
      </button>
    );
  }
);

CommandOption.displayName = 'CommandOption';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleScratchPad: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onToggleScratchPad,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prevQueryRef = useRef(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: channels } = useChannels();

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: 'nav-notes',
        label: 'All Notes',
        icon: <StickyNote className="h-4 w-4" />,
        action: () => navigate('/'),
        group: 'Navigation',
      },
      {
        id: 'nav-bookmarks',
        label: 'Bookmarks',
        icon: <Bookmark className="h-4 w-4" />,
        action: () => navigate('/bookmarks'),
        group: 'Navigation',
      },
      {
        id: 'nav-tasks',
        label: 'Tasks',
        icon: <CheckSquare className="h-4 w-4" />,
        action: () => navigate('/tasks'),
        group: 'Navigation',
      },
      {
        id: 'nav-daily',
        label: 'Daily Notes',
        icon: <Calendar className="h-4 w-4" />,
        action: () => {
          const today = new Date().toISOString().split('T')[0];
          navigate(`/daily/${today}`);
        },
        group: 'Navigation',
      },
    ];

    if (channels) {
      for (const channel of channels) {
        items.push({
          id: `channel-${channel.id}`,
          label: channel.name,
          icon: <Hash className="h-4 w-4" style={{ color: channel.color }} />,
          action: () => navigate(`/channels/${channel.id}`),
          group: 'Channels',
        });
      }
    }

    items.push({
      id: 'action-scratchpad',
      label: 'Toggle Scratch Pad',
      icon: <StickyNote className="h-4 w-4" />,
      action: onToggleScratchPad,
      group: 'Actions',
    });

    return items;
  }, [navigate, channels, onToggleScratchPad]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(lower));
  }, [commands, query]);

  // Reset selectedIndex when query changes (derived reset via ref comparison)
  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    if (selectedIndex !== 0) {
      setSelectedIndex(0);
    }
  }

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      onOpenChange(false);
      cmd.action();
    },
    [onOpenChange]
  );

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const cmd = filtered[selectedIndex];
          if (cmd) executeCommand(cmd);
          break;
        }
      }
    },
    [filtered, selectedIndex, executeCommand]
  );

  useEffect(() => {
    const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const groupedFiltered = useMemo(() => {
    const groups: { name: string; items: { cmd: CommandItem; globalIndex: number }[] }[] = [];
    const groupMap = new Map<string, { cmd: CommandItem; globalIndex: number }[]>();

    filtered.forEach((cmd, globalIndex) => {
      const existing = groupMap.get(cmd.group);
      if (existing) {
        existing.push({ cmd, globalIndex });
      } else {
        const arr = [{ cmd, globalIndex }];
        groupMap.set(cmd.group, arr);
        groups.push({ name: cmd.group, items: arr });
      }
    });

    return groups;
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div
          className="flex items-center gap-2 border-b border-border px-3"
          onKeyDown={handleKeyDown}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            placeholder="Type a command..."
            className="h-10 border-0 shadow-none focus-visible:ring-0 focus-visible:border-transparent"
          />
        </div>

        <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            groupedFiltered.map((group) => (
              <div key={group.name} role="group" aria-label={group.name}>
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {group.name}
                </p>
                {group.items.map(({ cmd, globalIndex }) => (
                  <CommandOption
                    key={cmd.id}
                    cmd={cmd}
                    isSelected={selectedIndex === globalIndex}
                    onExecute={executeCommand}
                    onSelect={setSelectedIndex}
                    globalIndex={globalIndex}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
