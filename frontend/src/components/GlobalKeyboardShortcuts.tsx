import { useEffect } from 'react';
import { useFocusContext } from '@/contexts/FocusContext';
import { useGlobalKeyboard, createCommonShortcuts } from '@/hooks/useGlobalKeyboard';

/**
 * Global keyboard shortcuts component
 * Manages app-wide keyboard shortcuts without rendering any UI
 */
export const GlobalKeyboardShortcuts = () => {
  const { focusInput, clearFocus } = useFocusContext();

  const shortcuts = createCommonShortcuts({
    // 'n' - Focus main note editor
    onNewNote: () => {
      focusInput('note-editor');
    },

    // '/' - Focus search bar
    onSearch: () => {
      focusInput('search-bar');
    },

    // 'Escape' - Clear focus / close modals
    onEscape: () => {
      clearFocus();
    },

    // 'r' - Focus reply editor in thread view
    onReply: () => {
      focusInput('thread-reply-editor');
    },
  });

  useGlobalKeyboard({
    shortcuts,
    enabled: true,
    disableWhenInputFocused: true,
  });

  // Add keyboard shortcut hints to document
  useEffect(() => {
    // This could be used to show a keyboard shortcuts help modal
    // For now, we'll just log that shortcuts are active
    console.log('Global keyboard shortcuts active:', {
      'n': 'New note',
      '/': 'Search',
      'Escape': 'Clear focus',
      'r': 'Reply to thread',
    });
  }, []);

  // This component doesn't render anything
  return null;
};
