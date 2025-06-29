'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { SuspenseWrapper } from '@/components/suspense/SuspenseWrapper';
import {
  DashboardLoadingFallback,
  AuthLoadingFallback,
} from '@/components/suspense/LoadingFallbacks';
import { ProgressiveDashboard } from '@/components/dashboard/ProgressiveDashboard';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <AuthLoadingFallback />;
  }

  if (!user) {
    return null;
  }

  return (
    <SuspenseWrapper
      fallback={<DashboardLoadingFallback />}
      onError={(error) => console.error('Dashboard error:', error)}
    >
      <ProgressiveDashboard />
    </SuspenseWrapper>
  );
}
