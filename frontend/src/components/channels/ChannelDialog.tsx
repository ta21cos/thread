import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useChannelUI } from '../../store/channel.store';
import {
  useChannel,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from '../../services/channel.service';

const CHANNEL_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

export const ChannelDialog: React.FC = () => {
  const { isChannelDialogOpen, editingChannelId, closeChannelDialog } = useChannelUI();
  const { data: existingChannel } = useChannel(editingChannelId ?? undefined);

  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const [name, setName] = useState('');
  const [color, setColor] = useState(CHANNEL_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingChannelId;

  // Reset form when dialog opens/closes or channel changes
  useEffect(() => {
    if (isChannelDialogOpen && existingChannel) {
      setName(existingChannel.name);
      setColor(existingChannel.color);
    } else if (isChannelDialogOpen && !editingChannelId) {
      setName('');
      setColor(CHANNEL_COLORS[0]);
    }
  }, [isChannelDialogOpen, existingChannel, editingChannelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingChannelId) {
        await updateChannel.mutateAsync({ id: editingChannelId, name: name.trim(), color });
      } else {
        await createChannel.mutateAsync({ name: name.trim(), color });
      }
      closeChannelDialog();
    } catch (error) {
      console.error('Failed to save channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingChannelId || isSubmitting) return;

    if (
      !confirm('Are you sure you want to delete this channel? Notes will be moved to "All Notes".')
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteChannel.mutateAsync(editingChannelId);
      closeChannelDialog();
    } catch (error) {
      console.error('Failed to delete channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isChannelDialogOpen} onOpenChange={(open) => !open && closeChannelDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Channel' : 'Create Channel'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="channel-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, Personal, Ideas"
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={closeChannelDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChannelDialog;
