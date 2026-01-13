import React, { useState } from 'react';

interface DetectionPreviewProps {
  image: string;
  onRetake: () => void;
  onConfirm: () => void;
}

export const DetectionPreview: React.FC<DetectionPreviewProps> = ({ image, onRetake, onConfirm }) => {
  const [showRoutes, setShowRoutes] = useState(true);
  
  return (
    <div className="relative h-full w-full bg-[#0A0F12] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onRetake}
          className="px-4 py-2 rounded-lg bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-all font-medium text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
          RETAKE
        </button>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--neon-teal)]/30">
          <span className="text-[var(--neon-teal)] text-xs font-bold tracking-wider">AI DETECTED</span>
        </div>
      </div>

      {/* Image Preview Area */}
      <div className="relative flex-1 bg-slate-800 overflow-hidden">
        {/* The captured image (mocked) */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1563207153-f403bf289096?q=80&w=2942&auto=format&fit=crop')`, opacity: 0.8 }}
        ></div>

        {/* AI Overlay Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Mock Bounding Boxes & Labels */}
          {/* WR 1 */}
          <div className="absolute top-[30%] left-[15%] w-[8%] h-[8%] border-2 border-[var(--neon-teal)] rounded-md shadow-[0_0_10px_rgba(0,246,229,0.3)] animate-pulse">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--neon-teal)] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">WR X</div>
          </div>
          {/* WR 2 */}
          <div className="absolute top-[35%] right-[20%] w-[8%] h-[8%] border-2 border-[var(--neon-teal)] rounded-md shadow-[0_0_10px_rgba(0,246,229,0.3)] animate-pulse">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--neon-teal)] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">WR Z</div>
          </div>
          {/* QB */}
          <div className="absolute bottom-[20%] left-[48%] w-[8%] h-[8%] border-2 border-[var(--victory-gold)] rounded-md shadow-[0_0_10px_rgba(245,194,83,0.3)]">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--victory-gold)] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">QB</div>
          </div>

          {/* SVG Overlay for Routes */}
          {showRoutes && (
            <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 4px #00F6E5)' }}>
              {/* Route 1: Post */}
              <path 
                d="M 19% 30% L 19% 15% L 40% 5%" 
                fill="none" 
                stroke="#00F6E5" 
                strokeWidth="3" 
                strokeDasharray="6 4"
                className="animate-[draw-path_1s_ease-out_forwards]"
              />
              <circle cx="40%" cy="5%" r="3" fill="#00F6E5" />

              {/* Route 2: Out */}
              <path 
                d="M 80% 35% L 80% 20% L 95% 20%" 
                fill="none" 
                stroke="#00F6E5" 
                strokeWidth="3" 
                strokeDasharray="6 4"
                 className="animate-[draw-path_1s_ease-out_forwards]"
                 style={{ animationDelay: '0.2s' }}
              />
              <path d="M 92% 17% L 95% 20% L 92% 23%" fill="none" stroke="#00F6E5" strokeWidth="3" />
            </svg>
          )}
        </div>
      </div>

      {/* Bottom Sheet Results Panel */}
      <div className="bg-[var(--deep-space-black)] border-t border-white/10 p-6 z-20 rounded-t-3xl -mt-6 relative shadow-2xl">
        {/* Drag Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Trips Right <span className="text-[var(--neon-teal)]">Mesh</span>
            </h2>
            <div className="flex gap-2 mt-2">
              <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--neon-teal)]/10 text-[var(--neon-teal)] border border-[var(--neon-teal)]/30">
                98% CONFIDENCE
              </span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10">
                PASS PLAY
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowRoutes(!showRoutes)}
            className={`p-2 rounded-lg border transition-all ${showRoutes ? 'bg-[var(--neon-teal)]/20 border-[var(--neon-teal)] text-[var(--neon-teal)]' : 'bg-transparent border-white/20 text-slate-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>

        {/* Detected Elements Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--neon-teal)]/20 flex items-center justify-center text-[var(--neon-teal)] font-bold">
              3
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Receivers</div>
              <div className="text-sm font-semibold text-white">X, Z, Y</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--victory-gold)]/20 flex items-center justify-center text-[var(--victory-gold)] font-bold">
              1
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Backfield</div>
              <div className="text-sm font-semibold text-white">Offset Gun</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 py-3.5 rounded-xl border border-white/20 text-white font-bold bg-white/5 hover:bg-white/10 transition-colors uppercase tracking-wider text-sm">
            Edit Detection
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[var(--neon-teal)] to-[var(--ice-blue)] text-black font-bold shadow-[0_4px_14px_rgba(0,246,229,0.3)] hover:shadow-[0_6px_20px_rgba(0,246,229,0.4)] transition-all uppercase tracking-wider text-sm"
          >
            Confirm Play
          </button>
        </div>
      </div>
    </div>
  );
};





