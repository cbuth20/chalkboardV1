"use client";

import React, { useState, useEffect } from 'react';
import { playerGamesAPI, GameFilters } from '@/lib/api/player-games';

interface GameConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (filters: GameFilters, questionCount: number, timeLimitSeconds?: number) => void;
  onSaveAsCustom: (name: string, filters: GameFilters, config: any) => void;
  defaultCategory?: string;
  defaultFilters?: GameFilters;
}

export function GameConfigModal({
  isOpen,
  onClose,
  onStart,
  onSaveAsCustom,
  defaultCategory = 'coverage_blitz',
  defaultFilters = {},
}: GameConfigModalProps) {
  const [position, setPosition] = useState<string>('all');
  const [difficulties, setDifficulties] = useState({
    beginner: true,
    intermediate: true,
    advanced: true,
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [sourcePlayMode, setSourcePlayMode] = useState<'all' | 'specific' | 'recent'>('all');
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch available question count when filters change
  useEffect(() => {
    if (isOpen) {
      updateAvailableQuestions();
    }
  }, [isOpen, position, difficulties, sourcePlayMode, selectedPlays]);

  const updateAvailableQuestions = async () => {
    setLoading(true);
    try {
      const filters = buildFilters();
      const result = await playerGamesAPI.getAvailableQuestions(
        position !== 'all' ? { position } : {}
      );
      setAvailableQuestions(result.total);
    } catch (error) {
      console.error('Failed to fetch available questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFilters = (): GameFilters => {
    const filters: GameFilters = {
      ...defaultFilters,
    };

    if (position !== 'all') {
      filters.positions = [position];
    }

    const selectedDifficulties = Object.entries(difficulties)
      .filter(([_, selected]) => selected)
      .map(([level]) => level);

    if (selectedDifficulties.length > 0) {
      filters.difficulty = selectedDifficulties as any;
    }

    if (sourcePlayMode === 'specific' && selectedPlays.length > 0) {
      filters.playIds = selectedPlays;
    }

    return filters;
  };

  const handleStart = () => {
    const filters = buildFilters();
    onStart(filters, questionCount);
  };

  const handleSaveAsCustom = () => {
    const name = prompt('Enter a name for this custom game:');
    if (!name) return;

    const filters = buildFilters();
    onSaveAsCustom(name, filters, {
      questionCount,
      category: defaultCategory,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1B1E20] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#2A2F33]">
        {/* Header */}
        <div className="sticky top-0 bg-[#1B1E20] border-b border-[#2A2F33] px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Configure Your Game</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-[#0A0A0A] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Positions</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="X">X Receiver</option>
              <option value="Z">Z Receiver</option>
              <option value="H">H-Back</option>
              <option value="Y">Y Tight End</option>
              <option value="TE">Tight End</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Difficulty Levels
            </label>
            <div className="space-y-2">
              {Object.entries(difficulties).map(([level, checked]) => (
                <label key={level} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setDifficulties({ ...difficulties, [level]: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                  />
                  <span className="text-white capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Question Count
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full bg-[#0A0A0A] text-white px-4 py-3 rounded-lg border border-[#2A2F33] focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="5">5 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
              <option value="20">20 questions</option>
            </select>
          </div>

          {/* Source Plays */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Source Plays
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sourcePlayMode"
                  checked={sourcePlayMode === 'all'}
                  onChange={() => setSourcePlayMode('all')}
                  className="w-5 h-5 border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                />
                <span className="text-white">All my plays</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sourcePlayMode"
                  checked={sourcePlayMode === 'specific'}
                  onChange={() => setSourcePlayMode('specific')}
                  className="w-5 h-5 border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                />
                <span className="text-white">Specific plays</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sourcePlayMode"
                  checked={sourcePlayMode === 'recent'}
                  onChange={() => setSourcePlayMode('recent')}
                  className="w-5 h-5 border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                />
                <span className="text-white">Recent (7 days)</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#00F6E5]/10 border border-[#00F6E5]/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">
                {loading ? 'Counting...' : `${availableQuestions} questions match your filters`}
              </span>
              {availableQuestions < questionCount && (
                <span className="text-orange-400 text-sm">
                  Not enough questions
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1B1E20] border-t border-[#2A2F33] px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#2A2F33] text-white font-semibold rounded-lg hover:bg-[#3A3F43] transition"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSaveAsCustom}
              disabled={availableQuestions < questionCount}
              className="px-6 py-3 bg-[#2A2F33] text-white font-semibold rounded-lg hover:bg-[#3A3F43] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save as Custom
            </button>
            <button
              onClick={handleStart}
              disabled={availableQuestions < questionCount}
              className="px-6 py-3 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
