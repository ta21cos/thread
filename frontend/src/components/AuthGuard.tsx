import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

const isE2ETest = import.meta.env.VITE_E2E_TEST === 'true';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  // NOTE: In E2E test mode, skip Clerk auth and render children directly
  if (isE2ETest) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};
