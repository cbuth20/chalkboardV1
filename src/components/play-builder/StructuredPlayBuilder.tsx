'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import type {
  BuiltPlayData,
  PlayMetadata,
  DiagramPlayer,
  PlayerAssignment,
  PlayerResponsibility,
  BuilderMode,
  VisualData,
} from '@/types/play-assignments';

// Import our new components
import { PlayMetadataPanel } from './PlayMetadataPanel';
import { ModeToggle } from './ModeToggle';
import { AssignmentPanel } from './AssignmentPanel';
import { ResponsibilitiesPanel } from './ResponsibilitiesPanel';
import { ValidationPanel } from './ValidationPanel';

interface StructuredPlayBuilderProps {
  initialData?: Partial<BuiltPlayData>;
  onSave: (playData: BuiltPlayData) => Promise<void>;
  onFinalize: (playData: BuiltPlayData) => Promise<void>;
  onCancel: () => void;

  // Data from API
  situationalTags: Array<{ id: string; name: string; category: string }>;
  conceptTags: Array<{ id: string; name: string }>;
  formations: Array<{ id: string; name: string }>;
}

export function StructuredPlayBuilder({
  initialData,
  onSave,
  onFinalize,
  onCancel,
  situationalTags,
  conceptTags,
  formations,
}: StructuredPlayBuilderProps) {
  // State
  const [mode, setMode] = useState<BuilderMode>('draw');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();
  const [playData, setPlayData] = useState<BuiltPlayData>(() => ({
    metadata: {
      playName: initialData?.metadata?.playName || '',
      sideOfBall: initialData?.metadata?.sideOfBall || 'offense',
      playType: initialData?.metadata?.playType || 'pass',
      personnel: initialData?.metadata?.personnel || '',
      formationName: initialData?.metadata?.formationName || '',
      primaryFolder: initialData?.metadata?.primaryFolder || '',
      situationalTags: initialData?.metadata?.situationalTags || [],
      conceptTags: initialData?.metadata?.conceptTags || [],
    },
    offensePlayers: initialData?.offensePlayers || [],
    defensePlayers: initialData?.defensePlayers || [],
    visualData: initialData?.visualData || {
      routes: [],
      blocking: [],
    },
    isFinalized: initialData?.isFinalized || false,
    completionWarnings: initialData?.completionWarnings || [],
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    warnings: Array<{ type: 'error' | 'warning'; message: string; playerId?: string }>;
  }>({ isValid: false, warnings: [] });

  // Get selected player
  const selectedPlayer = selectedPlayerId
    ? [...playData.offensePlayers, ...playData.defensePlayers].find(p => p.id === selectedPlayerId)
    : null;

  // Update metadata
  const handleMetadataChange = (metadata: PlayMetadata) => {
    setPlayData(prev => ({ ...prev, metadata }));
  };

  // Update player assignment
  const handleAssignmentChange = (playerId: string, assignment: PlayerAssignment) => {
    setPlayData(prev => ({
      ...prev,
      offensePlayers: prev.offensePlayers.map(p =>
        p.id === playerId ? { ...p, assignment } : p
      ),
      defensePlayers: prev.defensePlayers.map(p =>
        p.id === playerId ? { ...p, assignment } : p
      ),
    }));

    // Auto-trigger validation after assignment change
    validatePlay();
  };

  // Update player responsibility
  const handleResponsibilityChange = (playerId: string, responsibility: PlayerResponsibility) => {
    setPlayData(prev => ({
      ...prev,
      offensePlayers: prev.offensePlayers.map(p =>
        p.id === playerId ? { ...p, responsibility } : p
      ),
      defensePlayers: prev.defensePlayers.map(p =>
        p.id === playerId ? { ...p, responsibility } : p
      ),
    }));

    // Auto-trigger validation after responsibility change
    validatePlay();
  };

  // Validate play
  const validatePlay = () => {
    const warnings: Array<{ type: 'error' | 'warning'; message: string; playerId?: string }> = [];
    const allPlayers = [...playData.offensePlayers, ...playData.defensePlayers];

    // Check required metadata
    if (!playData.metadata.playName || playData.metadata.playName === 'Untitled Play') {
      warnings.push({ type: 'error', message: 'Play name is required' });
    }

    if (!playData.metadata.formationName) {
      warnings.push({ type: 'error', message: 'Formation is required' });
    }

    if (!playData.metadata.sideOfBall) {
      warnings.push({ type: 'error', message: 'Side of ball is required' });
    }

    if (playData.metadata.situationalTags.length === 0) {
      warnings.push({ type: 'warning', message: 'At least one situational tag is recommended' });
    }

    // Check assignments
    const playersWithoutAssignments = allPlayers.filter(p => !p.assignment);
    if (playersWithoutAssignments.length > 0) {
      warnings.push({
        type: 'error',
        message: `${playersWithoutAssignments.length} player(s) missing assignments`,
      });
    }

    // Check responsibilities
    const playersWithoutResponsibilities = allPlayers.filter(
      p => !p.responsibility?.responsibility
    );
    if (playersWithoutResponsibilities.length > 0) {
      warnings.push({
        type: 'error',
        message: `${playersWithoutResponsibilities.length} player(s) missing responsibilities`,
      });
    }

    const isValid = warnings.filter(w => w.type === 'error').length === 0 && allPlayers.length > 0;

    setValidationResult({ isValid, warnings });
    return { isValid, warnings };
  };

  // Save as draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await onSave(playData);
    } finally {
      setIsSaving(false);
    }
  };

  // Finalize play
  const handleFinalize = async () => {
    const validation = validatePlay();

    if (!validation.isValid) {
      alert('Please fix all validation errors before finalizing.');
      return;
    }

    setIsSaving(true);
    try {
      await onFinalize(playData);
    } finally {
      setIsSaving(false);
    }
  };

  // Run validation on mount and when data changes
  useEffect(() => {
    validatePlay();
  }, [playData]);

  return (
    <div className="h-screen flex flex-col bg-[#0A0C0F]">
      {/* Top Metadata Panel */}
      <PlayMetadataPanel
        metadata={playData.metadata}
        onChange={handleMetadataChange}
        situationalTags={situationalTags}
        conceptTags={conceptTags}
        formations={formations}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Formation Picker (Future) */}
        <div className="w-64 bg-[#0D1117] border-r border-gray-800 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">Formations</h3>
          <div className="space-y-2">
            {formations
              .filter(f => !playData.metadata.sideOfBall || f.id.includes(playData.metadata.sideOfBall))
              .map(formation => (
                <button
                  key={formation.id}
                  onClick={() => {
                    handleMetadataChange({
                      ...playData.metadata,
                      formationId: formation.id,
                      formationName: formation.name,
                    });
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    playData.metadata.formationId === formation.id
                      ? 'bg-[#00F6E5] text-black font-medium'
                      : 'bg-[#161B22] text-gray-400 hover:text-white hover:bg-[#1C2128]'
                  }`}
                >
                  {formation.name}
                </button>
              ))}
          </div>
        </div>

        {/* Center - Field Canvas */}
        <div className="flex-1 flex flex-col bg-[#0D1117]">
          {/* Canvas Placeholder */}
          <div className="flex-1 flex items-center justify-center border-b border-gray-800">
            <div className="text-center">
              <div className="w-64 h-64 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500 text-sm">
                  Field Canvas
                  <br />
                  (Integration with existing PlayBuilder canvas)
                </p>
              </div>
              <p className="text-xs text-gray-600">
                Draw routes, blocks, and paths in Draw Mode
              </p>
            </div>
          </div>

          {/* Bottom - Responsibilities Panel */}
          <div className="h-80 overflow-y-auto border-t border-gray-800 p-4">
            <ResponsibilitiesPanel
              offensePlayers={playData.offensePlayers}
              defensePlayers={playData.defensePlayers}
              onPlayerSelect={setSelectedPlayerId}
              onResponsibilityChange={handleResponsibilityChange}
              selectedPlayerId={selectedPlayerId}
            />
          </div>
        </div>

        {/* Right Sidebar - Mode Toggle & Assignment Panel */}
        <div className="w-96 bg-[#0D1117] border-l border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onChange={setMode} />

            {/* Assignment Panel (Assign Mode Only) */}
            {mode === 'assign' && (
              <AssignmentPanel
                selectedPlayer={selectedPlayer}
                allPlayers={[...playData.offensePlayers, ...playData.defensePlayers]}
                onAssignmentChange={handleAssignmentChange}
              />
            )}

            {/* Validation Panel */}
            <ValidationPanel
              warnings={validationResult.warnings}
              isValid={validationResult.isValid}
              onPlayerClick={setSelectedPlayerId}
            />

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-gray-800">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-[#161B22] border border-gray-700 rounded-lg text-white font-medium hover:bg-[#1C2128] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={handleFinalize}
                disabled={!validationResult.isValid || isSaving}
                className="w-full px-4 py-3 bg-[#00F6E5] text-black rounded-lg font-medium hover:bg-[#00E5D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Finalize Play
              </button>

              <button
                onClick={onCancel}
                className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg text-gray-400 font-medium hover:text-white hover:border-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
