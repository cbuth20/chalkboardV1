import React, { useRef, useEffect } from 'react';
import type { FloatingPanelType } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING PANEL CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

export interface FloatingPanelContainerProps {
  activePanel: FloatingPanelType;
  onClose: () => void;
  children: React.ReactNode;
}

const PANEL_TITLES: Record<Exclude<FloatingPanelType, null>, string> = {
  info: 'Play Information',
  routes: 'Routes',
  templates: 'Route Templates',
  controls: 'Field Controls',
  export: 'Export & Share',
  assignments: 'Player Assignments',
  responsibilities: 'Player Responsibilities',
  'player-actions': 'Player Actions',
  guide: 'Quick Guide',
};

export const FloatingPanelContainer: React.FC<FloatingPanelContainerProps> = ({
  activePanel,
  onClose,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activePanel &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        // Don't close if clicking on the widget buttons
        !(event.target as HTMLElement).closest('button[data-widget-button]')
      ) {
        onClose();
      }
    };

    if (activePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePanel, onClose]);

  if (!activePanel) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="absolute top-2 right-12 sm:top-4 sm:right-16 md:top-8 md:right-24 z-10 w-72 sm:w-80 md:w-96 max-h-[calc(100%-1rem)] sm:max-h-[calc(100%-2rem)] md:max-h-[calc(100%-4rem)] rounded-lg bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#00F6E5]/20 shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B1E20]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#00F6E5]">
          {PANEL_TITLES[activePanel]}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};
