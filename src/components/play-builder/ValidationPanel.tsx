'use client';

import { AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
  playerId?: string;
}

interface ValidationPanelProps {
  warnings: ValidationWarning[];
  isValid: boolean;
  onPlayerClick?: (playerId: string) => void;
}

export function ValidationPanel({ warnings, isValid, onPlayerClick }: ValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const errors = warnings.filter(w => w.type === 'error');
  const warningsOnly = warnings.filter(w => w.type === 'warning');

  if (isValid && warnings.length === 0) {
    return (
      <div className="bg-[#0D1117] border border-green-800/50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-green-500">Play is ready to finalize</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              All players have assignments and responsibilities. No validation errors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0D1117] border rounded-lg ${
      errors.length > 0 ? 'border-red-800/50' : 'border-yellow-800/50'
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#161B22] transition-colors"
      >
        <div className="flex items-center gap-3">
          {errors.length > 0 ? (
            <AlertCircle className="text-red-500" size={20} />
          ) : (
            <AlertTriangle className="text-yellow-500" size={20} />
          )}
          <div className="text-left">
            <h3 className={`text-sm font-semibold ${
              errors.length > 0 ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {errors.length > 0 ? 'Validation Errors' : 'Validation Warnings'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {errors.length > 0 && `${errors.length} error${errors.length !== 1 ? 's' : ''}`}
              {errors.length > 0 && warningsOnly.length > 0 && ', '}
              {warningsOnly.length > 0 && `${warningsOnly.length} warning${warningsOnly.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {/* Warnings List */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4 space-y-3">
          {/* Errors */}
          {errors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">
                Errors (Must Fix)
              </h4>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg bg-red-900/10 border border-red-800/30 ${
                      error.playerId && onPlayerClick ? 'cursor-pointer hover:bg-red-900/20' : ''
                    }`}
                    onClick={() => error.playerId && onPlayerClick?.(error.playerId)}
                  >
                    <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">{error.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warningsOnly.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wide">
                Warnings (Recommended)
              </h4>
              <div className="space-y-2">
                {warningsOnly.map((warning, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg bg-yellow-900/10 border border-yellow-800/30 ${
                      warning.playerId && onPlayerClick ? 'cursor-pointer hover:bg-yellow-900/20' : ''
                    }`}
                    onClick={() => warning.playerId && onPlayerClick?.(warning.playerId)}
                  >
                    <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">{warning.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-4 p-3 bg-[#161B22] border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 leading-relaxed">
              {errors.length > 0 ? (
                <>
                  <span className="text-red-400 font-medium">Cannot finalize:</span> Fix all errors before
                  finalizing this play. Errors prevent the play from being saved.
                </>
              ) : (
                <>
                  <span className="text-yellow-400 font-medium">Can finalize:</span> Warnings are optional
                  improvements but won't prevent finalization.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
