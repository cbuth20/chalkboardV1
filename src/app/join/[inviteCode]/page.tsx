"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/supabase/types/database';
import { ALL_POSITIONS, groupPositionsByGroup } from '@/lib/positions';

function JoinContent() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.inviteCode as string;
  const { user, session, loading: authLoading } = useAuth();

  const [step, setStep] = useState<'profile' | 'team' | 'position' | 'complete'>('profile');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('player');

  // Org/Team data
  const [orgName, setOrgName] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // Position data
  const [positionCode, setPositionCode] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'offense' | 'defense' | 'special-teams'>('offense');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/join/${inviteCode}`);
    }
  }, [authLoading, user, router, inviteCode]);

  // Check onboarding status and auto-join if user exists
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session || !user) return;

      try {
        const response = await fetch('/api/onboarding/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          console.error('[Join] Failed to fetch onboarding status');
          setCheckingStatus(false);
          return;
        }

        const { success, data } = await response.json();

        if (success && data) {
          // If onboarding is completed and already a member of this org, redirect to dashboard
          if (data.onboardingState === 'completed' && data.membership?.orgId === inviteCode) {
            console.log('[Join] User is already a member of this organization, redirecting to dashboard');
            router.push('/');
            return;
          }

          // Pre-fill profile data if it exists
          if (data.profile) {
            setFirstName(data.profile.firstName || '');
            setLastName(data.profile.lastName || '');
            setRole(data.profile.role || 'player');

            // AUTO-JOIN: If user has a profile but no membership to THIS org, auto-join them
            if (data.membership?.orgId !== inviteCode) {
              console.log('[Join] User has profile but not member of this org, auto-joining...');

              try {
                const joinResponse = await fetch('/api/onboarding/join', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({ inviteCode })
                });

                const joinResult = await joinResponse.json();

                if (joinResponse.ok && joinResult.success) {
                  console.log('[Join] Auto-joined organization successfully');
                  setOrgName(joinResult.data.organization?.name || 'Organization');

                  // Fetch teams for this org
                  const teamsResponse = await fetch('/api/onboarding/teams', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                  });

                  if (teamsResponse.ok) {
                    const teamsResult = await teamsResponse.json();
                    if (teamsResult.success) {
                      setTeams(teamsResult.data.teams);
                    }
                  }

                  // Go directly to team selection
                  setStep('team');
                  setCheckingStatus(false);
                  return;
                } else {
                  console.error('[Join] Auto-join failed:', joinResult.error);
                  // Fall through to show profile form
                }
              } catch (err) {
                console.error('[Join] Auto-join error:', err);
                // Fall through to show profile form
              }
            }
          }

          // Determine which step to start on based on onboarding state
          if (data.onboardingState === 'pending_team') {
            // User already has profile and joined org, go to team selection
            console.log('[Join] User has profile, moving to team selection');

            // Fetch teams
            const teamsResponse = await fetch('/api/onboarding/teams', {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (teamsResponse.ok) {
              const teamsResult = await teamsResponse.json();
              if (teamsResult.success) {
                setTeams(teamsResult.data.teams);
                if (data.membership?.orgName) {
                  setOrgName(data.membership.orgName);
                }
              }
            }

            setStep('team');
          } else if (data.onboardingState === 'pending_position') {
            // User has profile, org, and team, go to position
            console.log('[Join] User has team, moving to position selection');
            setStep('position');
          }
        }
      } catch (error) {
        console.error('[Join] Error checking onboarding status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (user && session) {
      checkOnboardingStatus();
    }
  }, [user, session, router, inviteCode]);

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F14] holographic-grid">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00F6E5]/20 border-t-[#00F6E5] mx-auto mb-4"></div>
          <p className="text-slate-400">
            {authLoading ? 'Checking authentication...' : 'Checking onboarding status...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Handle profile submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create/update profile (only if name fields are filled)
      if (firstName && lastName) {
        const response = await fetch('/api/onboarding/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ firstName, lastName, role })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to update profile');
        }
      }

      // Join organization with invite code
      const joinResponse = await fetch('/api/onboarding/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ inviteCode })
      });

      const joinResult = await joinResponse.json();
      if (!joinResponse.ok || !joinResult.success) {
        throw new Error(joinResult.error || 'Failed to join organization');
      }

      // Fetch available teams
      const teamsResponse = await fetch('/api/onboarding/teams', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const teamsResult = await teamsResponse.json();
      if (teamsResponse.ok && teamsResult.success) {
        setTeams(teamsResult.data.teams);
        setOrgName(joinResult.data.organization?.name || 'Organization');
      }

      setStep('team');
    } catch (err: any) {
      console.error('[Join] Profile error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle team selection
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ teamId: selectedTeamId })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to select team');
      }

      // If player, go to position selection. If coach, complete.
      if (role === 'player') {
        setStep('position');
      } else {
        setStep('complete');
      }
    } catch (err: any) {
      console.error('[Join] Team error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle position submission
  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          positionCode,
          jerseyNumber: parseInt(jerseyNumber, 10)
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to set position');
      }

      setStep('complete');
    } catch (err: any) {
      console.error('[Join] Position error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupedPositions = groupPositionsByGroup(selectedCategory);

  return (
    <div className="min-h-screen bg-[#0A0F14] holographic-grid py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Profile', 'Team', role === 'player' ? 'Position' : 'Complete'].filter(Boolean).map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    (step === 'profile' && idx === 0) ||
                    (step === 'team' && idx === 1) ||
                    (step === 'position' && idx === 2) ||
                    (step === 'complete' && idx >= (role === 'player' ? 2 : 1))
                      ? 'bg-[#00F6E5] text-black shadow-[0_0_15px_rgba(0,246,229,0.5)]'
                      : 'bg-[#1B1E20] text-slate-500 border border-[#2A2F35]'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs mt-2 ${
                    (step === 'profile' && idx === 0) ||
                    (step === 'team' && idx === 1) ||
                    (step === 'position' && idx === 2) ||
                    (step === 'complete' && idx >= (role === 'player' ? 2 : 1))
                      ? 'text-[#00F6E5] font-medium'
                      : 'text-slate-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {idx < (role === 'player' ? 2 : 1) && (
                  <div className={`h-1 flex-1 mx-2 rounded ${
                    (step === 'team' && idx === 0) ||
                    (step === 'position' && idx <= 1) ||
                    (step === 'complete')
                      ? 'bg-[#00F6E5]'
                      : 'bg-[#1B1E20]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Current step */}
        <div className="glass-card p-8">
          {step === 'profile' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Join {orgName || 'Organization'}</h2>
              <p className="text-slate-400 mb-8">
                {firstName && lastName
                  ? 'Confirm your details and select your role'
                  : "Let's set up your profile"}
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">I am a...</label>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      role === 'player' ? 'border-[#00F6E5] bg-[#00F6E5]/10' : 'border-[#2A2F35] bg-[#1B1E20] hover:border-[#00F6E5]/50'
                    }`}>
                      <input
                        type="radio"
                        value="player"
                        checked={role === 'player'}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-4 h-4 text-[#00F6E5]"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-white">Player</div>
                        <div className="text-sm text-slate-400">I'm here to learn plays</div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      role === 'coach' ? 'border-[#00F6E5] bg-[#00F6E5]/10' : 'border-[#2A2F35] bg-[#1B1E20] hover:border-[#00F6E5]/50'
                    }`}>
                      <input
                        type="radio"
                        value="coach"
                        checked={role === 'coach'}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-4 h-4 text-[#00F6E5]"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-white">Coach</div>
                        <div className="text-sm text-slate-400">I'm here to manage the team</div>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00F6E5] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#3DF3FF] disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                >
                  {loading ? 'Continuing...' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {step === 'team' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Select Your Team</h2>
              <p className="text-slate-400 mb-8">Choose which team you'll be joining</p>

              <form onSubmit={handleTeamSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                  >
                    <option value="">Select a team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.season ? `(${team.season})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedTeamId}
                  className="w-full bg-[#00F6E5] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#3DF3FF] disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                >
                  {loading ? 'Joining...' : 'Join Team'}
                </button>
              </form>
            </div>
          )}

          {step === 'position' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Set Your Position</h2>
              <p className="text-slate-400 mb-8">Select your position and jersey number</p>

              <form onSubmit={handlePositionSubmit} className="space-y-6">
                {/* Category Tabs */}
                <div className="flex gap-2 border-b border-[#2A2F35]">
                  {(['offense', 'defense', 'special-teams'] as const).map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${
                        selectedCategory === category
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] border-b-2 border-[#00F6E5]'
                          : 'text-slate-400 hover:text-white hover:bg-[#1B1E20]/50'
                      }`}
                    >
                      {category === 'offense' ? 'Offense' : category === 'defense' ? 'Defense' : 'Special Teams'}
                    </button>
                  ))}
                </div>

                {/* Position Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Select Position</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {Object.entries(groupedPositions).map(([groupName, positions]) => (
                      positions.map((pos) => (
                        <button
                          key={pos.code}
                          type="button"
                          onClick={() => setPositionCode(pos.code)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            positionCode === pos.code
                              ? 'border-[#00F6E5] bg-[#00F6E5]/10'
                              : 'border-[#2A2F35] bg-[#1B1E20] hover:border-[#00F6E5]/50'
                          }`}
                        >
                          <div className={`text-xl font-black mb-1 ${positionCode === pos.code ? 'text-[#00F6E5]' : 'text-white'}`}>
                            {pos.code}
                          </div>
                          <div className={`text-xs ${positionCode === pos.code ? 'text-[#00F6E5]' : 'text-slate-400'}`}>
                            {pos.name}
                          </div>
                        </button>
                      ))
                    ))}
                  </div>
                </div>

                {/* Jersey Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Jersey Number</label>
                  <input
                    type="number"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    required
                    min="0"
                    max="99"
                    className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
                    placeholder="12"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !positionCode}
                  className="w-full bg-[#00F6E5] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#3DF3FF] disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              </form>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
                <CheckIcon className="w-10 h-10 text-[#00F6E5]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to the Team!</h2>
              <p className="text-slate-400 mb-8">You're all set. Let's get to work.</p>
              <button
                onClick={() => router.push('/')}
                className="bg-[#00F6E5] text-black py-3 px-8 rounded-lg font-semibold hover:bg-[#3DF3FF] transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0F12] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
