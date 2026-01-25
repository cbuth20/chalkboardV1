"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/SidebarLayout";

export default function DebugAuthPage() {
  const auth = useAuth();

  return (
    <SidebarLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Auth Debug Info</h1>

        <div className="space-y-6">
          {/* Loading State */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Loading State</h2>
            <p className="text-slate-300">
              Loading: <span className="text-[#00F6E5] font-mono">{String(auth.loading)}</span>
            </p>
          </section>

          {/* User */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">User (Supabase Auth)</h2>
            <pre className="bg-[#0A0F14] p-4 rounded text-xs text-slate-300 overflow-auto">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </section>

          {/* Profile */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Profile (from users table)</h2>
            {auth.profile ? (
              <div className="space-y-2">
                <p className="text-slate-300">
                  ID: <span className="text-[#00F6E5] font-mono">{auth.profile.id}</span>
                </p>
                <p className="text-slate-300">
                  Name: <span className="text-[#00F6E5]">{auth.profile.firstName} {auth.profile.lastName}</span>
                </p>
                <p className="text-slate-300">
                  Email: <span className="text-[#00F6E5]">{auth.profile.email}</span>
                </p>
                <p className="text-slate-300">
                  Role: <span className={`font-bold ${auth.profile.role === 'admin' ? 'text-green-400' : 'text-[#00F6E5]'}`}>
                    {auth.profile.role}
                  </span>
                </p>
                <p className="text-slate-300">
                  Onboarding State: <span className="text-[#00F6E5]">{auth.profile.onboardingState}</span>
                </p>
              </div>
            ) : (
              <p className="text-red-400">No profile data</p>
            )}
          </section>

          {/* Membership */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Membership (from org_memberships table)</h2>
            {auth.membership ? (
              <div className="space-y-2">
                <p className="text-slate-300">
                  ID: <span className="text-[#00F6E5] font-mono">{auth.membership.id}</span>
                </p>
                <p className="text-slate-300">
                  Org ID: <span className="text-[#00F6E5] font-mono">{auth.membership.orgId}</span>
                </p>
                <p className="text-slate-300">
                  Org Name: <span className="text-[#00F6E5]">{auth.membership.orgName || 'N/A'}</span>
                </p>
                <p className="text-slate-300">
                  Team ID: <span className="text-[#00F6E5] font-mono">{auth.membership.teamId || 'N/A'}</span>
                </p>
                <p className="text-slate-300">
                  Team Name: <span className="text-[#00F6E5]">{auth.membership.teamName || 'N/A'}</span>
                </p>
                <p className="text-slate-300">
                  Role: <span className={`font-bold ${auth.membership.role === 'admin' ? 'text-green-400' : 'text-[#00F6E5]'}`}>
                    {auth.membership.role}
                  </span>
                </p>
                <p className="text-slate-300">
                  Position: <span className="text-[#00F6E5]">{auth.membership.positionCode || 'N/A'}</span>
                </p>
              </div>
            ) : (
              <p className="text-red-400">No membership data</p>
            )}
          </section>

          {/* Admin Check */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Admin Check</h2>
            <div className="space-y-2">
              <p className="text-slate-300">
                profile?.role === 'admin': <span className={auth.profile?.role === 'admin' ? 'text-green-400' : 'text-red-400'}>
                  {String(auth.profile?.role === 'admin')}
                </span>
              </p>
              <p className="text-slate-300">
                membership?.role === 'admin': <span className={auth.membership?.role === 'admin' ? 'text-green-400' : 'text-red-400'}>
                  {String(auth.membership?.role === 'admin')}
                </span>
              </p>
              <p className="text-slate-300 text-lg font-bold mt-4">
                Is Admin (Combined): <span className={
                  (auth.profile?.role === 'admin' || auth.membership?.role === 'admin')
                    ? 'text-green-400'
                    : 'text-red-400'
                }>
                  {String(auth.profile?.role === 'admin' || auth.membership?.role === 'admin')}
                </span>
              </p>
            </div>
          </section>

          {/* Backwards Compat */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Backwards Compatibility Values</h2>
            <div className="space-y-2">
              <p className="text-slate-300">
                userRole: <span className="text-[#00F6E5]">{auth.userRole || 'null'}</span>
              </p>
              <p className="text-slate-300">
                teamId: <span className="text-[#00F6E5]">{auth.teamId || 'null'}</span>
              </p>
              <p className="text-slate-300">
                orgId: <span className="text-[#00F6E5]">{auth.orgId || 'null'}</span>
              </p>
              <p className="text-slate-300">
                positionCode: <span className="text-[#00F6E5]">{auth.positionCode || 'null'}</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
