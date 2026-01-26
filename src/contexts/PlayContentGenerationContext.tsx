"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playsAPI, CreatePlayRequest } from '@/lib/api/plays';

interface PlayMetadata {
  id: string;
  fileName: string;
  name: string;
  url: string;
  metadataId?: string;
  orgId?: string;
}

interface GeneratedPlayContent {
  playId: string;
  playMetadataId: string;
  fileName: string;
  playName: string;
  imageUrl: string;
  content: any;
}

interface PlayContentGenerationContextType {
  isGenerating: boolean;
  isComplete: boolean;
  progress: {
    current: number;
    total: number;
  };
  error: string | null;
  generatedContents: GeneratedPlayContent[];
  startGeneration: (plays: PlayMetadata[]) => Promise<void>;
  reset: () => void;
}

const PlayContentGenerationContext = createContext<PlayContentGenerationContextType | null>(null);

export function usePlayContentGeneration() {
  const context = useContext(PlayContentGenerationContext);
  if (!context) {
    throw new Error('usePlayContentGeneration must be used within PlayContentGenerationProvider');
  }
  return context;
}

export function PlayContentGenerationProvider({ children }: { children: React.ReactNode }) {
  const { session, orgId } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [generatedContents, setGeneratedContents] = useState<GeneratedPlayContent[]>([]);
  const isGeneratingRef = useRef(false);

  const startGeneration = useCallback(async (plays: PlayMetadata[]) => {
    // Prevent duplicate runs
    if (isGeneratingRef.current) {
      console.log('[PlayContentGeneration] Already in progress, skipping');
      return;
    }

    if (!session?.access_token || !orgId) {
      console.error('[PlayContentGeneration] Missing auth credentials');
      setError('Not authenticated. Please sign in.');
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setIsComplete(false);
    setError(null);
    setProgress({ current: 0, total: plays.length });
    setGeneratedContents([]);

    try {
      const results: GeneratedPlayContent[] = [];

      for (let i = 0; i < plays.length; i++) {
        const play = plays[i];

        try {
          console.log(`[PlayContentGeneration] Processing play ${i + 1}/${plays.length}: ${play.name}`);

          // Step 1: Create play record using new API
          const createData: CreatePlayRequest = {
            orgId: orgId,
            playbookMetadataId: play.metadataId || '',
            name: play.name,
            triggerProcessing: true, // Trigger AI processing immediately
          };

          const createResponse = await playsAPI.createPlay(createData, session.access_token);
          const playId = createResponse.playId;
          console.log(`[PlayContentGeneration] Play created with ID: ${playId}`);

          // Step 2: Poll for completion
          // The new API triggers processing automatically, so we just need to poll
          let attempts = 0;
          const maxAttempts = 300; // 15 minutes
          let complete = false;

          while (!complete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            attempts++;

            try {
              const statusData = await playsAPI.getPlay(playId, session.access_token, {
                orgId,
                includeAssignments: true,
                includeFlashcards: true,
              });

              console.log(`[PlayContentGeneration] Poll ${attempts}: Status = ${statusData.play.contentStatus}`);

              if (statusData.play.contentStatus === 'draft' || statusData.play.contentStatus === 'approved') {
                // Generation complete (draft = ready for review, approved = already reviewed)
                complete = true;
                results.push({
                  playId: statusData.play.id,
                  playMetadataId: play.metadataId || '',
                  fileName: play.fileName,
                  playName: play.name,
                  imageUrl: play.url,
                  content: statusData,
                });
              } else if (statusData.play.contentStatus === 'rejected') {
                throw new Error(`Generation failed for ${play.name}`);
              }
              // If status is 'generating', continue polling
            } catch (pollError) {
              console.error(`[PlayContentGeneration] Polling error:`, pollError);
              // Continue polling even if there's an error
            }
          }

          if (!complete) {
            throw new Error(`Timeout waiting for ${play.name} to complete`);
          }

          // Update progress
          setProgress({ current: i + 1, total: plays.length });
          setGeneratedContents([...results]);
        } catch (err) {
          console.error(`[PlayContentGeneration] Error generating content for ${play.name}:`, err);
          // Continue with next play instead of stopping completely
        }
      }

      console.log(`[PlayContentGeneration] Complete: ${results.length}/${plays.length} plays processed`);
      setIsComplete(true);
      setIsGenerating(false);
    } catch (err: any) {
      console.error('[PlayContentGeneration] Error during generation:', err);
      setError(err.message || 'Failed to generate content');
      setIsGenerating(false);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [session, orgId]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setIsComplete(false);
    setProgress({ current: 0, total: 0 });
    setError(null);
    setGeneratedContents([]);
    isGeneratingRef.current = false;
  }, []);

  return (
    <PlayContentGenerationContext.Provider
      value={{
        isGenerating,
        isComplete,
        progress,
        error,
        generatedContents,
        startGeneration,
        reset,
      }}
    >
      {children}
    </PlayContentGenerationContext.Provider>
  );
}
