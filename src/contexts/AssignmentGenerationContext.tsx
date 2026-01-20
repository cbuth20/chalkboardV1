"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAnalyzePlaysApiUrl } from '@/lib/api-config';
import { usePlays } from './PlaysContext';
import { convertGPTAnalysisToDefinition, type GPTAnalysis } from '@/lib/generateQuizQuestions';

interface ImagePlaybook {
  id: string;
  fileName: string;
  url: string;
  metadata?: any;
}

interface AssignmentGenerationContextType {
  isGenerating: boolean;
  isComplete: boolean;
  progress: {
    current: number;
    total: number;
  };
  error: string | null;
  startGeneration: (playbooks: ImagePlaybook[], forceRegenerate?: boolean) => Promise<void>;
  reset: () => void;
  navigateToAssignments: () => void;
}

const AssignmentGenerationContext = createContext<AssignmentGenerationContextType | null>(null);

export function useAssignmentGeneration() {
  const context = useContext(AssignmentGenerationContext);
  if (!context) {
    throw new Error('useAssignmentGeneration must be used within AssignmentGenerationProvider');
  }
  return context;
}

export function AssignmentGenerationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hasAnalyzedPlay, getAnalyzedPlay, addAnalyzedPlay } = usePlays();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);

  const startGeneration = useCallback(async (playbooks: ImagePlaybook[], forceRegenerate = false) => {
    // Prevent duplicate runs
    if (isGeneratingRef.current) {
      console.log('Generation already in progress, skipping');
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setIsComplete(false);
    setError(null);
    setProgress({ current: 0, total: playbooks.length });

    try {
      const analyzedPlays: any[] = [];
      const playsToAnalyze: ImagePlaybook[] = [];

      // If force regenerate, analyze all plays (ignore cache)
      if (forceRegenerate) {
        console.log('Force regenerate: analyzing all plays');
        playsToAnalyze.push(...playbooks);
      } else {
        // Check which plays are already analyzed in cache
        for (const playbook of playbooks) {
          if (hasAnalyzedPlay(playbook.id)) {
            const cachedPlay = getAnalyzedPlay(playbook.id);
            if (cachedPlay) {
              console.log(`Using cached analysis for ${playbook.fileName}`);
              analyzedPlays.push(cachedPlay);
            }
          } else {
            playsToAnalyze.push(playbook);
          }
        }

        // Update progress with cached plays
        setProgress({ current: analyzedPlays.length, total: playbooks.length });
      }

      // Analyze remaining plays
      const apiUrl = getAnalyzePlaysApiUrl();

      for (let i = 0; i < playsToAnalyze.length; i++) {
        const playbook = playsToAnalyze[i];

        try {
          console.log(`Analyzing play ${i + 1}/${playsToAnalyze.length}: ${playbook.fileName}`);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: playbook.fileName,
              imageUrl: playbook.url,
              metadata: playbook.metadata,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to analyze ${playbook.fileName}`);
          }

          const gptAnalysis: GPTAnalysis = await response.json();

          // Convert GPT analysis to appropriate format based on content type
          const analyzedPlay = convertGPTAnalysisToDefinition(gptAnalysis, playbook.id);

          analyzedPlays.push(analyzedPlay);
          addAnalyzedPlay(playbook.id, analyzedPlay);

          // Update progress
          setProgress({ current: analyzedPlays.length, total: playbooks.length });
        } catch (err) {
          console.error(`Error analyzing ${playbook.fileName}:`, err);
          // Continue with next play instead of stopping completely
        }
      }

      console.log(`Generation complete: ${analyzedPlays.length}/${playbooks.length} plays analyzed`);
      setIsComplete(true);
      setIsGenerating(false);
    } catch (err: any) {
      console.error('Error during generation:', err);
      setError(err.message || 'Failed to generate assignments');
      setIsGenerating(false);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [hasAnalyzedPlay, getAnalyzedPlay, addAnalyzedPlay]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setIsComplete(false);
    setProgress({ current: 0, total: 0 });
    setError(null);
    isGeneratingRef.current = false;
  }, []);

  const navigateToAssignments = useCallback(() => {
    router.push('/games/assignment');
    reset();
  }, [router, reset]);

  return (
    <AssignmentGenerationContext.Provider
      value={{
        isGenerating,
        isComplete,
        progress,
        error,
        startGeneration,
        reset,
        navigateToAssignments,
      }}
    >
      {children}
    </AssignmentGenerationContext.Provider>
  );
}
