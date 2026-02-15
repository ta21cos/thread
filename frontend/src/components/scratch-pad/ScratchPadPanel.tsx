import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  useScratchPad,
  useUpdateScratchPad,
  useConvertScratchPad,
} from '@/services/scratch-pad.service';
import { useChannelUI } from '@/store/channel.store';

interface ScratchPadPanelProps {
  open: boolean;
  onClose: () => void;
}

export const ScratchPadPanel: React.FC<ScratchPadPanelProps> = ({ open, onClose }) => {
  const { selectedChannelId } = useChannelUI();
  const { data: scratchPad } = useScratchPad(selectedChannelId);
  const updateScratchPad = useUpdateScratchPad();
  const convertToNote = useConvertScratchPad();
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // NOTE: Sync content from server
  useEffect(() => {
    if (scratchPad) {
      setContent(scratchPad.content || '');
    }
  }, [scratchPad]);

  // NOTE: Focus textarea when panel opens
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [open]);

  // NOTE: Auto-save with debounce
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setSaveStatus('unsaved');

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setSaveStatus('saving');
        updateScratchPad.mutate(
          { content: newContent, channelId: selectedChannelId },
          {
            onSuccess: () => setSaveStatus('saved'),
            onError: () => setSaveStatus('unsaved'),
          }
        );
      }, 500);
    },
    [selectedChannelId, updateScratchPad]
  );

  // NOTE: Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleConvert = async () => {
    if (!content.trim()) return;
    try {
      await convertToNote.mutateAsync(selectedChannelId);
      setContent('');
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to convert scratch pad:', error);
    }
  };

  // NOTE: Handle keyboard shortcuts within the panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-border bg-background shadow-lg transition-transform duration-200',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
      data-testid="scratch-pad-panel"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Scratch Pad</span>
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" />
                Saved
              </span>
            )}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Quick notes..."
          className="h-full w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          data-testid="scratch-pad-textarea"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button
          onClick={handleConvert}
          disabled={!content.trim() || convertToNote.isPending}
          size="sm"
          className="w-full"
          data-testid="scratch-pad-convert"
        >
          {convertToNote.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Convert to Note
        </Button>
      </div>
    </div>
  );
};

export default ScratchPadPanel;
