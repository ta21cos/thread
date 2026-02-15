import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const modKey = isMac ? '⌘' : 'Ctrl';

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [{ keys: [modKey, 'K'], description: 'Open Command Palette' }],
  },
  {
    title: 'Note Editor',
    shortcuts: [
      { keys: [modKey, 'Enter'], description: 'Submit note / reply' },
      { keys: ['Esc'], description: 'Cancel editing' },
    ],
  },
  {
    title: 'Mention (@)',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate suggestions' },
      { keys: ['Enter'], description: 'Select suggestion' },
      { keys: ['Tab'], description: 'Select suggestion' },
      { keys: ['Esc'], description: 'Close suggestions' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['Enter'], description: 'Execute search' },
      { keys: ['Esc'], description: 'Clear search' },
    ],
  },
  {
    title: 'Panel Layout',
    shortcuts: [
      { keys: ['Alt', '←'], description: 'Shrink left panel' },
      { keys: ['Alt', '→'], description: 'Expand left panel' },
      { keys: ['Alt', '0'], description: 'Reset to 50/50' },
      { keys: ['Alt', '1'], description: 'Focus right panel (30/70)' },
      { keys: ['Alt', '2'], description: 'Focus left panel (70/30)' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: [modKey, '/'], description: 'Toggle Scratch Pad' },
      { keys: ['Esc'], description: 'Close dialog / sheet / scratch pad' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded border border-border bg-muted text-xs font-mono text-muted-foreground shadow-sm">
    {children}
  </kbd>
);

export const KeyboardShortcutsHelp: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const isInput =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        data-testid="keyboard-shortcuts-help-button"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg max-h-[80vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <DialogClose onClose={handleClose} />
          <DialogHeader>
            <DialogTitle>
              <span className="inline-flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{group.title}</h3>
                <div className="space-y-1.5">
                  {group.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent/50"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1 ml-4 shrink-0">
                        {shortcut.keys.map((key, j) => (
                          <React.Fragment key={j}>
                            {j > 0 && <span className="text-muted-foreground text-xs">+</span>}
                            <Kbd>{key}</Kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
