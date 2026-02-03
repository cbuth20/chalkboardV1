'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StructuredPlayBuilder } from './StructuredPlayBuilder';
import { situationalTagsAPI, type SituationalTag } from '@/lib/api/situational-tags';
import { conceptTagsAPI, type ConceptTag } from '@/lib/api/concept-tags';
import { formationsAPI, type Formation } from '@/lib/api/formations';
import { playerPlaysAPI } from '@/lib/api/player-plays';
import type { BuiltPlayData } from '@/types/play-assignments';

interface StructuredPlayBuilderWrapperProps {
  initialData?: Partial<BuiltPlayData>;
  onCancel: () => void;
  onSuccess: () => void;
}

export function StructuredPlayBuilderWrapper({
  initialData,
  onCancel,
  onSuccess,
}: StructuredPlayBuilderWrapperProps) {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [situationalTags, setSituationalTags] = useState<SituationalTag[]>([]);
  const [conceptTags, setConceptTags] = useState<ConceptTag[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);

  // Load all necessary data
  useEffect(() => {
    const loadData = async () => {
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      if (!orgId) {
        setError('Organization ID not found. Please ensure you are logged in and have an organization.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load all resources in parallel
        const [situationalTagsRes, conceptTagsRes, formationsRes] = await Promise.all([
          situationalTagsAPI.list(session.access_token),
          conceptTagsAPI.list(session.access_token),
          formationsAPI.list(session.access_token),
        ]);

        setSituationalTags(situationalTagsRes.tags);
        setConceptTags(conceptTagsRes.tags);
        setFormations(formationsRes.formations);
      } catch (err) {
        console.error('Error loading play builder data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.access_token, orgId]);

  // Save draft handler
  const handleSave = async (playData: BuiltPlayData) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Convert BuiltPlayData to API format
    const playerAssignments: Record<string, any> = {};
    const playerResponsibilities: Record<string, any> = {};

    [...playData.offensePlayers, ...playData.defensePlayers].forEach(player => {
      if (player.assignment) {
        playerAssignments[player.id] = player.assignment;
      }
      if (player.responsibility) {
        playerResponsibilities[player.id] = player.responsibility;
      }
    });

    const result = await playerPlaysAPI.createPlay(
      {
        name: playData.metadata.playName,
        sideOfBall: playData.metadata.sideOfBall,
        structuredPlayType: playData.metadata.playType,
        personnel: playData.metadata.personnel,
        formationId: playData.metadata.formationId,
        formationName: playData.metadata.formationName,
        primaryFolder: playData.metadata.primaryFolder,
        defensiveLook: playData.metadata.defensiveLook,
        offensiveLook: playData.metadata.offensiveLook,
        installPhase: playData.metadata.installPhase,
        situationalTags: playData.metadata.situationalTags,
        conceptTags: playData.metadata.conceptTags,
        playerAssignments,
        playerResponsibilities,
        visualData: playData.visualData,
        isFinalized: false,
        triggerProcessing: false,
      },
      session.access_token
    );

    if (result.success) {
      return result.playId;
    } else {
      throw new Error('Failed to save play');
    }
  };

  // Finalize handler
  const handleFinalize = async (playData: BuiltPlayData) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // First save the play
    const playId = await handleSave(playData);

    // Then finalize it with AI processing
    const result = await playerPlaysAPI.finalizePlay(
      playId,
      session.access_token,
      true // trigger AI processing
    );

    if (result.success) {
      onSuccess();
    } else {
      throw new Error('Failed to finalize play');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0C0F]">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
          <p className="text-gray-400">Loading Play Builder...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0C0F]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7]"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Render StructuredPlayBuilder with loaded data
  return (
    <StructuredPlayBuilder
      initialData={initialData}
      onSave={handleSave}
      onFinalize={handleFinalize}
      onCancel={onCancel}
      situationalTags={situationalTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        category: tag.category,
      }))}
      conceptTags={conceptTags.map(tag => ({
        id: tag.id,
        name: tag.name,
      }))}
      formations={formations.map(f => ({
        id: f.id,
        name: f.name,
      }))}
    />
  );
}
