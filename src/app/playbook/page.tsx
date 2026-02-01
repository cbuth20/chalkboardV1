"use client";

import React, { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePlays } from '@/hooks/usePlaysAPI';
import { Play, Unit } from '@/lib/api/plays';

export default function PlayerPlaybookPage() {
  const { orgId, loading: authLoading } = useAuth();
  // Players only see approved & published plays (API filters automatically)
  const { plays, loading, error, refetch } = usePlays({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<Unit, boolean>>({
    O: true,
    D: true,
    ST: true,
  });

  // Organize plays by unit
  const organizedPlays = useMemo(() => {
    const organized: Record<Unit, Play[]> = {
      O: [],
      D: [],
      ST: [],
    };

    plays.forEach((play) => {
      const unit = play.unit || 'O';
      organized[unit].push(play);
    });

    // Sort plays within each unit by name
    Object.keys(organized).forEach((unit) => {
      organized[unit as Unit].sort((a, b) => a.name.localeCompare(b.name));
    });

    return organized;
  }, [plays]);

  // Get unique sections for filtering
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    plays.forEach((play) => {
      if (play.playbookSection) {
        sections.add(play.playbookSection);
      }
    });
    return Array.from(sections).sort();
  }, [plays]);

  // Filter plays
  const filteredPlays = useMemo(() => {
    return plays.filter(play => {
      const matchesSearch =
        play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.concept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.formationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.playbookSection?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUnit = selectedUnit === 'all' || play.unit === selectedUnit;
      const matchesSection = selectedSection === 'all' || play.playbookSection === selectedSection;

      return matchesSearch && matchesUnit && matchesSection;
    });
  }, [plays, searchQuery, selectedUnit, selectedSection]);

  // Stats by unit
  const stats = useMemo(() => {
    return {
      total: plays.length,
      offense: plays.filter(p => p.unit === 'O').length,
      defense: plays.filter(p => p.unit === 'D').length,
      specialTeams: plays.filter(p => p.unit === 'ST').length,
    };
  }, [plays]);

  const toggleUnit = (unit: Unit) => {
    setExpandedUnits(prev => ({ ...prev, [unit]: !prev[unit] }));
  };

  const handleRowClick = (playId: string) => {
    setExpandedPlayId(expandedPlayId === playId ? null : playId);
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading playbook...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!orgId) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Issue</h2>
            <p className="text-slate-400 mb-4">
              No organization found. Please sign in or check your browser console for errors.
            </p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Playbook</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00F6E5]/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const filteredIds = new Set(filteredPlays.map(p => p.id));

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                Team Playbook
              </h1>
              <p className="text-slate-400">
                Approved plays for your team
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{stats.total}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Plays</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-blue-400">{stats.offense}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Offense</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-red-400">{stats.defense}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Defense</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-yellow-400">{stats.specialTeams}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Special Teams</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <input
              type="text"
              placeholder="Search plays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white placeholder-slate-500 focus:border-[#00F6E5] focus:outline-none"
            />

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as Unit | 'all')}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Units</option>
              <option value="O">Offense</option>
              <option value="D">Defense</option>
              <option value="ST">Special Teams</option>
            </select>

            {availableSections.length > 0 && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
              >
                <option value="all">All Sections</option>
                {availableSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* Content */}
        {filteredPlays.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-slate-400 mb-2">No plays found</div>
            <p className="text-sm text-slate-500">
              {searchQuery || selectedUnit !== 'all' || selectedSection !== 'all'
                ? 'Try adjusting your filters'
                : 'Your coach hasn\'t published any plays yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['O', 'D', 'ST'] as Unit[]).map((unit) => {
              const unitPlays = organizedPlays[unit].filter(play => filteredIds.has(play.id));

              if (unitPlays.length === 0) return null;

              const unitConfig = {
                O: { label: 'Offense', color: 'blue-400', bgColor: 'blue-900/20', icon: '⚡' },
                D: { label: 'Defense', color: 'red-400', bgColor: 'red-900/20', icon: '🛡️' },
                ST: { label: 'Special Teams', color: 'yellow-400', bgColor: 'yellow-900/20', icon: '⭐' },
              };

              const config = unitConfig[unit];

              return (
                <div key={unit} className="glass-card overflow-hidden">
                  <button
                    onClick={() => toggleUnit(unit)}
                    className="w-full px-6 py-4 bg-[#1B1E20] hover:bg-[#2A2E30] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <h2 className={`text-2xl font-black text-${config.color}`}>
                        {config.label}
                      </h2>
                      <span className="text-slate-400 text-sm font-semibold">
                        ({unitPlays.length} plays)
                      </span>
                    </div>
                    <span className="text-slate-400 text-xl">
                      {expandedUnits[unit] ? '▼' : '▶'}
                    </span>
                  </button>

                  {expandedUnits[unit] && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1B1E20] bg-[#0D1117]">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Play Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Section
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Classification
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Formation
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Concept
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Type
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {unitPlays.map((play) => (
                            <React.Fragment key={play.id}>
                              <tr
                                onClick={() => handleRowClick(play.id)}
                                className={`border-b border-[#1B1E20]/50 transition-colors cursor-pointer ${
                                  expandedPlayId === play.id ? 'bg-[#00F6E5]/5' : 'hover:bg-[#1B1E20]/30'
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{play.name}</div>
                                  {play.shortName && (
                                    <div className="text-xs text-slate-500">{play.shortName}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.playbookSection || '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.primaryClassification || '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.formationName || '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.concept || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                    play.playType === 'PASS' ? 'bg-blue-900/20 text-blue-400' :
                                    play.playType === 'RUN' ? 'bg-green-900/20 text-green-400' :
                                    play.playType === 'RPO' ? 'bg-purple-900/20 text-purple-400' :
                                    'bg-slate-700/20 text-slate-400'
                                  }`}>
                                    {play.playType}
                                  </span>
                                </td>
                              </tr>

                              {/* Expanded Row - Play Details (Read Only) */}
                              {expandedPlayId === play.id && (
                                <tr className="bg-[#0D1117] border-b border-[#1B1E20]">
                                  <td colSpan={6} className="px-6 py-6">
                                    <PlayDetailsView play={play} />
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}

// Read-Only Play Details View Component
function PlayDetailsView({ play }: { play: Play }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{play.name}</h3>
          {play.shortName && (
            <p className="text-slate-400 text-sm mb-1">Short Name: {play.shortName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-green-900/20 text-green-400 text-xs font-semibold border border-green-500/30">
            ✓ Approved
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailField label="Play Type" value={play.playType} />
        <DetailField label="Formation" value={play.formationName} />
        <DetailField label="Concept" value={play.concept} />
        <DetailField label="Unit" value={play.unit} />
        <DetailField label="Section" value={play.playbookSection} />
        <DetailField label="Classification" value={play.primaryClassification} />
        <DetailField label="Situation" value={play.situation} />
      </div>

      {play.aiInsights && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Coach-Approved Insights</h4>
              <p className="text-xs text-slate-500">AI-generated and reviewed by your coach</p>
            </div>
          </div>
          <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
            {play.aiInsights}
          </div>
        </div>
      )}

      {!play.aiInsights && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-slate-500">No coach insights available for this play yet</p>
        </div>
      )}
    </div>
  );
}

// Detail Field Component
function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="glass-card p-3">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-white font-semibold">{value || '-'}</div>
    </div>
  );
}
