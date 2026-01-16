"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getGeneratePlayContentApiUrl } from '@/lib/api-config';

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
      const apiUrl = getGeneratePlayContentApiUrl();
      const results: GeneratedPlayContent[] = [];

      for (let i = 0; i < plays.length; i++) {
        const play = plays[i];

        try {
          console.log(`Generating content for play ${i + 1}/${plays.length}: ${play.name}`);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playbookMetadataId: play.metadataId,
              imageUrl: play.url,
              fileName: play.fileName,
              teamId: teamId,
              generateInsights: true,
              generateAssignments: true,
              generateKnowledge: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to generate content for ${play.name}`);
          }

          const data = await response.json();
          results.push({
            playId: data.playId,
            playMetadataId: play.metadataId || '',
            fileName: play.fileName,
            playName: play.name,
            content: data,
          });

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
