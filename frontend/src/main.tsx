import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './styles/globals.css';
import { ThemeProvider } from './components/theme-provider';

const isE2ETest = import.meta.env.VITE_E2E_TEST === 'true';
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!isE2ETest && !PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// NOTE: In E2E test mode, skip ClerkProvider to avoid Clerk auth
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isE2ETest) {
    return <>{children}</>;
  }
  return <ClerkProvider publishableKey={PUBLISHABLE_KEY!}>{children}</ClerkProvider>;
};

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AuthWrapper>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </AuthWrapper>
  </React.StrictMode>
);
