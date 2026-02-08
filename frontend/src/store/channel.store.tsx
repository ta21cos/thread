import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ChannelUIState {
  selectedChannelId: string | null;
  isChannelDialogOpen: boolean;
  editingChannelId: string | null;
}

interface ChannelUIContextValue extends ChannelUIState {
  setSelectedChannelId: (id: string | null) => void;
  openChannelDialog: (channelId?: string) => void;
  closeChannelDialog: () => void;
}

const defaultState: ChannelUIState = {
  selectedChannelId: null,
  isChannelDialogOpen: false,
  editingChannelId: null,
};

const ChannelUIContext = createContext<ChannelUIContextValue | undefined>(undefined);

export const ChannelUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ChannelUIState>(defaultState);

  const setSelectedChannelId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedChannelId: id }));
  }, []);

  const openChannelDialog = useCallback((channelId?: string) => {
    setState((prev) => ({
      ...prev,
      isChannelDialogOpen: true,
      editingChannelId: channelId ?? null,
    }));
  }, []);

  const closeChannelDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isChannelDialogOpen: false,
      editingChannelId: null,
    }));
  }, []);

  return (
    <ChannelUIContext.Provider
      value={{
        ...state,
        setSelectedChannelId,
        openChannelDialog,
        closeChannelDialog,
      }}
    >
      {children}
    </ChannelUIContext.Provider>
  );
};

export const useChannelUI = (): ChannelUIContextValue => {
  const context = useContext(ChannelUIContext);
  if (!context) {
    throw new Error('useChannelUI must be used within a ChannelUIProvider');
  }
  return context;
};
