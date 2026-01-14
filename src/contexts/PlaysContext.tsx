'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlayDefinition } from '@/types/football';

interface PlaysContextType {
  analyzedPlays: Map<string, PlayDefinition>;
  getAnalyzedPlay: (id: string) => PlayDefinition | undefined;
  getAllAnalyzedPlays: () => PlayDefinition[];
  addAnalyzedPlay: (id: string, play: PlayDefinition) => void;
  addAnalyzedPlays: (plays: PlayDefinition[]) => void;
  clearAnalyzedPlays: () => void;
  hasAnalyzedPlay: (id: string) => boolean;
}

const PlaysContext = createContext<PlaysContextType | undefined>(undefined);

const STORAGE_KEY = 'chalkboard_analyzed_plays';
const STORAGE_VERSION = 'v1';

export function PlaysProvider({ children }: { children: React.ReactNode }) {
  const [analyzedPlays, setAnalyzedPlays] = useState<Map<string, PlayDefinition>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Check version to handle schema changes
        if (data.version === STORAGE_VERSION && data.plays) {
          const playsMap = new Map<string, PlayDefinition>();
          Object.entries(data.plays).forEach(([id, play]) => {
            playsMap.set(id, play as PlayDefinition);
          });
          setAnalyzedPlays(playsMap);
        }
      }
    } catch (error) {
      console.error('Failed to load analyzed plays from storage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever analyzedPlays changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete

    try {
      const playsObject: Record<string, PlayDefinition> = {};
      analyzedPlays.forEach((play, id) => {
        playsObject[id] = play;
      });

      const data = {
        version: STORAGE_VERSION,
        plays: playsObject,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save analyzed plays to storage:', error);
    }
  }, [analyzedPlays, isLoaded]);

  const getAnalyzedPlay = useCallback((id: string): PlayDefinition | undefined => {
    return analyzedPlays.get(id);
  }, [analyzedPlays]);

  const getAllAnalyzedPlays = useCallback((): PlayDefinition[] => {
    return Array.from(analyzedPlays.values());
  }, [analyzedPlays]);

  const addAnalyzedPlay = useCallback((id: string, play: PlayDefinition) => {
    setAnalyzedPlays(prev => {
      const newMap = new Map(prev);
      newMap.set(id, play);
      return newMap;
    });
  }, []);

  const addAnalyzedPlays = useCallback((plays: PlayDefinition[]) => {
    setAnalyzedPlays(prev => {
      const newMap = new Map(prev);
      plays.forEach(play => {
        newMap.set(play.id, play);
      });
      return newMap;
    });
  }, []);

  const clearAnalyzedPlays = useCallback(() => {
    setAnalyzedPlays(new Map());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear analyzed plays from storage:', error);
    }
  }, []);

  const hasAnalyzedPlay = useCallback((id: string): boolean => {
    return analyzedPlays.has(id);
  }, [analyzedPlays]);

  const value: PlaysContextType = {
    analyzedPlays,
    getAnalyzedPlay,
    getAllAnalyzedPlays,
    addAnalyzedPlay,
    addAnalyzedPlays,
    clearAnalyzedPlays,
    hasAnalyzedPlay,
  };

  return (
    <PlaysContext.Provider value={value}>
      {children}
    </PlaysContext.Provider>
  );
}

export function usePlays() {
  const context = useContext(PlaysContext);
  if (context === undefined) {
    throw new Error('usePlays must be used within a PlaysProvider');
  }
  return context;
}
