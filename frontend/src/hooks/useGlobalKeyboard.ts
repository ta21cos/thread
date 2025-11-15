import { useEffect, useCallback, useRef } from 'react';
import { useFocusContext } from '@/contexts/FocusContext';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseGlobalKeyboardOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  disableWhenInputFocused?: boolean;
}

/**
 * Hook to register global keyboard shortcuts
 * Automatically disables when typing in input fields (unless specified)
 */
export const useGlobalKeyboard = ({
  shortcuts,
  enabled = true,
  disableWhenInputFocused = true,
}: UseGlobalKeyboardOptions) => {
  const shortcutsRef = useRef(shortcuts);
  const { getFocusedId } = useFocusContext();

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Skip if input is focused and shortcuts are disabled for inputs
      // Exception: Allow Escape key to work even in inputs
      if (disableWhenInputFocused && isInputFocused && event.key !== 'Escape') {
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current) {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break; // Only trigger first matching shortcut
        }
      }
    },
    [enabled, disableWhenInputFocused, getFocusedId]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Predefined common shortcuts
 */
export const createCommonShortcuts = (actions: {
  onNewNote?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onReply?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onNewNote) {
    shortcuts.push({
      key: 'n',
      handler: actions.onNewNote,
      description: 'New note',
    });
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: '/',
      handler: actions.onSearch,
      description: 'Search notes',
    });
  }

  if (actions.onEscape) {
    shortcuts.push({
      key: 'Escape',
      handler: actions.onEscape,
      description: 'Clear focus / Close modals',
      preventDefault: false, // Allow default behavior
    });
  }

  if (actions.onReply) {
    shortcuts.push({
      key: 'r',
      handler: actions.onReply,
      description: 'Reply to selected thread',
    });
  }

  return shortcuts;
};
