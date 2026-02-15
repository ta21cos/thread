import { UserButton as ClerkUserButton } from '@clerk/clerk-react';

const isE2ETest = import.meta.env.VITE_E2E_TEST === 'true';

export const UserButton = () => {
  // NOTE: In E2E test mode, render a placeholder instead of Clerk UserButton
  if (isE2ETest) {
    return <div className="w-8 h-8 rounded-full bg-muted" data-testid="user-button-stub" />;
  }

  return (
    <ClerkUserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8',
        },
      }}
    />
  );
};
