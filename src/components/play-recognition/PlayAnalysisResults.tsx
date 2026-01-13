import React from 'react';

interface Position {
  alignment?: string;
  landmark?: string;
  assignment?: string;
  read?: string;
  adjustments?: {
    vsMan?: string;
    vsZone?: string;
    vsBlitz?: string;
  };
  routeId?: string;
  depth?: number;
}

interface PlayAnalysis {
  name: string;
  shortName?: string;
  formation: string;
  playType: 'pass' | 'run' | 'rpo' | 'screen';
  concept: string;
  description: string;
  keyPoints: string[];
  bestAgainst: string[];
  positions: Record<string, Position>;
  analyzedAt?: string;
}

interface PlayAnalysisResultsProps {
  analysis: PlayAnalysis;
  onClose: () => void;
}

export const PlayAnalysisResults: React.FC<PlayAnalysisResultsProps> = ({ analysis, onClose }) => {
  const getPlayTypeColor = (type: string) => {
    switch (type) {
      case 'pass': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'run': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'rpo': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'screen': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-b from-[#0f1419] to-[#0A0F12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0A0F12]/95 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white">{analysis.name}</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${getPlayTypeColor(analysis.playType)}`}>
                  {analysis.playType}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {analysis.formation} • {analysis.concept}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-2">
              Play Description
            </h3>
            <p className="text-white">{analysis.description}</p>
          </div>

          {/* Key Points and Best Against */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Points */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-3">
                Key Points
              </h3>
              <ul className="space-y-2">
                {analysis.keyPoints?.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white text-sm">
                    <span className="text-[var(--neon-teal)] mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best Against */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-3">
                Best Against
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.bestAgainst?.map((coverage, idx) => (
                  <span
                    key={idx}
                    className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg text-sm"
                  >
                    {coverage}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Position Assignments */}
          <div>
            <h3 className="text-sm font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-4">
              Position Assignments & Testing Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(analysis.positions || {}).map(([position, data]) => (
                <div
                  key={position}
                  className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-xl p-5 hover:border-[var(--neon-teal)]/30 transition-all"
                >
                  {/* Position Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--neon-teal)]/10 border border-[var(--neon-teal)]/30 flex items-center justify-center">
                      <span className="text-[var(--neon-teal)] font-bold text-lg">{position}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg">{position}</h4>
                      {data.routeId && (
                        <p className="text-slate-400 text-sm">
                          {data.routeId} {data.depth && `• ${data.depth} yards`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {data.alignment && (
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Alignment</span>
                        <p className="text-white text-sm mt-1">{data.alignment}</p>
                      </div>
                    )}
                    {data.landmark && (
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Landmark</span>
                        <p className="text-white text-sm mt-1">{data.landmark}</p>
                      </div>
                    )}
                    {data.assignment && (
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Assignment</span>
                        <p className="text-white text-sm mt-1">{data.assignment}</p>
                      </div>
                    )}
                    {data.read && (
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Read</span>
                        <p className="text-white text-sm mt-1">{data.read}</p>
                      </div>
                    )}
                  </div>

                  {/* Coverage Adjustments - Testing Scenarios */}
                  {data.adjustments && (
                    <div className="border-t border-white/10 pt-4">
                      <h5 className="text-xs font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-3">
                        Testing Scenarios
                      </h5>
                      <div className="space-y-3">
                        {data.adjustments.vsMan && (
                          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                            <span className="text-xs font-bold text-orange-400 uppercase block mb-1">
                              vs Man Coverage
                            </span>
                            <p className="text-white text-sm">{data.adjustments.vsMan}</p>
                          </div>
                        )}
                        {data.adjustments.vsZone && (
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                            <span className="text-xs font-bold text-blue-400 uppercase block mb-1">
                              vs Zone Coverage
                            </span>
                            <p className="text-white text-sm">{data.adjustments.vsZone}</p>
                          </div>
                        )}
                        {data.adjustments.vsBlitz && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                            <span className="text-xs font-bold text-red-400 uppercase block mb-1">
                              vs Blitz
                            </span>
                            <p className="text-white text-sm">{data.adjustments.vsBlitz}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0A0F12]/95 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">
              {analysis.analyzedAt && `Analyzed ${new Date(analysis.analyzedAt).toLocaleString()}`}
            </p>
            <button
              onClick={onClose}
              className="bg-[var(--neon-teal)] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#00d4c5] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
