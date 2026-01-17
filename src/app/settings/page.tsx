"use client";

import React, { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { SkillPosition } from '@/lib/supabase/types/database';

const POSITION_INFO: Record<SkillPosition, { name: string; description: string; group: string }> = {
  QB: { name: 'Quarterback', description: 'Signal caller and field general', group: 'Skill' },
  RB: { name: 'Running Back', description: 'Primary ball carrier', group: 'Skill' },
  FB: { name: 'Fullback', description: 'Lead blocker and short yardage back', group: 'Skill' },
  X: { name: 'X Receiver', description: 'Split end (left outside)', group: 'Skill' },
  Z: { name: 'Z Receiver', description: 'Flanker (right outside)', group: 'Skill' },
  H: { name: 'H Receiver', description: 'Slot receiver', group: 'Skill' },
  Y: { name: 'Y Receiver', description: 'Tight end/Y receiver', group: 'Skill' },
  TE: { name: 'Tight End', description: 'Inline blocker and receiver', group: 'Skill' },
  LT: { name: 'Left Tackle', description: 'Blind side protector', group: 'O-Line' },
  LG: { name: 'Left Guard', description: 'Interior pass protector', group: 'O-Line' },
  C: { name: 'Center', description: 'Snap and line calls', group: 'O-Line' },
  RG: { name: 'Right Guard', description: 'Interior pass protector', group: 'O-Line' },
  RT: { name: 'Right Tackle', description: 'Edge protector', group: 'O-Line' },
};

export default function SettingsPage() {
  const { userPositions, updateUserPositions, loading: authLoading } = useAuth();
  const [selectedPositions, setSelectedPositions] = useState<SkillPosition[]>(userPositions);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update selected positions when userPositions changes (from auth context)
  React.useEffect(() => {
    setSelectedPositions(userPositions);
  }, [userPositions]);

  const hasChanges = JSON.stringify([...selectedPositions].sort()) !== JSON.stringify([...userPositions].sort());

  const togglePosition = (position: SkillPosition) => {
    setSelectedPositions(prev => {
      if (prev.includes(position)) {
        // Remove position
        return prev.filter(p => p !== position);
      } else {
        // Add position
        return [...prev, position];
      }
    });
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateUserPositions(selectedPositions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to update positions:', error);
      setSaveError(error.message || 'Failed to save positions. Please try again.');
    } finally {
      setIsSaving(false);
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

  // Group positions
  const skillPositions = Object.entries(POSITION_INFO).filter(([_, info]) => info.group === 'Skill');
  const oLinePositions = Object.entries(POSITION_INFO).filter(([_, info]) => info.group === 'O-Line');

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8 holographic-grid">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-[#00F6E5]" />
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              Settings
            </h1>
          </div>
          <p className="text-slate-400">
            Configure your profile and position
          </p>
        </header>

        {/* Position Selection Section */}
        <section className="glass-card p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Your Positions</h2>
            <p className="text-sm text-slate-400">
              Select all positions you play. Click multiple positions to select them. This determines which assignments and content you'll see.
            </p>
          </div>

          {/* Current Positions Display */}
          {userPositions.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-[#00F6E5]/5 border border-[#00F6E5]/20">
              <p className="text-sm font-medium text-slate-400 mb-3">Current Positions</p>
              <div className="flex flex-wrap gap-2">
                {userPositions.map(pos => (
                  <div key={pos} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00F6E5]/10 border border-[#00F6E5]/30">
                    <span className="text-sm font-bold text-[#00F6E5]">{pos}</span>
                    <span className="text-xs text-slate-300">{POSITION_INFO[pos].name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Positions */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Skill Positions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {skillPositions.map(([code, info]) => {
                const isSelected = selectedPositions.includes(code as SkillPosition);
                return (
                  <button
                    key={code}
                    onClick={() => togglePosition(code as SkillPosition)}
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
                        {code}
                      </div>
                      <div className={`text-xs font-semibold mb-1 ${isSelected ? 'text-[#00F6E5]' : 'text-slate-300'}`}>
                        {info.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {info.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* O-Line Positions */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Offensive Line
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {oLinePositions.map(([code, info]) => {
                const isSelected = selectedPositions.includes(code as SkillPosition);
                return (
                  <button
                    key={code}
                    onClick={() => togglePosition(code as SkillPosition)}
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
                        {code}
                      </div>
                      <div className={`text-xs font-semibold mb-1 ${isSelected ? 'text-[#00F6E5]' : 'text-slate-300'}`}>
                        {info.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {info.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button & Feedback */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                hasChanges && !isSaving
                  ? 'bg-[#00F6E5] text-black hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]'
                  : 'bg-[#1B1E20] text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>

            {saveSuccess && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Position saved successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertIcon className="h-5 w-5" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}
          </div>
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
