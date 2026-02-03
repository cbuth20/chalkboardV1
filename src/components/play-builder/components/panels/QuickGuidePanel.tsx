import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// QUICK GUIDE PANEL
// ═══════════════════════════════════════════════════════════════════════════

export interface QuickGuidePanelProps {
  isTouchDevice: boolean;
}

export const QuickGuidePanel: React.FC<QuickGuidePanelProps> = ({ isTouchDevice }) => {
  return (
    <div className="space-y-4">
      {/* Desktop Controls */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5] mb-2">Desktop</h4>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• <strong className="text-white">Double-click player</strong> to open player actions menu</li>
          <li>• <strong className="text-white">Click & drag</strong> from player to draw route</li>
          <li>• <strong className="text-white">Shift + drag</strong> player to move position</li>
          <li>• <strong className="text-white">Shift + scroll</strong> to zoom in/out at cursor</li>
          <li>• <strong className="text-white">Double-click field</strong> to reset zoom to 100%</li>
          <li>• <strong className="text-white">Scroll</strong> or <strong className="text-white">drag field</strong> to pan up/down</li>
        </ul>
      </div>

      {/* iPad/Touch Controls */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5] mb-2">iPad/Touch</h4>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• <strong className="text-white">Pinch</strong> to zoom in/out</li>
          <li>• <strong className="text-white">Double-tap field</strong> to reset zoom to 100%</li>
          <li>• <strong className="text-white">Drag field</strong> to pan up/down</li>
          <li>• Use <strong className="text-white">Touch Mode toggle</strong> (bottom left) to switch between:</li>
          <li className="pl-4">- <strong className="text-white">Draw mode:</strong> Tap & drag from player to draw route</li>
          <li className="pl-4">- <strong className="text-white">Move mode:</strong> Tap & drag to reposition players</li>
        </ul>
      </div>

      {/* General Tips */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F6E5] mb-2">General</h4>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• Use <strong className="text-white">Route Templates</strong> for quick routes</li>
          <li>• <strong className="text-white">Copy/paste</strong> routes between players</li>
          <li>• <strong className="text-white">Undo/redo</strong> buttons in bottom right corner</li>
          <li>• <strong className="text-white">Click outside panel</strong> to close it</li>
          <li>• <strong className="text-white">Export</strong> as PNG/SVG or copy to clipboard</li>
        </ul>
      </div>
    </div>
  );
};
