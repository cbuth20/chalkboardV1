import React, { useState } from 'react';
import { PlayField } from '../playbook-diagram';
import { DiagramPlayer, DiagramRoute } from '../playbook-diagram/types';

interface DigitalPlayPreviewProps {
  onSave: () => void;
  onBack: () => void;
}

export const DigitalPlayPreview: React.FC<DigitalPlayPreviewProps> = ({ onSave, onBack }) => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Mock Data mimicking a detected play
  const offensePlayers: DiagramPlayer[] = [
    { id: 'q1', label: 'QB', side: 'offense', x: 50, y: 35 },
    { id: 'l1', label: 'LT', side: 'offense', x: 44, y: 30 },
    { id: 'l2', label: 'LG', side: 'offense', x: 47, y: 30 },
    { id: 'c1', label: 'C', side: 'offense', x: 50, y: 30 },
    { id: 'l3', label: 'RG', side: 'offense', x: 53, y: 30 },
    { id: 'l4', label: 'RT', side: 'offense', x: 56, y: 30 },
    { id: 'w1', label: 'X', side: 'offense', x: 10, y: 30 },
    { id: 'w2', label: 'Z', side: 'offense', x: 90, y: 30 },
    { id: 'w3', label: 'Y', side: 'offense', x: 80, y: 30 }, // Slot
    { id: 'r1', label: 'RB', side: 'offense', x: 50, y: 40 },
    { id: 't1', label: 'TE', side: 'offense', x: 59, y: 30 },
  ];

  const routes: DiagramRoute[] = [
    { 
      playerId: 'w1', 
      points: [{x: 10, y: 30}, {x: 10, y: 15}, {x: 25, y: 5}], 
      label: 'Post',
      color: '#00F6E5' 
    },
    { 
      playerId: 'w2', 
      points: [{x: 90, y: 30}, {x: 90, y: 15}, {x: 95, y: 15}], 
      label: 'Out',
      color: '#00F6E5' 
    },
    { 
      playerId: 'w3', 
      points: [{x: 80, y: 30}, {x: 80, y: 18}, {x: 50, y: 18}], 
      label: 'Drag',
      color: '#00F6E5' 
    },
  ];

  return (
    <div className="flex h-full bg-[#0A0F12]">
      {/* Left Sidebar - Properties */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-[#0A0F12]">
        <div className="p-6 border-b border-white/10">
          <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Detection
          </button>
          <h2 className="text-xl font-bold text-white mb-1">Play Properties</h2>
          <p className="text-xs text-slate-400">AI Recognized • 98% Match</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Formation */}
          <div>
            <label className="text-xs font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-2 block">Formation</label>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-[var(--neon-teal)]/50 transition-colors">
              <span className="text-white font-medium">Trips Right</span>
              <span className="text-xs text-slate-500 group-hover:text-[var(--neon-teal)]">EDIT</span>
            </div>
          </div>

          {/* Personnel */}
          <div>
            <label className="text-xs font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-2 block">Personnel</label>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex justify-between items-center group cursor-pointer hover:border-[var(--neon-teal)]/50 transition-colors">
              <span className="text-white font-medium">11 Personnel (1 RB, 1 TE)</span>
              <span className="text-xs text-slate-500 group-hover:text-[var(--neon-teal)]">EDIT</span>
            </div>
          </div>

          {/* Concepts */}
          <div>
            <label className="text-xs font-bold text-[var(--neon-teal)] uppercase tracking-wider mb-2 block">Concepts Detected</label>
            <div className="space-y-2">
              <div className="bg-[var(--neon-teal)]/10 rounded-lg p-3 border border-[var(--neon-teal)]/30 flex justify-between items-center">
                <span className="text-[var(--neon-teal)] font-medium">Mesh</span>
                <span className="text-xs font-bold text-[var(--neon-teal)]">98%</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex justify-between items-center opacity-50">
                <span className="text-slate-300 font-medium">Drive</span>
                <span className="text-xs font-bold text-slate-500">12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - Diagram */}
      <div className="flex-1 relative flex flex-col">
        {/* Toolbar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A0F12]/95 backdrop-blur z-10">
          <div className="flex items-center gap-4">
             <div className="bg-white/5 rounded-lg p-1 flex border border-white/10">
               <button className="px-3 py-1.5 rounded bg-[var(--neon-teal)] text-black font-bold text-xs uppercase">Editor</button>
               <button className="px-3 py-1.5 rounded text-slate-400 hover:text-white font-medium text-xs uppercase">Preview</button>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
             </button>
             <button onClick={onSave} className="px-4 py-2 rounded-lg bg-[var(--neon-teal)] text-black font-bold text-sm hover:bg-[#00d4c5] transition-colors shadow-[0_0_15px_rgba(0,246,229,0.2)]">
               Save to Library
             </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-black/40 p-8 flex items-center justify-center overflow-hidden">
           <div className="w-full h-full max-w-5xl max-h-[800px] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
             <PlayField 
                mode="pass" 
                offensePlayers={offensePlayers} 
                routes={routes} 
                viewBox={[0, 0, 100, 53.3]}
                className="w-full h-full"
                showLOS={true}
                losY={30}
             />
             
             {/* Overlay Controls */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 flex gap-4">
                <button className="text-slate-400 hover:text-[var(--neon-teal)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></button>
                <div className="w-px h-5 bg-white/20"></div>
                <button className="text-slate-400 hover:text-[var(--neon-teal)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg></button>
             </div>
           </div>
        </div>
      </div>

      {/* Right Sidebar - Route Editor */}
      <div className="w-80 border-l border-white/10 flex flex-col bg-[#0A0F12]">
         <div className="p-6 border-b border-white/10">
           <h2 className="text-xl font-bold text-white mb-1">Route Editor</h2>
           <p className="text-xs text-slate-400">Fine-tune detection results</p>
         </div>
         
         <div className="flex-1 p-6 space-y-4">
            <div className="p-4 rounded-xl border border-[var(--neon-teal)] bg-[var(--neon-teal)]/5 relative">
               <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--neon-teal)] shadow-[0_0_8px_var(--neon-teal)]"></div>
               <h3 className="font-bold text-white text-sm mb-1">WR (X) - Post</h3>
               <div className="flex gap-2 mt-3">
                  <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full w-3/4 bg-[var(--neon-teal)]"></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">12yds</span>
               </div>
               <div className="mt-4 flex gap-2">
                 <button className="flex-1 py-1.5 rounded bg-white/5 text-xs font-medium hover:bg-white/10 border border-white/5 text-slate-300">Flatten</button>
                 <button className="flex-1 py-1.5 rounded bg-white/5 text-xs font-medium hover:bg-white/10 border border-white/5 text-slate-300">Deepen</button>
               </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer opacity-60 hover:opacity-100">
               <h3 className="font-bold text-white text-sm mb-1">WR (Z) - Out</h3>
               <p className="text-xs text-slate-400">10 Yard break</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer opacity-60 hover:opacity-100">
               <h3 className="font-bold text-white text-sm mb-1">Slot (Y) - Drag</h3>
               <p className="text-xs text-slate-400">Crossing face</p>
            </div>
         </div>

         <div className="p-6 border-t border-white/10">
            <button className="w-full py-3 rounded-lg border border-[var(--ice-blue)] text-[var(--ice-blue)] font-bold uppercase text-xs tracking-wider hover:bg-[var(--ice-blue)]/10 transition-colors">
               Add New Route
            </button>
         </div>
      </div>
    </div>
  );
};





