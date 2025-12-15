import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

const STORAGE_KEY = 'thread-settings';

interface SettingsState {
  showHiddenNotes: boolean;
}

interface SettingsContextValue extends SettingsState {
  toggleShowHiddenNotes: () => void;
  setShowHiddenNotes: (value: boolean) => void;
}

const defaultState: SettingsState = {
  showHiddenNotes: false,
};

const loadFromStorage = (): SettingsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
  return defaultState;
};

const saveToStorage = (state: SettingsState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SettingsState>(() => loadFromStorage());

  // NOTE: Persist to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const toggleShowHiddenNotes = useCallback(() => {
    setState((prev) => ({ ...prev, showHiddenNotes: !prev.showHiddenNotes }));
  }, []);

  const setShowHiddenNotes = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, showHiddenNotes: value }));
  }, []);

  const value: SettingsContextValue = {
    ...state,
    toggleShowHiddenNotes,
    setShowHiddenNotes,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }

  return context;
};
