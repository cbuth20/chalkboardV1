"use client";

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE TABS — Navigation tabs for different Chalk Talk domains
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";

export type KnowledgeTab =
  | "general"
  | "terminology"
  | "assignments"
  | "coverages"
  | "fronts"
  | "routes"
  | "playbook"
  | "film-room"
  | "games";

interface KnowledgeTabsProps {
  activeTab: KnowledgeTab;
  onTabChange: (tab: KnowledgeTab) => void;
  className?: string;
}

const TABS: { id: KnowledgeTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "general",
    label: "General",
    icon: <GeneralIcon />,
    description: "Ask anything football-related",
  },
  {
    id: "terminology",
    label: "Terminology",
    icon: <TerminologyIcon />,
    description: "NFL terms, play calls, and systems",
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: <AssignmentsIcon />,
    description: "Position-specific responsibilities",
  },
  {
    id: "coverages",
    label: "Coverages",
    icon: <CoveragesIcon />,
    description: "Coverage recognition and keys",
  },
  {
    id: "fronts",
    label: "Fronts",
    icon: <FrontsIcon />,
    description: "Defensive fronts and pressures",
  },
  {
    id: "routes",
    label: "Routes",
    icon: <RoutesIcon />,
    description: "Route techniques and concepts",
  },
  {
    id: "playbook",
    label: "Playbook",
    icon: <PlaybookIcon />,
    description: "Team plays and installs",
  },
  {
    id: "film-room",
    label: "Film Room",
    icon: <FilmRoomIcon />,
    description: "Film study and breakdowns",
  },
  {
    id: "games",
    label: "Games",
    icon: <GamesIcon />,
    description: "Help during study games",
  },
];

export function KnowledgeTabs({
  activeTab,
  onTabChange,
  className = "",
}: KnowledgeTabsProps) {
  const [showTooltip, setShowTooltip] = useState<KnowledgeTab | null>(null);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tabs Container */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setShowTooltip(tab.id)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg
                text-xs font-semibold uppercase tracking-wide
                transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? "bg-[#00F6E5]/10 text-[#00F6E5] border border-[#00F6E5]/30"
                    : "text-slate-400 hover:text-white hover:bg-[#1B1E20]"
                }`}
            >
              <span className="h-3.5 w-3.5">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>

              {/* Active Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[#00F6E5] shadow-[0_0_8px_rgba(0,246,229,0.6)]" />
              )}

              {/* Tooltip */}
              {showTooltip === tab.id && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
                  px-3 py-2 rounded-lg bg-[#1B1E20] border border-slate-700/50
                  text-[10px] text-slate-300 whitespace-nowrap shadow-xl
                  animate-fade-in pointer-events-none">
                  {tab.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB ICONS
// ═══════════════════════════════════════════════════════════════════════════

function GeneralIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function TerminologyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h4" />
    </svg>
  );
}

function AssignmentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function CoveragesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FrontsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
    </svg>
  );
}

function RoutesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function PlaybookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FilmRoomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function GamesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="12" x2="6" y2="12" strokeWidth={3} strokeLinecap="round" />
      <line x1="10" y1="12" x2="10" y2="12" strokeWidth={3} strokeLinecap="round" />
      <circle cx="17" cy="10" r="1" fill="currentColor" />
      <circle cx="17" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

export default KnowledgeTabs;

