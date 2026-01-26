"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * OnboardingGuard - Redirects users to /onboarding if they haven't completed it
 *
 * Usage: Wrap protected pages/routes with this component
 *
 * Example:
 * <OnboardingGuard>
 *   <YourProtectedContent />
 * </OnboardingGuard>
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { status, loading } = useOnboarding();

  useEffect(() => {
    // Don't redirect if:
    // - Still loading
    // - Not logged in
    // - Already on onboarding page
    // - Already on login page
    if (loading || !user || pathname === '/onboarding' || pathname === '/login' || pathname === '/auth/callback') {
      return;
    }

    // Redirect to onboarding if not completed
    if (status?.onboardingState && status.onboardingState !== 'completed') {
      console.log('[OnboardingGuard] User not onboarded, redirecting to /onboarding');
      router.push('/onboarding');
    }
  }, [status, loading, user, pathname, router]);

  // Show nothing while checking (or show a loading spinner)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F12] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00F6E5] border-r-transparent mb-4"></div>
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
