import React from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  fileName: string;
  onBack: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, fileName, onBack }) => {
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
          <p className="text-slate-400 text-sm">PDF Document</p>
        </div>

        <a
          href={pdfUrl}
          download={fileName}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all"
          title="Download PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
      </div>

      {/* PDF Display Area */}
      <div className="flex-1 mt-20 mb-6 mx-6 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
        <iframe
          src={pdfUrl}
          className="w-full h-full"
          title={fileName}
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 flex justify-center gap-4 bg-gradient-to-t from-black/90 to-transparent">
        <button className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Extract Pages
        </button>

        <button className="flex items-center gap-2 bg-[var(--neon-teal)] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#00d4c5] transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Analyze Playbook
        </button>
      </div>
    </div>
  );
};
