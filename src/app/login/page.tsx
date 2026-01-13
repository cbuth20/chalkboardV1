"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      router.push('/playbook');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F12] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F12] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Chalkboard</h1>
          <p className="text-slate-400">Sign in to access your playbook</p>
        </div>

        <div className="bg-[#151a1e] rounded-2xl p-8 border border-white/10">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#00F6E5',
                    brandAccent: '#00d4c5',
                    brandButtonText: 'black',
                    defaultButtonBackground: '#1B1E20',
                    defaultButtonBackgroundHover: '#252829',
                    defaultButtonBorder: 'rgba(255, 255, 255, 0.1)',
                    defaultButtonText: 'white',
                    dividerBackground: 'rgba(255, 255, 255, 0.1)',
                    inputBackground: '#0A0F12',
                    inputBorder: 'rgba(255, 255, 255, 0.1)',
                    inputBorderHover: '#00F6E5',
                    inputBorderFocus: '#00F6E5',
                    inputText: 'white',
                    inputLabelText: '#94a3b8',
                    inputPlaceholder: '#64748b',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}
          />
        </div>
      </div>
    </div>
  );
}
