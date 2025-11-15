import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

export interface FocusableElement {
  id: string;
  ref: React.RefObject<HTMLElement>;
  priority?: number; // Higher priority = focus first
}

interface FocusContextType {
  registerInput: (id: string, ref: React.RefObject<HTMLElement>, priority?: number) => void;
  unregisterInput: (id: string) => void;
  focusInput: (id: string) => void;
  getFocusedId: () => string | null;
  setFocusedId: (id: string | null) => void;
  restoreLastFocus: () => void;
  clearFocus: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const useFocusContext = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocusContext must be used within FocusProvider');
  }
  return context;
};

interface FocusProviderProps {
  children: ReactNode;
}

export const FocusProvider: React.FC<FocusProviderProps> = ({ children }) => {
  const inputsRef = useRef<Map<string, FocusableElement>>(new Map());
  const currentFocusRef = useRef<string | null>(null);
  const lastFocusRef = useRef<string | null>(null);

  const registerInput = useCallback((id: string, ref: React.RefObject<HTMLElement>, priority = 0) => {
    inputsRef.current.set(id, { id, ref, priority });
  }, []);

  const unregisterInput = useCallback((id: string) => {
    inputsRef.current.delete(id);
    if (currentFocusRef.current === id) {
      currentFocusRef.current = null;
    }
  }, []);

  const focusInput = useCallback((id: string) => {
    const element = inputsRef.current.get(id);
    if (element?.ref.current) {
      element.ref.current.focus();
      lastFocusRef.current = currentFocusRef.current;
      currentFocusRef.current = id;
    }
  }, []);

  const getFocusedId = useCallback(() => {
    return currentFocusRef.current;
  }, []);

  const setFocusedId = useCallback((id: string | null) => {
    if (id !== null) {
      lastFocusRef.current = currentFocusRef.current;
    }
    currentFocusRef.current = id;
  }, []);

  const restoreLastFocus = useCallback(() => {
    if (lastFocusRef.current) {
      focusInput(lastFocusRef.current);
    }
  }, [focusInput]);

  const clearFocus = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    currentFocusRef.current = null;
  }, []);

  const value: FocusContextType = {
    registerInput,
    unregisterInput,
    focusInput,
    getFocusedId,
    setFocusedId,
    restoreLastFocus,
    clearFocus,
  };

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
};
