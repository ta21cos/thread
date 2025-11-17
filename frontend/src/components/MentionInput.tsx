import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../../../shared/types';

interface MentionInputProps {
  searchTerm: string;
  suggestions: Note[];
  onSelect: (noteId: string) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  loading?: boolean;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  searchTerm,
  suggestions,
  onSelect,
  onClose,
  position,
  loading = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // NOTE: Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // NOTE: Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;

        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex].id);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, suggestions, onSelect, onClose]);

  // NOTE: Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      if (itemRect.bottom > containerRect.bottom) {
        selectedItem.scrollIntoView({ block: 'end' });
      } else if (itemRect.top < containerRect.top) {
        selectedItem.scrollIntoView({ block: 'start' });
      }
    }
  }, [selectedIndex]);

  // NOTE: Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleItemClick = useCallback(
    (noteId: string) => {
      onSelect(noteId);
    },
    [onSelect]
  );

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;

    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={index} className="mention-input__highlight">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!position) return null;

  return (
    <div
      ref={containerRef}
      className="mention-input"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
    >
      <div className="mention-input__header">
        <span className="mention-input__title">Mention a note</span>
        {searchTerm && <span className="mention-input__search">Searching: "{searchTerm}"</span>}
      </div>

      {loading ? (
        <div className="mention-input__loading">
          <div className="spinner spinner--small" />
          <span>Searching notes...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="mention-input__list">
          {suggestions.map((note, index) => (
            <div
              key={note.id}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`mention-input__item ${
                index === selectedIndex ? 'mention-input__item--selected' : ''
              }`}
              onClick={() => handleItemClick(note.id)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="mention-input__item-id">#{highlightMatch(note.id, searchTerm)}</div>
              <div className="mention-input__item-content">
                {highlightMatch(truncateContent(note.content), searchTerm)}
              </div>
              <div className="mention-input__item-meta">
                {new Date(note.createdAt).toLocaleDateString()}
                {note.parentId && (
                  <span className="mention-input__item-reply">• Reply to #{note.parentId}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mention-input__empty">
          {searchTerm ? (
            <>
              <p>No notes found matching "{searchTerm}"</p>
              <p className="mention-input__hint">
                Try a different search term or create a new note
              </p>
            </>
          ) : (
            <>
              <p>Start typing to search for notes</p>
              <p className="mention-input__hint">Use arrow keys to navigate, Enter to select</p>
            </>
          )}
        </div>
      )}

      <div className="mention-input__footer">
        <span className="mention-input__shortcut">
          <kbd>↑↓</kbd> Navigate
        </span>
        <span className="mention-input__shortcut">
          <kbd>Enter</kbd> Select
        </span>
        <span className="mention-input__shortcut">
          <kbd>Esc</kbd> Close
        </span>
      </div>
    </div>
  );
};

export default MentionInput;
