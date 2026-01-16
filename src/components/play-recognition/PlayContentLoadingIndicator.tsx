'use client';

import React from 'react';
import { usePlayContentGeneration } from '@/contexts/PlayContentGenerationContext';

export const PlayContentLoadingIndicator: React.FC = () => {
  const { isGenerating, progress, error } = usePlayContentGeneration();

  if (!isGenerating && !error) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#0F1419] rounded-lg border border-[#1E2732] shadow-2xl p-8 max-w-md w-full mx-4">
        {error ? (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Generation Error</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#00D9FF] text-black font-semibold rounded-lg hover:bg-[#00B8DD] transition"
            >
              Reload Page
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Generating AI Content</h3>
              <p className="text-sm text-gray-400">
                Processing play {progress.current} of {progress.total}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-[#1A1F28] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#00D9FF] to-[#00F6E5] h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(0,246,229,0.5)]"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
              </div>
            </div>

            {/* Animated Spinner */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#00F6E5] border-t-transparent" />
              <span className="text-sm text-slate-400">Analyzing plays and generating content...</span>
            </div>

            {/* Info Text */}
            <div className="mt-6 p-4 bg-[#1A1F28] rounded-lg border border-[#1E2732]">
              <p className="text-xs text-gray-400 text-center">
                This may take a few minutes. Please don&apos;t close this window.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
