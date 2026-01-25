"use client";

import React, { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { SkillPosition } from '@/lib/supabase/types/database';
import { ALL_POSITIONS, groupPositionsByGroup, CATEGORY_LABELS, type PositionCategory } from '@/lib/positions';

function positionsEqual(a: SkillPosition[], b: SkillPosition[]) {
  if (a.length !== b.length) return false;
  const as = [...a].sort();
  const bs = [...b].sort();
  return as.every((v, i) => v === bs[i]);
}

export default function SettingsPage() {
  const { session, loading: authLoading, refreshUserData } = useAuth();

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [savedPositions, setSavedPositions] = useState<SkillPosition[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<SkillPosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  const [isSavingPositions, setIsSavingPositions] = useState(false);
  const [positionsSaveSuccess, setPositionsSaveSuccess] = useState(false);
  const [positionsSaveError, setPositionsSaveError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<PositionCategory>('offense');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!session?.access_token) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const res = await fetch('/api/account/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load profile');
        }

        setFirstName(json.data?.firstName || '');
        setLastName(json.data?.lastName || '');
        setDisplayName(json.data?.displayName || '');
        setEmail(json.data?.email || '');
        setAvatarUrl(json.data?.avatarUrl || null);
      } catch (e: any) {
        console.error('[Settings] Failed to load profile:', e);
        setProfileSaveError(e.message || 'Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const load = async () => {
      if (!session?.access_token) {
        setIsLoadingPositions(false);
        return;
      }

      try {
        setIsLoadingPositions(true);
        const res = await fetch('/api/account/positions', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load positions');
        }
        const positions: SkillPosition[] = Array.isArray(json.data?.positions) ? json.data.positions : [];
        setSavedPositions(positions);
        setSelectedPositions(positions);
      } catch (e: any) {
        console.error('[Settings] Failed to load positions:', e);
        setPositionsSaveError(e.message || 'Failed to load positions');
      } finally {
        setIsLoadingPositions(false);
      }
    };

    loadProfile();
    load();
  }, [session?.access_token]);

  const hasPositionChanges = useMemo(
    () => !positionsEqual(savedPositions, selectedPositions),
    [savedPositions, selectedPositions]
  );

  const togglePosition = (position: SkillPosition) => {
    setSelectedPositions((prev) => {
      if (prev.includes(position)) return prev.filter((p) => p !== position);
      return [...prev, position];
    });
  };

  const handleSavePositions = async () => {
    if (!session?.access_token) return;
    if (!hasPositionChanges) return;

    setIsSavingPositions(true);
    setPositionsSaveError(null);
    setPositionsSaveSuccess(false);

    try {
      const res = await fetch('/api/account/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ positions: selectedPositions }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save positions');
      }

      const positions: SkillPosition[] = Array.isArray(json.data?.positions) ? json.data.positions : [];
      setSavedPositions(positions);
      setSelectedPositions(positions);
      setPositionsSaveSuccess(true);
      setTimeout(() => setPositionsSaveSuccess(false), 3000);

      // Keep AuthContext in sync for other pages
      await refreshUserData();
    } catch (error: any) {
      console.error('[Settings] Failed to update positions:', error);
      setPositionsSaveError(error.message || 'Failed to save positions. Please try again.');
    } finally {
      setIsSavingPositions(false);
    }
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

  // Get positions grouped by sub-group for the selected category
  const groupedPositions = groupPositionsByGroup(selectedCategory);

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8 holographic-grid">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-[#00F6E5]" />
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              Account Settings
            </h1>
          </div>
          <p className="text-slate-400">
            Update your positions and account security
          </p>
        </header>

        {/* Profile Section */}
        <section className="glass-card p-6 lg:p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Profile</h2>
            <p className="text-sm text-slate-400">
              Update your name and avatar.
            </p>
          </div>

          {isLoadingProfile ? (
            <div className="flex items-center gap-3 text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00F6E5]/20 border-t-[#00F6E5]" />
              <span className="text-sm">Loading profile…</span>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!session?.access_token) return;

                setIsSavingProfile(true);
                setProfileSaveError(null);
                setProfileSaveSuccess(false);
                try {
                  const res = await fetch('/api/account/profile', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      firstName,
                      lastName,
                      displayName,
                    }),
                  });
                  const json = await res.json();
                  if (!res.ok || !json.success) {
                    throw new Error(json.error || 'Failed to save profile');
                  }
                  setProfileSaveSuccess(true);
                  setTimeout(() => setProfileSaveSuccess(false), 3000);
                  await refreshUserData();
                } catch (err: any) {
                  setProfileSaveError(err.message || 'Failed to save profile');
                } finally {
                  setIsSavingProfile(false);
                }
              }}
              className="space-y-4"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div>
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-[#1B1E20] border border-white/10">
                    {(avatarPreviewUrl || avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreviewUrl || avatarUrl || ''}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-300">
                        {email ? email.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white text-sm font-semibold hover:border-[#00F6E5]/50 hover:bg-[#1B1E20]/80 transition cursor-pointer">
                      <UploadIcon className="h-4 w-4" />
                      <span>{isUploadingAvatar ? 'Uploading…' : 'Upload avatar'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={isUploadingAvatar}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !session?.access_token) return;

                          setProfileSaveError(null);
                          setProfileSaveSuccess(false);

                          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                            setProfileSaveError('Please upload a PNG, JPG, or WebP image');
                            return;
                          }
                          if (file.size > 2 * 1024 * 1024) {
                            setProfileSaveError('Avatar must be <= 2MB');
                            return;
                          }

                          // Preview
                          const preview = URL.createObjectURL(file);
                          setAvatarPreviewUrl(preview);

                          try {
                            setIsUploadingAvatar(true);
                            const arrayBuffer = await file.arrayBuffer();
                            const bytes = new Uint8Array(arrayBuffer);
                            let binary = '';
                            for (let i = 0; i < bytes.length; i++) {
                              binary += String.fromCharCode(bytes[i]);
                            }
                            const dataBase64 = btoa(binary);

                            const res = await fetch('/api/account/avatar', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${session.access_token}`,
                              },
                              body: JSON.stringify({
                                fileName: file.name,
                                contentType: file.type,
                                dataBase64,
                              }),
                            });
                            const json = await res.json();
                            if (!res.ok || !json.success) {
                              throw new Error(json.error || 'Failed to upload avatar');
                            }

                            setAvatarUrl(json.data?.avatarUrl || null);
                            setAvatarPreviewUrl(null);
                            setProfileSaveSuccess(true);
                            setTimeout(() => setProfileSaveSuccess(false), 3000);
                            await refreshUserData();
                          } catch (err: any) {
                            setProfileSaveError(err.message || 'Failed to upload avatar');
                          } finally {
                            setIsUploadingAvatar(false);
                          }
                        }}
                      />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      PNG/JPG/WebP • max 2MB • recommended square image
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1B1E20] border border-[#2A2F35] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5] transition"
                      placeholder="Connor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1B1E20] border border-[#2A2F35] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5] transition"
                      placeholder="Buth"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Display name</label>
                    <input
                      value={displayName || ''}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1B1E20] border border-[#2A2F35] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5] transition"
                      placeholder="Coach Connor"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      This is what teammates will see.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                    !isSavingProfile
                      ? 'bg-[#00F6E5] text-black hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]'
                      : 'bg-[#1B1E20] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isSavingProfile ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </button>

                {profileSaveSuccess && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">Saved!</span>
                  </div>
                )}

                {profileSaveError && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertIcon className="h-5 w-5" />
                    <span className="text-sm">{profileSaveError}</span>
                  </div>
                )}
              </div>
            </form>
          )}
        </section>

        {/* Position Selection Section */}
        <section className="glass-card p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Your Position</h2>
            <p className="text-sm text-slate-400">
              Select one or more positions. This determines which assignments and content you'll see.
            </p>
          </div>

          {/* Current Positions Display */}
          {savedPositions.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-[#00F6E5]/5 border border-[#00F6E5]/20">
              <p className="text-sm font-medium text-slate-400 mb-3">Current Positions</p>
              <div className="flex flex-wrap gap-2">
                {savedPositions.map((pos) => (
                  <div
                    key={pos}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00F6E5]/10 border border-[#00F6E5]/30"
                  >
                    <span className="text-sm font-bold text-[#00F6E5]">{pos}</span>
                    <span className="text-xs text-slate-300">{ALL_POSITIONS[pos]?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoadingPositions && (
            <div className="mb-6 flex items-center gap-3 text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00F6E5]/20 border-t-[#00F6E5]" />
              <span className="text-sm">Loading positions…</span>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b border-[#1B1E20] pb-2">
            {(['offense', 'defense', 'special-teams'] as PositionCategory[]).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-[#00F6E5]/10 text-[#00F6E5] border-b-2 border-[#00F6E5]'
                    : 'text-slate-400 hover:text-white hover:bg-[#1B1E20]/50'
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>

          {/* Position Groups */}
          {Object.entries(groupedPositions).map(([groupName, positions]) => (
            <div key={groupName} className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {groupName}
              </h3>
              <div className={`grid grid-cols-2 gap-3 ${
                positions.length > 4 ? 'md:grid-cols-4' : `md:grid-cols-${Math.min(positions.length, 5)}`
              }`}>
                {positions.map((posInfo) => {
                  const isSelected = selectedPositions.includes(posInfo.code);
                  return (
                    <button
                      key={posInfo.code}
                      onClick={() => togglePosition(posInfo.code)}
                      className={`group relative p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'bg-[#00F6E5]/10 border-[#00F6E5] ring-2 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 border-[#1B1E20] hover:border-[#00F6E5]/50 hover:bg-[#1B1E20]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckIcon className="h-5 w-5 text-[#00F6E5]" />
                        </div>
                      )}
                      <div className="text-center">
                        <div className={`text-2xl font-black mb-2 ${isSelected ? 'text-[#00F6E5]' : 'text-white'}`}>
                          {posInfo.code}
                        </div>
                        <div className={`text-xs font-semibold mb-1 ${isSelected ? 'text-[#00F6E5]' : 'text-slate-300'}`}>
                          {posInfo.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {posInfo.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Save Button & Feedback */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handleSavePositions}
              disabled={!hasPositionChanges || isSavingPositions || isLoadingPositions}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                hasPositionChanges && !isSavingPositions && !isLoadingPositions
                  ? 'bg-[#00F6E5] text-black hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]'
                  : 'bg-[#1B1E20] text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSavingPositions ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  Save Positions
                </>
              )}
            </button>

            {positionsSaveSuccess && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Positions saved successfully!</span>
              </div>
            )}

            {positionsSaveError && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertIcon className="h-5 w-5" />
                <span className="text-sm">{positionsSaveError}</span>
              </div>
            )}
          </div>
        </section>

        {/* Password Section */}
        <section className="glass-card p-6 lg:p-8 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Change Password</h2>
            <p className="text-sm text-slate-400">
              Set a new password for your account.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!session?.access_token) return;

              setPasswordError(null);
              setPasswordSuccess(false);

              if (newPassword.trim().length < 8) {
                setPasswordError('Password must be at least 8 characters');
                return;
              }
              if (newPassword !== confirmPassword) {
                setPasswordError('Passwords do not match');
                return;
              }

              setIsChangingPassword(true);
              try {
                const res = await fetch('/api/account/password', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({ newPassword }),
                });
                const json = await res.json();
                if (!res.ok || !json.success) {
                  throw new Error(json.error || 'Failed to change password');
                }

                setPasswordSuccess(true);
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setPasswordSuccess(false), 3000);
              } catch (err: any) {
                setPasswordError(err.message || 'Failed to change password');
              } finally {
                setIsChangingPassword(false);
              }
            }}
            className="space-y-4 max-w-lg"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#1B1E20] border border-[#2A2F35] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5] transition"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#1B1E20] border border-[#2A2F35] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5] transition"
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                  !isChangingPassword && newPassword && confirmPassword
                    ? 'bg-[#00F6E5] text-black hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]'
                    : 'bg-[#1B1E20] text-slate-600 cursor-not-allowed'
                }`}
              >
                {isChangingPassword ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <LockIcon className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold">Password updated!</span>
                </div>
              )}

              {passwordError && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertIcon className="h-5 w-5" />
                  <span className="text-sm">{passwordError}</span>
                </div>
              )}
            </div>
          </form>
        </section>
      </main>
    </SidebarLayout>
  );
}

// Icons
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m-9-9h6m6 0h6" />
      <path d="M20.49 7.5A9 9 0 0 1 12 21" />
      <path d="M3.51 16.5A9 9 0 0 1 12 3" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
