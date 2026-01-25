"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { status, loading, error, updateProfile, createOrganization, createTeam, resetOnboarding } = useOnboarding();
  const [resetting, setResetting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Onboarding] No user found, redirecting to login');
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F14] holographic-grid">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00F6E5]/20 border-t-[#00F6E5] mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F14] holographic-grid">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00F6E5]/20 border-t-[#00F6E5] mx-auto mb-4"></div>
          <p className="text-slate-400">Loading onboarding status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F14] holographic-grid">
        <div className="text-center">
          <p className="text-red-400">Failed to load onboarding status</p>
          {error && <p className="text-sm text-slate-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your onboarding? This will delete your organization memberships.')) {
      return;
    }
    setResetting(true);
    try {
      await resetOnboarding();
    } catch (error) {
      console.error('Failed to reset:', error);
    } finally {
      setResetting(false);
    }
  };

  // Render the appropriate step based on onboarding state
  const renderStep = () => {
    switch (status.onboardingState) {
      case 'completed':
        return <CompletedStep orgName={status.membership?.orgName} />;

      case 'new':
      case 'profile_incomplete':
        return <ProfileStep onSubmit={updateProfile} />;

      case 'pending_org':
        return <OrganizationStep onSubmit={createOrganization} />;

      case 'pending_team':
        return <TeamStep onSubmit={createTeam} orgName={status.membership?.orgName} />;

      default:
        return <div className="text-slate-400">Unknown onboarding state: {status.onboardingState}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F14] holographic-grid py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <OnboardingProgress currentState={status.onboardingState} />
        </div>

        {/* Testing: Reset button (only show in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-semibold">Development Mode</p>
                <p className="text-slate-400 text-xs mt-1">Current state: {status.onboardingState}</p>
              </div>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Current step */}
        <div className="glass-card p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

// Progress indicator component
function OnboardingProgress({ currentState }: { currentState: string }) {
  const steps = [
    { key: 'profile', label: 'Profile', states: ['new', 'profile_incomplete'] },
    { key: 'org', label: 'Organization', states: ['pending_org'] },
    { key: 'team', label: 'Team', states: ['pending_team'] },
  ];

  const currentIndex = steps.findIndex(step => step.states.includes(currentState));
  const effectiveIndex = currentState === 'completed' ? steps.length : currentIndex;

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                index < effectiveIndex
                  ? 'bg-[#00F6E5] text-black shadow-[0_0_15px_rgba(0,246,229,0.5)]'
                  : index === effectiveIndex
                  ? 'bg-[#00F6E5] text-black shadow-[0_0_15px_rgba(0,246,229,0.5)]'
                  : 'bg-[#1B1E20] text-slate-500 border border-[#2A2F35]'
              }`}
            >
              {index < effectiveIndex ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-xs mt-2 ${index <= effectiveIndex ? 'text-[#00F6E5] font-medium' : 'text-slate-500'}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-1 flex-1 mx-2 rounded ${index < effectiveIndex ? 'bg-[#00F6E5]' : 'bg-[#1B1E20]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1: Profile Setup (Admin only - automatically sets role to admin)
function ProfileStep({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Automatically set role to 'admin' for this workflow
      await onSubmit({ firstName, lastName, role: 'admin' });
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">
        Welcome to Chalkboard!
      </h2>
      <p className="text-slate-400 mb-8">
        Let's set up your organization. You'll be the admin.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
            placeholder="John"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
            placeholder="Doe"
          />
        </div>

        <div className="p-4 bg-[#00F6E5]/10 border border-[#00F6E5]/30 rounded-lg">
          <div className="flex items-center gap-3">
            <AdminIcon className="w-5 h-5 text-[#00F6E5]" />
            <div>
              <p className="text-sm font-semibold text-white">You'll be set up as an Admin</p>
              <p className="text-xs text-slate-400 mt-1">Full access to manage your organization</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#00F6E5] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#3DF3FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)]"
        >
          {submitting ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

// Step 2: Organization Setup
function OrganizationStep({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) {
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name: orgName });
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Create Your Organization</h2>
      <p className="text-slate-400 mb-8">
        This is typically your school or club name.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-slate-300 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
            placeholder="Central High School Football"
          />
          <p className="mt-2 text-sm text-slate-500">
            Examples: "Central High School Football", "West Valley Youth Soccer"
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#00F6E5] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#3DF3FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)]"
        >
          {submitting ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  );
}

// Step 3: Team Setup
function TeamStep({ onSubmit, orgName }: { onSubmit: (data: any) => Promise<void>; orgName?: string }) {
  const [teamName, setTeamName] = useState('');
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: teamName,
        season,
        segments: []
      });
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Create Your Team</h2>
      <p className="text-slate-400 mb-8">
        Set up your first team for {orgName || 'your organization'}.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-slate-300 mb-2">
            Team Name
          </label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
            placeholder="Varsity, JV, Freshman, etc."
          />
          <p className="mt-2 text-sm text-slate-500">
            You can create additional teams later
          </p>
        </div>

        <div>
          <label htmlFor="season" className="block text-sm font-medium text-slate-300 mb-2">
            Season
          </label>
          <input
            type="text"
            id="season"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
            placeholder="2024, 2024-2025, Fall 2024, etc."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#00F6E5] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#3DF3FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)]"
        >
          {submitting ? 'Creating Team...' : 'Create Team'}
        </button>
      </form>
    </div>
  );
}

// Completed Step
function CompletedStep({ orgName }: { orgName?: string }) {
  const router = useRouter();

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
        <CheckIcon className="w-10 h-10 text-[#00F6E5]" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">All Set!</h2>
      <p className="text-slate-400 mb-8">
        {orgName || 'Your organization'} is ready to go. Invite your coaches and players to get started.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => router.push('/admin/settings')}
          className="bg-[#00F6E5] text-black py-3 px-8 rounded-lg font-semibold hover:bg-[#3DF3FF] transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
        >
          Get Invite Codes
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-[#1B1E20] border border-[#2A2F35] text-white py-3 px-8 rounded-lg font-semibold hover:border-[#00F6E5]/50 transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// Icon components
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
