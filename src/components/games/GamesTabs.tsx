"use client";

export type GamesTab = 'flashcards' | 'formations' | 'rb-protection';

interface GamesTabsProps {
  activeTab: GamesTab;
  onTabChange: (tab: GamesTab) => void;
  className?: string;
}

const TABS = [
  {
    id: 'flashcards' as GamesTab,
    label: 'Flashcards',
    icon: '🎴',
    description: 'Quiz-style learning games',
  },
  {
    id: 'formations' as GamesTab,
    label: 'Formation Trainer',
    icon: '📐',
    description: 'Learn offensive formations',
  },
  {
    id: 'rb-protection' as GamesTab,
    label: 'RB Protection',
    icon: '⚡',
    description: 'Master protection assignments',
  },
];

export function GamesTabs({ activeTab, onTabChange, className = '' }: GamesTabsProps) {
  return (
    <div className={`flex items-center gap-2 border-b border-[#2A2F33] pb-2 ${className}`}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isActive
                ? 'bg-[#00F6E5]/10 text-[#00F6E5] border border-[#00F6E5]/30'
                : 'text-slate-400 hover:text-white hover:bg-[#1B1E20]'
            }`}
            title={tab.description}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
