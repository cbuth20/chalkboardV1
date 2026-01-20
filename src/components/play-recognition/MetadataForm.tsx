import React, { useState } from 'react';
import {
  SideOfBall,
  ContentType,
  Level,
  Position,
  PlaybookMetadataInput,
  SIDE_OF_BALL_LABELS,
  CONTENT_TYPE_LABELS,
  LEVEL_LABELS,
  getPositionsForSideOfBall,
} from '@/types/playbook-metadata';
import { ALL_POSITIONS } from '@/lib/positions';

interface MetadataFormProps {
  onSubmit: (metadata: PlaybookMetadataInput) => void;
  onSkip: () => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({ onSubmit, onSkip }) => {
  const [formData, setFormData] = useState<PlaybookMetadataInput>({
    position_relevance: ['all'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSideOfBallChange = (sideOfBall: SideOfBall) => {
    // When side of ball changes, reset positions to 'all'
    setFormData(prev => ({
      ...prev,
      side_of_ball: sideOfBall,
      position_relevance: ['all'],
    }));
  };

  const handlePositionToggle = (position: Position) => {
    setFormData(prev => {
      const currentPositions = prev.position_relevance || ['all'];

      if (position === 'all') {
        return { ...prev, position_relevance: ['all'] };
      }

      // Remove 'all' if selecting specific positions
      const withoutAll = currentPositions.filter(p => p !== 'all');

      if (withoutAll.includes(position)) {
        const newPositions = withoutAll.filter(p => p !== position);
        return {
          ...prev,
          position_relevance: newPositions.length === 0 ? ['all'] : newPositions,
        };
      } else {
        return {
          ...prev,
          position_relevance: [...withoutAll, position],
        };
      }
    });
  };

  const selectedPositions = formData.position_relevance || ['all'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0F12] rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0F12] border-b border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Add Playbook Details</h2>
          <p className="text-slate-400 text-sm">
            Help organize your playbook by adding some optional tags
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Side of Ball */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Side of Ball
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(SIDE_OF_BALL_LABELS) as [SideOfBall, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSideOfBallChange(value)}
                  className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                    formData.side_of_ball === value
                      ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, content_type: value }))}
                  className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                    formData.content_type === value
                      ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          {/* <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, level: value }))}
                  className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                    formData.level === value
                      ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div> */}

          {/* Position Relevance */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Position Relevance
              {!formData.side_of_ball && (
                <span className="ml-2 text-xs text-amber-400">Select "Side of Ball" first</span>
              )}
            </label>
            {formData.side_of_ball ? (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {/* "All" button */}
                  <button
                    type="button"
                    onClick={() => handlePositionToggle('all')}
                    className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                      selectedPositions.includes('all')
                        ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                    }`}
                    title="All Positions"
                  >
                    ALL
                  </button>

                  {/* Positions for selected side of ball */}
                  {getPositionsForSideOfBall(formData.side_of_ball).map((pos) => {
                    const isSelected = selectedPositions.includes(pos) || selectedPositions.includes('all');
                    const isAllSelected = selectedPositions.includes('all');
                    const posInfo = ALL_POSITIONS[pos];

                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handlePositionToggle(pos)}
                        disabled={isAllSelected}
                        className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                          isSelected
                            ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        } ${isAllSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={posInfo?.name || pos}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {selectedPositions.includes('all')
                    ? `All ${SIDE_OF_BALL_LABELS[formData.side_of_ball].toLowerCase()} positions selected`
                    : `${selectedPositions.length} position(s) selected`}
                </p>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center text-slate-400 text-sm">
                Please select a "Side of Ball" to choose position relevance
              </div>
            )}
          </div>

          {/* Formation Name */}
          <div>
            <label htmlFor="formation_name" className="block text-sm font-semibold text-slate-300 mb-2">
              Formation Name (Optional)
            </label>
            <input
              id="formation_name"
              type="text"
              value={formData.formation_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, formation_name: e.target.value }))}
              placeholder="e.g., Spread, I-Formation, Shotgun"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
            />
          </div>

          {/* Concept Name */}
          <div>
            <label htmlFor="concept_name" className="block text-sm font-semibold text-slate-300 mb-2">
              Concept Name (Optional)
            </label>
            <input
              id="concept_name"
              type="text"
              value={formData.concept_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, concept_name: e.target.value }))}
              placeholder="e.g., Mesh, Power, Zone, Slant-Flat"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
            />
          </div>

          {/* Custom Notes */}
          <div>
            <label htmlFor="custom_notes" className="block text-sm font-semibold text-slate-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="custom_notes"
              value={formData.custom_notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, custom_notes: e.target.value }))}
              placeholder="Any additional notes or details..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-semibold hover:bg-white/10 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[var(--neon-teal)] rounded-lg text-black font-bold hover:bg-[#00d4c5] transition-colors shadow-[0_0_15px_rgba(0,246,229,0.3)]"
            >
              Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
