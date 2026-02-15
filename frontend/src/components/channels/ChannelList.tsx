import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useChannels } from '../../services/channel.service';
import { useChannelUI } from '../../store/channel.store';
import type { Channel } from '../../../../shared/types';

interface ChannelItemProps {
  channel: Channel;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}

const ChannelItem: React.FC<ChannelItemProps> = ({ channel, isSelected, onSelect, onEdit }) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
      )}
      onClick={() => onSelect(channel.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(channel.id);
        }
      }}
    >
      <Hash className="h-4 w-4 shrink-0" style={{ color: channel.color }} />
      <span className="flex-1 truncate text-sm">{channel.name}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 group-hover:opacity-100 h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(channel.id);
        }}
      >
        <Settings className="h-3 w-3" />
      </Button>
    </div>
  );
};

interface ChannelListProps {
  className?: string;
}

export const ChannelList: React.FC<ChannelListProps> = ({ className }) => {
  const navigate = useNavigate();
  const { data: channels, isLoading } = useChannels();
  const { selectedChannelId, setSelectedChannelId, openChannelDialog } = useChannelUI();

  const handleSelectChannel = (id: string) => {
    if (id === selectedChannelId) {
      setSelectedChannelId(null);
      navigate('/');
    } else {
      setSelectedChannelId(id);
      navigate(`/channels/${id}`);
    }
  };

  const handleEditChannel = (id: string) => {
    openChannelDialog(id);
  };

  const handleCreateChannel = () => {
    openChannelDialog();
  };

  if (isLoading) {
    return (
      <div className={cn('p-2', className)}>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between px-2 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Channels
        </span>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={handleCreateChannel}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 space-y-0.5">
        {/* All Notes (no channel filter) */}
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
            selectedChannelId === null ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          )}
          onClick={() => {
            setSelectedChannelId(null);
            navigate('/');
          }}
          role="button"
          tabIndex={0}
        >
          <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">All Notes</span>
        </div>

        {/* Channel list */}
        {channels?.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isSelected={selectedChannelId === channel.id}
            onSelect={handleSelectChannel}
            onEdit={handleEditChannel}
          />
        ))}

        {channels?.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4 text-center">
            No channels yet. Create one to organize your notes.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
