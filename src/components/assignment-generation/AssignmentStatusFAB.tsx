"use client";

import { useAssignmentGeneration } from '@/contexts/AssignmentGenerationContext';

export function AssignmentStatusFAB() {
  const { isGenerating, isComplete, progress, error, navigateToAssignments } = useAssignmentGeneration();

  // Don't show if not generating and not complete
  if (!isGenerating && !isComplete && !error) {
    return null;
  }

  return (
    <button
      onClick={navigateToAssignments}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full px-6 py-4 shadow-2xl transition-all duration-300 ${
        error
          ? 'bg-red-500/90 hover:bg-red-500'
          : isComplete
          ? 'bg-green-500/90 hover:bg-green-500 hover:scale-105'
          : 'bg-[#00F6E5]/90 hover:bg-[#00F6E5]'
      } backdrop-blur-sm`}
    >
      {/* Icon/Status Indicator */}
      <div className="relative">
        {isGenerating && (
          <>
            {/* Spinning loader */}
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
            {/* Pulse effect */}
            <div className="absolute inset-0 animate-ping rounded-full bg-black opacity-20" />
          </>
        )}

        {isComplete && !error && (
          <svg className="h-6 w-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}

        {error && (
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Text Content */}
      <div className="text-left">
        <div className="text-sm font-bold text-black">
          {error ? (
            'Generation Failed'
          ) : isComplete ? (
            'Assignments Ready!'
          ) : (
            'Generating Assignments...'
          )}
        </div>
        {isGenerating && (
          <div className="text-xs text-black/70">
            {progress.current} / {progress.total} plays analyzed
          </div>
        )}
        {isComplete && (
          <div className="text-xs text-black/70">
            Click to view {progress.total} assignments
          </div>
        )}
        {error && (
          <div className="text-xs text-white/70">
            Click to retry
          </div>
        )}
      </div>

      {/* Progress Bar (only when generating) */}
      {isGenerating && progress.total > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-full bg-black/20">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}
    </button>
  );
}
