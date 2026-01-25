"use client";

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const { profile, membership, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Invite form state
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [inviteRole, setInviteRole] = useState<'coach' | 'player'>('player');
  const [inviting, setInviting] = useState(false);
  const [inviteProgress, setInviteProgress] = useState({ current: 0, total: 0 });
  const [inviteResults, setInviteResults] = useState<Array<{ email: string; success: boolean; error?: string }>>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      console.log('[Admin] Not authorized, redirecting');
      router.push('/');
    }
  }, [authLoading, profile, router]);

  // Load existing invite code
  useEffect(() => {
    if (membership?.orgId) {
      // For now, use org ID as invite code (we'll enhance this later)
      setInviteCode(membership.orgId);
    }
  }, [membership]);

  const copyInviteCode = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const regenerateInviteCode = async () => {
    if (!confirm('Are you sure you want to regenerate the invite code? The old code will stop working.')) {
      return;
    }

    setGenerating(true);
    // TODO: Implement invite code regeneration API
    setTimeout(() => {
      setGenerating(false);
      alert('Invite code regeneration coming soon!');
    }, 1000);
  };

  const isValidEmail = (email: string) => {
    return email.includes('@') && email.includes('.') && email.length > 5;
  };

  const addEmailTag = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      alert(`Invalid email address: ${trimmed}`);
      return;
    }

    if (emailTags.includes(trimmed)) {
      alert(`Email already added: ${trimmed}`);
      return;
    }

    setEmailTags([...emailTags, trimmed]);
    setEmailInput('');
  };

  const removeEmailTag = (index: number) => {
    setEmailTags(emailTags.filter((_, i) => i !== index));
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === ',' || e.key === ';' || e.key === 'Enter') {
      e.preventDefault();
      addEmailTag(emailInput);
    } else if (e.key === 'Backspace' && !emailInput && emailTags.length > 0) {
      // Remove last tag on backspace if input is empty
      setEmailTags(emailTags.slice(0, -1));
    }
  };

  const handleEmailInputBlur = () => {
    if (emailInput.trim()) {
      addEmailTag(emailInput);
    }
  };

  const handleEmailInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Split by common separators
    const emails = pastedText
      .split(/[\s,;]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const validEmails = emails.filter(email => {
      if (!isValidEmail(email)) {
        console.warn(`Skipping invalid email: ${email}`);
        return false;
      }
      if (emailTags.includes(email)) {
        console.warn(`Skipping duplicate email: ${email}`);
        return false;
      }
      return true;
    });

    if (validEmails.length > 0) {
      setEmailTags([...emailTags, ...validEmails]);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteCode) return;

    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add current input to tags if there's any
    if (emailInput.trim()) {
      addEmailTag(emailInput);
      return; // Let the user see the tag added first
    }

    if (emailTags.length === 0) {
      alert('Please enter at least one email address');
      return;
    }

    if (!session) {
      alert('No active session. Please refresh and try again.');
      return;
    }

    const emailList = emailTags;

    setInviting(true);
    setInviteResults([]);
    setInviteProgress({ current: 0, total: emailList.length });

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    // Send invites sequentially to avoid rate limits
    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i];
      setInviteProgress({ current: i + 1, total: emailList.length });
      try {
        const response = await fetch('/api/admin/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email,
            role: inviteRole
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          results.push({
            email,
            success: false,
            error: result.error || 'Failed to send invite'
          });
        } else {
          results.push({ email, success: true });
        }
      } catch (error: any) {
        console.error(`Failed to send invite to ${email}:`, error);
        results.push({
          email,
          success: false,
          error: error.message || 'Network error'
        });
      }
    }

    setInviteResults(results);
    setInviteProgress({ current: 0, total: 0 });

    // Clear form if all succeeded
    const allSucceeded = results.every(r => r.success);
    if (allSucceeded) {
      setEmailTags([]);
      setEmailInput('');
    }

    setInviting(false);
  };

  if (authLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8 holographic-grid">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AdminIcon className="h-8 w-8 text-[#00F6E5]" />
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              Admin Settings
            </h1>
          </div>
          <p className="text-slate-400">
            Manage your organization and invite codes
          </p>
        </header>

        {/* Organization Info */}
        <section className="glass-card p-6 lg:p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Organization</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Organization Name</p>
              <p className="text-lg text-white font-semibold">{membership?.orgName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Your Role</p>
              <p className="text-lg text-white font-semibold capitalize">{profile.role}</p>
            </div>
          </div>
        </section>

        {/* Send Invite Section */}
        <section className="glass-card p-6 lg:p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Send Invitations</h2>
          <p className="text-sm text-slate-400 mb-6">
            Invite coaches and players by email. They'll receive a link to join your organization.
          </p>

          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="emails" className="block text-sm font-medium text-slate-300">
                  Email Addresses
                </label>
                {emailTags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setEmailTags([])}
                    className="text-xs text-slate-400 hover:text-[#00F6E5] transition"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="w-full min-h-[120px] px-3 py-2 bg-[#1B1E20] border border-[#2A2F35] rounded-lg focus-within:border-[#00F6E5] transition">
                {/* Email Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {emailTags.map((email, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00F6E5]/10 border border-[#00F6E5]/30 rounded-full text-sm text-[#00F6E5] group hover:bg-[#00F6E5]/20 transition"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeEmailTag(index)}
                        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#00F6E5]/30 transition"
                        aria-label={`Remove ${email}`}
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Email Input */}
                <input
                  id="emails"
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailInputKeyDown}
                  onBlur={handleEmailInputBlur}
                  onPaste={handleEmailInputPaste}
                  placeholder={emailTags.length === 0 ? "Type email and press Space, Enter, or Comma to add..." : "Add another email..."}
                  className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                  disabled={inviting}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">
                  Press Space, Enter, or Comma after each email • Paste multiple emails at once
                </p>
                {emailTags.length > 0 && (
                  <span className="text-xs font-medium text-[#00F6E5]">
                    {emailTags.length} {emailTags.length === 1 ? 'email' : 'emails'} added
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Role
              </label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="player"
                    checked={inviteRole === 'player'}
                    onChange={(e) => setInviteRole(e.target.value as 'player')}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition ${
                    inviteRole === 'player'
                      ? 'border-[#00F6E5] bg-[#00F6E5]/10'
                      : 'border-[#2A2F35] hover:border-[#00F6E5]/30'
                  }`}>
                    <div className="font-semibold text-white mb-1">Player</div>
                    <div className="text-xs text-slate-400">Limited view, focused on learning plays</div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="coach"
                    checked={inviteRole === 'coach'}
                    onChange={(e) => setInviteRole(e.target.value as 'coach')}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition ${
                    inviteRole === 'coach'
                      ? 'border-[#00F6E5] bg-[#00F6E5]/10'
                      : 'border-[#2A2F35] hover:border-[#00F6E5]/30'
                  }`}>
                    <div className="font-semibold text-white mb-1">Coach</div>
                    <div className="text-xs text-slate-400">Full access to team management features</div>
                  </div>
                </label>
              </div>
            </div>

            {inviting && inviteProgress.total > 0 && (
              <div className="p-4 bg-[#1B1E20] border border-[#2A2F35] rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#00F6E5]/20 border-t-[#00F6E5]"></div>
                  <p className="text-sm text-slate-300">
                    Sending invitation {inviteProgress.current} of {inviteProgress.total}...
                  </p>
                </div>
                <div className="w-full bg-[#0A0F14] rounded-full h-2">
                  <div
                    className="bg-[#00F6E5] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(inviteProgress.current / inviteProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {inviteResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-slate-300">
                    Results ({inviteResults.filter(r => r.success).length}/{inviteResults.length} sent successfully)
                  </div>
                  <button
                    type="button"
                    onClick={() => setInviteResults([])}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {inviteResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {result.success ? (
                          <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                            {result.email}
                          </p>
                          {result.error && (
                            <p className="text-xs text-red-400 mt-1">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={inviting || emailTags.length === 0}
              className="w-full px-6 py-3 bg-[#00F6E5] text-black rounded-lg font-semibold hover:bg-[#3DF3FF] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,246,229,0.3)]"
            >
              {inviting
                ? `Sending ${inviteProgress.current}/${inviteProgress.total}...`
                : emailTags.length === 0
                ? 'Add Emails to Send Invitations'
                : `Send ${emailTags.length} Invitation${emailTags.length === 1 ? '' : 's'}`}
            </button>
          </form>
        </section>

        {/* Invite Codes Section */}
        <section className="glass-card p-6 lg:p-8">
          <h2 className="text-xl font-bold text-white mb-2">Invite Code (Alternative)</h2>
          <p className="text-sm text-slate-400 mb-6">
            Or share this code manually with coaches and players
          </p>

          {/* Organization Invite Code */}
          <div className="space-y-6">
            <div className="p-5 bg-[#1B1E20] border border-[#2A2F35] rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Organization Invite Code</h3>
                  <p className="text-xs text-slate-400">Anyone with this code can join your organization</p>
                </div>
                <button
                  onClick={regenerateInviteCode}
                  disabled={generating}
                  className="text-xs text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Regenerate'}
                </button>
              </div>

              {/* Invite Code Display */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-[#0A0F14] border border-[#2A2F35] rounded-lg p-4">
                  <code className="text-[#00F6E5] text-lg font-mono font-semibold break-all">
                    {inviteCode || 'No code available'}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={copyInviteCode}
                  disabled={!inviteCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00F6E5] text-black rounded-lg font-semibold hover:bg-[#3DF3FF] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                >
                  <CopyIcon className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={copyInviteLink}
                  disabled={!inviteCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B1E20] border border-[#2A2F35] text-white rounded-lg font-semibold hover:border-[#00F6E5]/50 hover:bg-[#1B1E20]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy Link
                </button>
              </div>

              {/* Invite Link Preview */}
              {inviteCode && (
                <div className="mt-4 pt-4 border-t border-[#2A2F35]">
                  <p className="text-xs text-slate-500 mb-2">Share this link:</p>
                  <p className="text-xs text-slate-400 font-mono break-all">
                    {typeof window !== 'undefined' && `${window.location.origin}/join/${inviteCode}`}
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex gap-3">
                <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-white mb-1">How to use invite codes:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Copy the invite code or link above</li>
                    <li>Share it with coaches or players via email, text, or messaging app</li>
                    <li>They'll use it to join your organization at <span className="text-[#00F6E5]">/join/[code]</span></li>
                    <li>After joining, they can select their team and position</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SidebarLayout>
  );
}

// Icons
function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
