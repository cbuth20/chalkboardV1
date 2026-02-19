import React, { useMemo } from 'react';
import type { FloatingPanelType, PlayMode } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface WidgetBarProps {
  activePanel: FloatingPanelType;
  playMode: PlayMode;
  hasStructuredData: boolean;
  viewOnly: boolean;
  selectedPlayer: string | null;
  selectedPlayerLabel?: string;
  onPanelToggle: (panel: FloatingPanelType) => void;
}

interface WidgetButton {
  id: FloatingPanelType;
  title: string;
  icon: JSX.Element;
  condition?: boolean;
}

const WidgetBarComponent: React.FC<WidgetBarProps> = ({
  activePanel,
  playMode,
  hasStructuredData,
  viewOnly,
  selectedPlayer,
  selectedPlayerLabel,
  onPanelToggle,
}) => {
  // Memoize widget buttons to prevent recreation on every render
  const widgetButtons = useMemo<WidgetButton[]>(() => [
    {
      id: 'info',
      title: 'Play Information',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
    },
    {
      id: 'routes',
      title: 'Routes',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      condition: playMode === 'pass' && !viewOnly,
    },
    {
      id: 'templates',
      title: 'Route Templates',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
      condition: playMode === 'pass' && !viewOnly,
    },
    {
      id: 'controls',
      title: 'Field Controls',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
        </svg>
      ),
      condition: !viewOnly,
    },
    {
      id: 'export',
      title: 'Export & Share',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5m0 0l5 5m-5-5v12"/>
        </svg>
      ),
    },
    {
      id: 'assignments',
      title: 'Player Assignments',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      ),
      condition: hasStructuredData && !viewOnly,
    },
    {
      id: 'responsibilities',
      title: 'Player Responsibilities',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      ),
      condition: hasStructuredData && !viewOnly,
    },
    {
      id: 'guide',
      title: 'Quick Guide',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4m0-4h.01"/>
        </svg>
      ),
    },
  ], [playMode, hasStructuredData, viewOnly]);

  // Buttons that show player info
  const playerRelatedButtons = ['assignments', 'responsibilities', 'player-actions'];

  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-8 md:right-8 z-20 flex flex-col gap-1.5 sm:gap-2 max-h-[calc(100%-1rem)] sm:max-h-[calc(100%-2rem)] md:max-h-[calc(100%-4rem)] overflow-y-auto scrollbar-none">
      {widgetButtons.map((button) => {
        // Skip if condition is defined and false
        if (button.condition !== undefined && !button.condition) {
          return null;
        }

        const isActive = activePanel === button.id;
        const showPlayerBadge = selectedPlayer && playerRelatedButtons.includes(button.id);

        return (
          <div key={button.id} className="relative">
            <button
              onClick={() => onPanelToggle(button.id)}
              data-widget-button
              className={`p-2 sm:p-3 rounded-lg backdrop-blur-xl border shadow-lg transition ${
                isActive
                  ? 'bg-[#00F6E5]/20 border-[#00F6E5] text-[#00F6E5]'
                  : 'bg-[#0A0A0A]/95 border-[#00F6E5]/20 text-slate-400 hover:text-[#00F6E5]'
              }`}
              title={button.title}
            >
              {button.icon}
            </button>

            {/* Player selection indicator badge */}
            {showPlayerBadge && (
              <div className="absolute -top-1 -right-1 bg-[#00F6E5] text-[#0A0A0A] text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-lg border-2 border-[#0A0A0A]">
                {selectedPlayerLabel || '1'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const WidgetBar = React.memo(WidgetBarComponent);
WidgetBar.displayName = 'WidgetBar';
