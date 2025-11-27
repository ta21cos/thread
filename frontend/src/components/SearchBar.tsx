import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusManager } from '@/hooks/useFocusManager';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  initialValue?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  focusId?: string; // Unique ID for focus management
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search notes...',
  debounceMs = 300,
  initialValue = '',
  onClear,
  autoFocus = false,
  focusId = 'search-bar',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Register with focus manager
  useFocusManager({
    id: focusId,
    ref: inputRef,
    autoFocus,
    priority: 8, // High priority for search
  });

  // NOTE: Debounced search implementation
  const performSearch = useCallback(
    (searchQuery: string) => {
      setIsSearching(true);
      onSearch(searchQuery);

      // NOTE: Reset searching state after a brief delay
      setTimeout(() => setIsSearching(false), 200);
    },
    [onSearch]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);

      // NOTE: Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // NOTE: Set new debounced search
      if (newQuery.trim()) {
        debounceTimerRef.current = setTimeout(() => {
          performSearch(newQuery);
        }, debounceMs);
      } else {
        // NOTE: Immediate search for empty query (to show all notes)
        performSearch('');
      }
    },
    [debounceMs, performSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    performSearch('');

    if (onClear) {
      onClear();
    }

    // NOTE: Focus input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onClear, performSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // NOTE: Clear search on Escape
      if (e.key === 'Escape') {
        handleClear();
      }

      // NOTE: Immediate search on Enter
      if (e.key === 'Enter') {
        e.preventDefault();

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        performSearch(query);
      }
    },
    [query, handleClear, performSearch]
  );

  // NOTE: Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasQuery = query.length > 0;

  return (
    <div className="search-bar">
      <div className="search-bar__container">
        <div className="search-bar__icon-wrapper">
          <svg
            className="search-bar__icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-bar__input"
          aria-label="Search notes"
          spellCheck="false"
          autoComplete="off"
        />

        {isSearching && (
          <div className="search-bar__spinner-wrapper">
            <div className="spinner spinner--small" />
          </div>
        )}

        {hasQuery && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="search-bar__clear"
            aria-label="Clear search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="search-bar__hints">
        {hasQuery ? (
          <span className="search-bar__hint">
            Press <kbd>Enter</kbd> to search immediately • <kbd>Esc</kbd> to clear
          </span>
        ) : (
          <span className="search-bar__hint">
            Search by content or mention (@ID) • Results update as you type
          </span>
        )}
      </div>

      {hasQuery && (
        <div className="search-bar__status">
          Searching for: <strong>{query}</strong>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
