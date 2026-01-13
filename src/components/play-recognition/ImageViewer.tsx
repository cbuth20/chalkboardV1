import React from 'react';

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
  onBack: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, fileName, onBack }) => {
  return (
    <div className="relative h-full w-full bg-[#0A0F12] overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="text-center flex-1 px-4">
          <h2 className="text-white font-bold text-lg tracking-wide truncate">{fileName}</h2>
          <p className="text-slate-400 text-sm">Image</p>
        </div>

        <div className="w-10"></div>
      </div>

      {/* Image Display Area */}
      <div className="flex-1 flex items-center justify-center p-20 overflow-auto">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 flex justify-center gap-4 bg-gradient-to-t from-black/90 to-transparent">
        <button className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>

        <button className="flex items-center gap-2 bg-[var(--neon-teal)] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#00d4c5] transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Analyze Play
        </button>
      </div>
    </div>
  );
};
