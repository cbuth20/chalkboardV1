import React, { useState, useRef, useEffect } from 'react';

interface ScanPlayScreenProps {
  onScanComplete: (image: string) => void;
  onBack: () => void;
}

export const ScanPlayScreen: React.FC<ScanPlayScreenProps> = ({ onScanComplete, onBack }) => {
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Simulate camera flash/shutter effect
  const handleCapture = () => {
    setIsScanning(true);
    // Simulate processing delay
    setTimeout(() => {
      onScanComplete('mock-captured-image-url'); 
    }, 1500);
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
        <button 
          onClick={() => setIsFlashOn(!isFlashOn)}
          className={`p-2 rounded-full backdrop-blur-md border transition-all ${isFlashOn ? 'bg-[var(--neon-teal)] text-black border-[var(--neon-teal)]' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2Z"/><line x1="12" x2="12" y1="2" y2="22"/>
          </svg>
        </button>
      </div>

      {/* Camera Viewport Area */}
      <div className="flex-1 relative bg-slate-900">
        {/* Simulated Camera Feed Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563207153-f403bf289096?q=80&w=2942&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
        
        {/* Scanning Overlay (Scanner Line) */}
        {isScanning && (
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[var(--neon-teal)]/20 to-transparent h-32 w-full animate-[scanner-line_1.5s_linear_infinite]"></div>
        )}

        {/* Framing Guides */}
        <div className="absolute inset-8 z-10 pointer-events-none">
          {/* Neon Borders */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[var(--neon-teal)] rounded-tl-xl shadow-[0_0_15px_var(--neon-teal)]"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[var(--neon-teal)] rounded-tr-xl shadow-[0_0_15px_var(--neon-teal)]"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[var(--neon-teal)] rounded-bl-xl shadow-[0_0_15px_var(--neon-teal)]"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[var(--neon-teal)] rounded-br-xl shadow-[0_0_15px_var(--neon-teal)]"></div>
          
          {/* Center Instruction */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
            <p className="text-[var(--ice-blue)] text-lg font-medium tracking-wider drop-shadow-lg animate-pulse">
              ALIGN PLAY INSIDE FRAME
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-48 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 w-full z-20 flex flex-col justify-end pb-12 items-center">
        
        <div className="flex items-center justify-around w-full max-w-md px-8">
          {/* Import Button */}
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-400 tracking-wider">IMPORT</span>
          </button>

          {/* Shutter Button */}
          <button 
            onClick={handleCapture}
            className="relative group transition-transform active:scale-95"
          >
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center relative">
              <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
            </div>
          </button>

          {/* Tips Button */}
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-400 tracking-wider">TIPS</span>
          </button>
        </div>
      </div>
    </div>
  );
};





