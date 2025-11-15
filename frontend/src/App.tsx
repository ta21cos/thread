import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotesUIProvider } from './store/notes.store';
import { AppRouter } from './router';
import { AuthGuard } from './components/AuthGuard';
import { useUserSync } from './hooks/useUserSync';
import { FocusProvider } from './contexts/FocusContext';
import { GlobalKeyboardShortcuts } from './components/GlobalKeyboardShortcuts';

// NOTE: Configure TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  // NOTE: Auto-sync user on sign-in
  useUserSync();

  return (
    <QueryClientProvider client={queryClient}>
      <FocusProvider>
        <NotesUIProvider>
          <AuthGuard>
            <GlobalKeyboardShortcuts />
            <AppRouter />
          </AuthGuard>
        </NotesUIProvider>
      </FocusProvider>
    </QueryClientProvider>
  );
};

export default App;
