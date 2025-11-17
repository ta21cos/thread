import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// NOTE: UI state interface (not server state - that's handled by TanStack Query)
interface NotesUIState {
  selectedNoteId: string | null;
  isSearchOpen: boolean;
  searchQuery: string;
  isEditing: boolean;
  editingNoteId: string | null;
  replyingToNoteId: string | null;
}

interface NotesUIContextValue extends NotesUIState {
  setSelectedNoteId: (id: string | null) => void;
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  startEditing: (noteId: string) => void;
  stopEditing: () => void;
  startReply: (noteId: string) => void;
  stopReply: () => void;
  reset: () => void;
}

// NOTE: Default state values
const defaultState: NotesUIState = {
  selectedNoteId: null,
  isSearchOpen: false,
  searchQuery: '',
  isEditing: false,
  editingNoteId: null,
  replyingToNoteId: null,
};

const NotesUIContext = createContext<NotesUIContextValue | undefined>(undefined);

// NOTE: Provider component
export const NotesUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotesUIState>(defaultState);

  const setSelectedNoteId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedNoteId: id }));
  }, []);

  const toggleSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSearchOpen: !prev.isSearchOpen,
      searchQuery: prev.isSearchOpen ? '' : prev.searchQuery,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
      isSearchOpen: query.length > 0, // NOTE: Auto-open search when typing
    }));
  }, []);

  const startEditing = useCallback((noteId: string) => {
    setState((prev) => ({
      ...prev,
      isEditing: true,
      editingNoteId: noteId,
      replyingToNoteId: null,
    }));
  }, []);

  const stopEditing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditing: false,
      editingNoteId: null,
    }));
  }, []);

  const startReply = useCallback((noteId: string) => {
    setState((prev) => ({
      ...prev,
      replyingToNoteId: noteId,
      isEditing: false,
      editingNoteId: null,
    }));
  }, []);

  const stopReply = useCallback(() => {
    setState((prev) => ({
      ...prev,
      replyingToNoteId: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value: NotesUIContextValue = {
    ...state,
    setSelectedNoteId,
    toggleSearch,
    setSearchQuery,
    startEditing,
    stopEditing,
    startReply,
    stopReply,
    reset,
  };

  return <NotesUIContext.Provider value={value}>{children}</NotesUIContext.Provider>;
};

// NOTE: Hook to use UI state
export const useNotesUI = (): NotesUIContextValue => {
  const context = useContext(NotesUIContext);

  if (!context) {
    throw new Error('useNotesUI must be used within NotesUIProvider');
  }

  return context;
};
