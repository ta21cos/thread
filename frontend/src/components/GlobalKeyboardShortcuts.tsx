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

  // NOTE: Keyboard shortcuts are registered via useGlobalKeyboard hook
  // Future enhancement: Add a help modal to display available shortcuts

  // This component doesn't render anything
  return null;
};
