import React from 'react';
import type { PlayMode, SideOfBall } from '../types';
import { OFFENSIVE_FORMATIONS, DEFENSIVE_FORMATIONS, LOS_OPTIONS } from '../utils';

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface FormationBarProps {
  // Current values
  sideOfBall: SideOfBall;
  selectedFormationId: string;
  offensiveFormation: string;
  defensiveFormation: string;
  playMode: PlayMode;
  structuredPlayType: string;
  lineOfScrimmage: number;

  // Data sources
  formations: Array<{ id: string; name: string; sideOfBall: SideOfBall }>;
  hasStructuredData: boolean;
  viewOnly: boolean;

  // Handlers
  onSideOfBallChange: (side: SideOfBall) => void;
  onFormationChange: (formationId: string) => void;
  onOffensiveFormationChange: (formation: string) => void;
  onDefensiveFormationChange: (formation: string) => void;
  onPlayModeChange: (mode: PlayMode) => void;
  onStructuredPlayTypeChange: (type: string) => void;
  onLineOfScrimmageChange: (y: number) => void;
}

const FormationBarComponent: React.FC<FormationBarProps> = ({
  sideOfBall,
  selectedFormationId,
  offensiveFormation,
  defensiveFormation,
  playMode,
  structuredPlayType,
  lineOfScrimmage,
  formations,
  hasStructuredData,
  viewOnly,
  onSideOfBallChange,
  onFormationChange,
  onOffensiveFormationChange,
  onDefensiveFormationChange,
  onPlayModeChange,
  onStructuredPlayTypeChange,
  onLineOfScrimmageChange,
}) => {

  return (
    <div className="border-b border-[#1B1E20] bg-[#0A0A0A] px-6 py-4 flex-shrink-0">
      <div className="flex items-center gap-6">
        {/* Side of Ball Toggle - Only show if structured data is provided */}
        {hasStructuredData && !viewOnly && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Side of Ball
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onSideOfBallChange('offense')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  sideOfBall === 'offense'
                    ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                    : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                }`}
              >
                Offense
              </button>
              <button
                onClick={() => onSideOfBallChange('defense')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  sideOfBall === 'defense'
                    ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                    : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                }`}
              >
                Defense
              </button>
            </div>
          </div>
        )}

        {/* Formation Selector */}
        {hasStructuredData ? (
          // Use database formations if provided
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {sideOfBall === 'offense' ? 'Offensive' : 'Defensive'} Formation
            </label>
            <select
              value={selectedFormationId}
              onChange={(e) => {
                console.log('📋 FormationBar: Structured formation dropdown changed to:', e.target.value);
                console.log('📋 Calling onFormationChange handler');
                onFormationChange(e.target.value);
              }}
              disabled={viewOnly}
              className="w-full max-w-xs rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select Formation</option>
              {formations
                .filter(f => f.sideOfBall === sideOfBall)
                .map(formation => (
                  <option key={formation.id} value={formation.id}>
                    {formation.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          // Fall back to hardcoded formations if no structured data
          <>
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Offensive Formation
              </label>
              <select
                value={offensiveFormation}
                onChange={(e) => {
                  console.log('📋 FormationBar: Offensive formation dropdown changed to:', e.target.value);
                  onOffensiveFormationChange(e.target.value);
                }}
                disabled={viewOnly}
                className="w-full max-w-xs rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
              >
                {Object.keys(OFFENSIVE_FORMATIONS).map(formation => (
                  <option key={formation} value={formation}>
                    {formation}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Defensive Formation
              </label>
              <select
                value={defensiveFormation}
                onChange={(e) => {
                  console.log('📋 FormationBar: Defensive formation dropdown changed to:', e.target.value);
                  onDefensiveFormationChange(e.target.value);
                }}
                disabled={viewOnly}
                className="w-full max-w-xs rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
              >
                {Object.keys(DEFENSIVE_FORMATIONS).map(formation => (
                  <option key={formation} value={formation}>
                    {formation}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Line of Scrimmage Selector */}
        {!viewOnly && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Line of Scrimmage
            </label>
            <select
              value={lineOfScrimmage}
              onChange={(e) => onLineOfScrimmageChange(Number(e.target.value))}
              disabled={viewOnly}
              className="w-full max-w-xs rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
            >
              {LOS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Play Mode Buttons */}
        {!viewOnly && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Play Type
            </label>
            {hasStructuredData ? (
              // Contextual play types based on side of ball
              <div className="flex gap-2">
                {sideOfBall === 'offense' ? (
                  <>
                    <button
                      onClick={() => {
                        onPlayModeChange('pass');
                        onStructuredPlayTypeChange('pass');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        playMode === 'pass'
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => {
                        onPlayModeChange('run');
                        onStructuredPlayTypeChange('run');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        playMode === 'run'
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                      }`}
                    >
                      Run
                    </button>
                    <button
                      onClick={() => {
                        onPlayModeChange('pass');
                        onStructuredPlayTypeChange('rpo');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        structuredPlayType === 'rpo'
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                      }`}
                    >
                      RPO
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onPlayModeChange('pass');
                        onStructuredPlayTypeChange('coverage');
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        structuredPlayType === 'coverage'
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                      }`}
                    >
                      Coverage
                    </button>
                    <button
                      onClick={() => {
                        onPlayModeChange('pass');
                        onStructuredPlayTypeChange('pressure');
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        structuredPlayType === 'pressure'
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                      }`}
                    >
                      Pressure
                    </button>
                    <button
                      onClick={() => {
                        onPlayModeChange('run');
                        onStructuredPlayTypeChange('run_defense');
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        structuredPlayType === 'run_defense'
                          ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                      }`}
                    >
                      Run D
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Default pass/run buttons
              <div className="flex gap-2">
                <button
                  onClick={() => onPlayModeChange('pass')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    playMode === 'pass'
                      ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  Pass
                </button>
                <button
                  onClick={() => onPlayModeChange('run')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    playMode === 'run'
                      ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  Run
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const FormationBar = React.memo(FormationBarComponent);
FormationBar.displayName = 'FormationBar';
