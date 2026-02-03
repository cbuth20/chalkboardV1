'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PlayMetadata, SideOfBall } from '@/types/play-assignments';

interface PlayMetadataPanelProps {
  metadata: PlayMetadata;
  onChange: (metadata: PlayMetadata) => void;
  situationalTags: Array<{ id: string; name: string; category: string }>;
  conceptTags: Array<{ id: string; name: string }>;
  formations: Array<{ id: string; name: string }>;
}

export function PlayMetadataPanel({
  metadata,
  onChange,
  situationalTags,
  conceptTags,
  formations,
}: PlayMetadataPanelProps) {
  const [showOptional, setShowOptional] = useState(false);

  const updateMetadata = (updates: Partial<PlayMetadata>) => {
    onChange({ ...metadata, ...updates });
  };

  const toggleSituationalTag = (tagId: string) => {
    const current = metadata.situationalTags || [];
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    updateMetadata({ situationalTags: updated });
  };

  const toggleConceptTag = (tagId: string) => {
    const current = metadata.conceptTags || [];
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    updateMetadata({ conceptTags: updated });
  };

  return (
    <div className="bg-[#0D1117] border-b border-gray-800 p-4">
      {/* Main Metadata Row */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Play Name */}
        <div className="col-span-3">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Play Name *
          </label>
          <input
            type="text"
            value={metadata.playName}
            onChange={(e) => updateMetadata({ playName: e.target.value })}
            placeholder="Enter play name"
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
          />
        </div>

        {/* Side of Ball */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Side of Ball *
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateMetadata({ sideOfBall: 'offense' })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                metadata.sideOfBall === 'offense'
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              Offense
            </button>
            <button
              onClick={() => updateMetadata({ sideOfBall: 'defense' })}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                metadata.sideOfBall === 'defense'
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              Defense
            </button>
          </div>
        </div>

        {/* Play Type */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Play Type *
          </label>
          <select
            value={metadata.playType}
            onChange={(e) => updateMetadata({ playType: e.target.value as any })}
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
          >
            <option value="">Select type...</option>
            {metadata.sideOfBall === 'offense' ? (
              <>
                <option value="run">Run</option>
                <option value="pass">Pass</option>
                <option value="rpo">RPO</option>
                <option value="screen">Screen</option>
                <option value="play_action">Play Action</option>
              </>
            ) : (
              <>
                <option value="coverage">Coverage</option>
                <option value="pressure">Pressure</option>
                <option value="run_fit">Run Fit</option>
                <option value="stunt">Stunt</option>
                <option value="simulated_pressure">Simulated Pressure</option>
              </>
            )}
          </select>
        </div>

        {/* Formation */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Formation *
          </label>
          <select
            value={metadata.formationId || ''}
            onChange={(e) => {
              const formation = formations.find(f => f.id === e.target.value);
              updateMetadata({
                formationId: e.target.value,
                formationName: formation?.name || '',
              });
            }}
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
          >
            <option value="">Select formation...</option>
            {formations
              .filter(f => !metadata.sideOfBall || f.id.includes(metadata.sideOfBall))
              .map(formation => (
                <option key={formation.id} value={formation.id}>
                  {formation.name}
                </option>
              ))}
          </select>
        </div>

        {/* Personnel */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Personnel *
          </label>
          <input
            type="text"
            value={metadata.personnel}
            onChange={(e) => updateMetadata({ personnel: e.target.value })}
            placeholder={metadata.sideOfBall === 'offense' ? '11, 12, 21...' : '4-3, Nickel...'}
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
          />
        </div>

        {/* Primary Folder */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Folder
          </label>
          <input
            type="text"
            value={metadata.primaryFolder}
            onChange={(e) => updateMetadata({ primaryFolder: e.target.value })}
            placeholder="Folder"
            className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
          />
        </div>
      </div>

      {/* Situational Tags Row */}
      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Situational Tags *
        </label>
        <div className="flex flex-wrap gap-2">
          {situationalTags
            .filter(tag => !metadata.sideOfBall || tag.id.includes(metadata.sideOfBall))
            .map(tag => {
              const isSelected = metadata.situationalTags?.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleSituationalTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#00F6E5] text-black'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* Optional Fields (Collapsible) */}
      <div className="mt-4">
        <button
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Optional Fields
        </button>

        {showOptional && (
          <div className="mt-4 grid grid-cols-12 gap-4">
            {/* Opponent Look */}
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                {metadata.sideOfBall === 'offense' ? 'Defensive Look' : 'Offensive Look'}
              </label>
              <input
                type="text"
                value={metadata.sideOfBall === 'offense' ? metadata.defensiveLook || '' : metadata.offensiveLook || ''}
                onChange={(e) =>
                  updateMetadata(
                    metadata.sideOfBall === 'offense'
                      ? { defensiveLook: e.target.value }
                      : { offensiveLook: e.target.value }
                  )
                }
                placeholder={metadata.sideOfBall === 'offense' ? 'Cover 2, 4-3, etc.' : '11 Personnel, etc.'}
                className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
              />
            </div>

            {/* Install Phase */}
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Install Phase
              </label>
              <input
                type="text"
                value={metadata.installPhase || ''}
                onChange={(e) => updateMetadata({ installPhase: e.target.value })}
                placeholder="Week 1, Spring, etc."
                className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent"
              />
            </div>

            {/* Concept Tags */}
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Concept Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {conceptTags.map(tag => {
                  const isSelected = metadata.conceptTags?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleConceptTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-[#161B22] text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="col-span-12">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Notes
              </label>
              <textarea
                value={metadata.notes || ''}
                onChange={(e) => updateMetadata({ notes: e.target.value })}
                placeholder="Additional notes about this play..."
                rows={2}
                className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5] focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
