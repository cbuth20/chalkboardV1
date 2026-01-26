"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (!loading && !user && !didRedirectRef.current) {
      didRedirectRef.current = true;
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F12] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00F6E5] border-r-transparent mb-4"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F12] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00F6E5] border-r-transparent mb-4"></div>
          <p className="text-slate-400 text-sm">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
