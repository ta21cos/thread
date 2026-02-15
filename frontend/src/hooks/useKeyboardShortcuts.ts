import { useEffect, useRef } from 'react';

export interface Shortcut {
  key: string;
  handler: () => void;
  description: string;
}

const isMac =
  typeof navigator !== 'undefined' &&
  ('userAgentData' in navigator
    ? (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform === 'macOS'
    : navigator.platform.includes('Mac'));

const parseShortcut = (key: string) => {
  const parts = key.toLowerCase().split('+');
  return {
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts[parts.length - 1],
  };
};

const matchesShortcut = (e: KeyboardEvent, shortcutKey: string): boolean => {
  const parsed = parseShortcut(shortcutKey);
  const modPressed = isMac ? e.metaKey : e.ctrlKey;

  if (parsed.mod && !modPressed) return false;
  if (!parsed.mod && modPressed) return false;
  if (parsed.shift && !e.shiftKey) return false;
  if (!parsed.shift && e.shiftKey) return false;
  if (parsed.alt && !e.altKey) return false;

  return e.key.toLowerCase() === parsed.key;
};

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;

      const { tagName, isContentEditable } = e.target;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(e, shortcut.key)) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
