import React from 'react';
import type { SideOfBall } from '@/components/playbook-diagram/types';

// ═══════════════════════════════════════════════════════════════════════════
// PLAY METADATA PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface SituationalTag {
  id: string;
  name: string;
}

export interface ConceptTag {
  id: string;
  name: string;
}

export interface PlayMetadataPanelProps {
  // Basic metadata
  playName: string;
  formation: string;
  concept: string;
  playType: string;
  strength: string;
  personnel: string;

  // Structured data
  situationalTags: SituationalTag[];
  selectedSituationalTags: string[];
  conceptTags: ConceptTag[];
  selectedConceptTags: string[];
  sideOfBall: SideOfBall;

  // Optional fields (structured system)
  hasStructuredData: boolean;
  installPhase: string;
  defensiveLook: string;
  offensiveLook: string;

  // View mode
  viewOnly: boolean;

  // Handlers
  onPlayNameChange: (value: string) => void;
  onFormationChange: (value: string) => void;
  onConceptChange: (value: string) => void;
  onPlayTypeChange: (value: string) => void;
  onStrengthChange: (value: string) => void;
  onPersonnelChange: (value: string) => void;
  onToggleSituationalTag: (tagId: string) => void;
  onToggleConceptTag: (tagId: string) => void;
  onInstallPhaseChange: (value: string) => void;
  onDefensiveLookChange: (value: string) => void;
  onOffensiveLookChange: (value: string) => void;
}

export const PlayMetadataPanel: React.FC<PlayMetadataPanelProps> = ({
  playName,
  formation,
  concept,
  playType,
  strength,
  personnel,
  situationalTags,
  selectedSituationalTags,
  conceptTags,
  selectedConceptTags,
  sideOfBall,
  hasStructuredData,
  installPhase,
  defensiveLook,
  offensiveLook,
  viewOnly,
  onPlayNameChange,
  onFormationChange,
  onConceptChange,
  onPlayTypeChange,
  onStrengthChange,
  onPersonnelChange,
  onToggleSituationalTag,
  onToggleConceptTag,
  onInstallPhaseChange,
  onDefensiveLookChange,
  onOffensiveLookChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Play Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Play Name *
        </label>
        <input
          type="text"
          value={playName}
          onChange={(e) => onPlayNameChange(e.target.value)}
          disabled={viewOnly}
          className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
          placeholder="e.g., 'Y-Sail Combo'"
        />
      </div>

      {/* Formation */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Formation *
        </label>
        <input
          type="text"
          value={formation}
          onChange={(e) => onFormationChange(e.target.value)}
          disabled={viewOnly}
          className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
          placeholder="e.g., 'Trips Right'"
        />
      </div>

      {/* Situational Tags */}
      {situationalTags.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Situational Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {situationalTags
              .filter(() => sideOfBall === 'offense' || sideOfBall === 'defense')
              .map((tag) => {
                const isSelected = selectedSituationalTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggleSituationalTag(tag.id)}
                    disabled={viewOnly}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                        : 'bg-[#1B1E20] text-slate-400 hover:bg-[#1B1E20]'
                    } disabled:opacity-50`}
                  >
                    {tag.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Concept Tags */}
      {conceptTags.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Concept Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {conceptTags.map((tag) => {
              const isSelected = selectedConceptTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => onToggleConceptTag(tag.id)}
                  disabled={viewOnly}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                      : 'bg-[#1B1E20] text-slate-400 hover:bg-[#1B1E20]'
                  } disabled:opacity-50`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Concept */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Concept
        </label>
        <input
          type="text"
          value={concept}
          onChange={(e) => onConceptChange(e.target.value)}
          disabled={viewOnly}
          className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
          placeholder="e.g., 'Levels Concept'"
        />
      </div>

      {/* Play Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Play Type
        </label>
        <select
          value={playType}
          onChange={(e) => onPlayTypeChange(e.target.value)}
          disabled={viewOnly}
          className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
        >
          <option value="PASS">Pass</option>
          <option value="RUN">Run</option>
          <option value="RPO">RPO</option>
        </select>
      </div>

      {/* Strength and Personnel Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Strength
          </label>
          <select
            value={strength}
            onChange={(e) => onStrengthChange(e.target.value)}
            disabled={viewOnly}
            className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
          >
            <option value="Right">Right</option>
            <option value="Left">Left</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Personnel
          </label>
          <input
            type="text"
            value={personnel}
            onChange={(e) => onPersonnelChange(e.target.value)}
            disabled={viewOnly}
            className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
            placeholder="11"
          />
        </div>
      </div>

      {/* Optional Fields (Structured System) */}
      {hasStructuredData && (
        <>
          <div className="border-t border-[#1B1E20] pt-4 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Optional Fields
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Install Phase
            </label>
            <input
              type="text"
              value={installPhase}
              onChange={(e) => onInstallPhaseChange(e.target.value)}
              disabled={viewOnly}
              className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
              placeholder="e.g., 'Week 1'"
            />
          </div>

          {sideOfBall === 'offense' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Defensive Look
              </label>
              <input
                type="text"
                value={defensiveLook}
                onChange={(e) => onDefensiveLookChange(e.target.value)}
                disabled={viewOnly}
                className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                placeholder="e.g., 'Cover 2'"
              />
            </div>
          )}

          {sideOfBall === 'defense' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Offensive Look
              </label>
              <input
                type="text"
                value={offensiveLook}
                onChange={(e) => onOffensiveLookChange(e.target.value)}
                disabled={viewOnly}
                className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20] px-3 py-2 text-sm text-white focus:border-[#00F6E5]/50 focus:outline-none disabled:opacity-50"
                placeholder="e.g., '11 Personnel'"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
