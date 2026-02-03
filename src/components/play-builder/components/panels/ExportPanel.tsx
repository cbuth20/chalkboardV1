import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface ExportPanelProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onCopyToClipboard: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onExportPNG,
  onExportSVG,
  onCopyToClipboard,
}) => {
  return (
    <div className="space-y-3">
      {/* Export as PNG */}
      <button
        onClick={onExportPNG}
        className="w-full px-4 py-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition text-left"
      >
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <div>
            <div className="text-sm font-semibold text-white">Export as PNG</div>
            <div className="text-xs text-slate-400">High quality image</div>
          </div>
        </div>
      </button>

      {/* Export as SVG */}
      <button
        onClick={onExportSVG}
        className="w-full px-4 py-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition text-left"
      >
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div>
            <div className="text-sm font-semibold text-white">Export as SVG</div>
            <div className="text-xs text-slate-400">Vector format</div>
          </div>
        </div>
      </button>

      {/* Copy to Clipboard */}
      <button
        onClick={onCopyToClipboard}
        className="w-full px-4 py-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition text-left"
      >
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          <div>
            <div className="text-sm font-semibold text-white">Copy to Clipboard</div>
            <div className="text-xs text-slate-400">Paste into any app</div>
          </div>
        </div>
      </button>
    </div>
  );
};
