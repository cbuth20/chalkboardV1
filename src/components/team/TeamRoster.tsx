"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

type TeamRosterMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  jerseyNumber: number | null;
  primaryPosition: string | null;
  positions: string[];
  segmentId: string | null;
};

export function TeamRoster() {
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamRosterMember[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/team/members', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load team');
        }

        const next: TeamRosterMember[] = Array.isArray(json.data?.members) ? json.data.members : [];
        setMembers(next);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load team';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.access_token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      const positions = (m.positions || []).join(' ').toLowerCase();
      return (
        name.includes(q) ||
        (m.displayName || '').toLowerCase().includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        positions.includes(q)
      );
    });
  }, [members, search]);

  const roleLabel = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'coach') return 'Coach';
    return 'Player';
  };

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 holographic-grid">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <TeamIcon className="h-8 w-8 text-[#00F6E5]" />
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                Team
              </h1>
            </div>
            <p className="text-slate-400">
              Team roster, roles, and positions
            </p>
          </header>

          {(authLoading || loading) && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
                <p className="text-slate-400">Loading team…</p>
              </div>
            </div>
          )}

          {!authLoading && !loading && error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">Couldn’t load team</p>
                <p className="text-xs text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {!authLoading && !loading && !error && (
            <>
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, email, role, position…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1B1E20]/50 border border-[#1B1E20] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/50 focus:ring-2 focus:ring-[#00F6E5]/10"
                  />
                </div>

                <div className="text-sm text-slate-400">
                  {filtered.length} member{filtered.length !== 1 ? 's' : ''}{search.trim() ? ' found' : ''}
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1B1E20] bg-[#0A0A0A]/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Member
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Positions
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Jersey
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B1E20]/30">
                      {filtered.map((m) => (
                        <tr key={m.userId} className="hover:bg-[#1B1E20]/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {m.avatarUrl ? (
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-[#1B1E20] border border-white/10 flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.avatarUrl}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">
                                    {(m.firstName?.[0] || 'U')}{(m.lastName?.[0] || '')}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1B1E20] to-[#0A0A0A] text-xs font-bold text-slate-400 flex-shrink-0">
                                  {(m.firstName?.[0] || 'U')}{(m.lastName?.[0] || '')}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">
                                  {m.displayName || `${m.firstName} ${m.lastName}`.trim()}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {m.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                              m.role === 'admin'
                                ? 'bg-[#00F6E5]/10 border-[#00F6E5]/30 text-[#00F6E5]'
                                : m.role === 'coach'
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                : 'bg-slate-500/10 border-slate-500/30 text-slate-300'
                            }`}>
                              {roleLabel(m.role)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {m.positions?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {m.positions.map((p) => (
                                  <span
                                    key={`${m.userId}-${p}`}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                                      m.primaryPosition && p === m.primaryPosition
                                        ? 'bg-[#00F6E5]/10 border-[#00F6E5]/30 text-[#00F6E5]'
                                        : 'bg-[#1B1E20]/50 border-[#2A2F35] text-slate-300'
                                    }`}
                                    title={m.primaryPosition && p === m.primaryPosition ? 'Primary position' : undefined}
                                  >
                                    {p}
                                    {m.primaryPosition && p === m.primaryPosition && (
                                      <span className="text-[10px] font-bold text-[#00F6E5]">PRIMARY</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            {m.jerseyNumber != null && m.jerseyNumber !== 0 ? (
                              <span className="font-mono text-sm font-semibold text-white">
                                #{m.jerseyNumber}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filtered.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">No team members found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

