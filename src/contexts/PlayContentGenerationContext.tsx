"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  getCreatePlayRecordApiUrl,
  getProcessPlayContentApiUrl,
  getCheckPlayStatusApiUrl
} from '@/lib/api-config';

interface PlayMetadata {
  id: string;
  fileName: string;
  name: string;
  url: string;
  metadataId?: string;
  teamId?: string;
}

interface GeneratedPlayContent {
  playId: string;
  playMetadataId: string;
  fileName: string;
  playName: string;
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
  startGeneration: (plays: PlayMetadata[], teamId: string) => Promise<void>;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [generatedContents, setGeneratedContents] = useState<GeneratedPlayContent[]>([]);
  const isGeneratingRef = useRef(false);

  const startGeneration = useCallback(async (plays: PlayMetadata[], teamId: string) => {
    // Prevent duplicate runs
    if (isGeneratingRef.current) {
      console.log('Generation already in progress, skipping');
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setIsComplete(false);
    setError(null);
    setProgress({ current: 0, total: plays.length });
    setGeneratedContents([]);

    try {
      const createUrl = getCreatePlayRecordApiUrl();
      const processUrl = getProcessPlayContentApiUrl();
      const statusUrl = getCheckPlayStatusApiUrl();
      const results: GeneratedPlayContent[] = [];

      for (let i = 0; i < plays.length; i++) {
        const play = plays[i];

        try {
          console.log(`Generating content for play ${i + 1}/${plays.length}: ${play.name}`);

          // Step 1: Create play record
          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playbookMetadataId: play.metadataId,
              fileName: play.fileName,
              teamId: teamId,
            }),
          });

          if (!createResponse.ok) {
            throw new Error(`Failed to create play record for ${play.name}`);
          }

          const { playId } = await createResponse.json();
          console.log(`Play record created with ID: ${playId}`);

          // Step 2: Trigger background processing
          await fetch(processUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playId,
              imageUrl: play.url,
              fileName: play.fileName,
              generateInsights: true,
              generateAssignments: true,
              generateKnowledge: true,
            }),
          });

          // Step 3: Poll for completion
          let attempts = 0;
          const maxAttempts = 300; // 15 minutes
          let complete = false;

          while (!complete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            attempts++;

            const statusResponse = await fetch(`${statusUrl}?playId=${playId}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();

              if (statusData.status === 'draft') {
                complete = true;
                results.push({
                  playId: statusData.playId,
                  playMetadataId: play.metadataId || '',
                  fileName: play.fileName,
                  playName: play.name,
                  content: statusData,
                });
              } else if (statusData.status === 'rejected') {
                throw new Error(`Generation failed for ${play.name}`);
              }
            }
          }

          if (!complete) {
            throw new Error(`Timeout waiting for ${play.name} to complete`);
          }

          // Update progress
          setProgress({ current: i + 1, total: plays.length });
          setGeneratedContents([...results]);
        } catch (err) {
          console.error(`Error generating content for ${play.name}:`, err);
          // Continue with next play instead of stopping completely
        }
      }

      console.log(`Generation complete: ${results.length}/${plays.length} plays processed`);
      setIsComplete(true);
      setIsGenerating(false);
    } catch (err: any) {
      console.error('Error during generation:', err);
      setError(err.message || 'Failed to generate content');
      setIsGenerating(false);
    } finally {
      isGeneratingRef.current = false;
    }
  }, []);

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
