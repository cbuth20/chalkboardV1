"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarUserActions } from "./SidebarUserActions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { mode } = useMode();
  const { profile, membership, userRole } = useAuth();

  // Player navigation items - Team Content (coach-managed)
  const teamContentNavItems: NavItem[] = [
    { name: "TEAM PLAYBOOK", href: "/playbook", icon: PlaybookIcon },
    { name: "TEAM ACTIVITIES", href: "/activities", icon: ActivityIcon },
    { name: "GAMES", href: "/games", icon: GamesIcon },
    { name: "ASSIGNMENTS", href: "/games/assignment", icon: AssignmentIcon },
  ];

  // Player navigation items - Learning Center (player-created)
  const learningCenterNavItems: NavItem[] = [
    { name: "My Plays", href: "/learning-center", icon: LibraryIcon },
  ];

  // Coach navigation items (7 items)
  const coachNavItems: NavItem[] = [
    { name: "PLAYBOOK", href: "/coach/playbook", icon: PlaybookIcon },
    { name: "ACTIVITIES", href: "/coach/activities", icon: ActivityIcon },
    { name: "ASSIGNMENT LIBRARY", href: "/coach/assignments", icon: AssignmentLibraryIcon },
    { name: "TEAM", href: "/coach/team", icon: TeamIcon },
    { name: "LEADERBOARD", href: "/coach/leaderboard", icon: LeaderboardIcon },
    { name: "PERFORMANCE", href: "/coach/performance", icon: PerformanceIcon },
  ];

  const canUseCoachMode = userRole === 'coach' || userRole === 'admin';

  // Select navigation based on mode (players are always player nav)
  const navItems = canUseCoachMode && mode === "coach" ? coachNavItems : teamContentNavItems;
  const isPlayerMode = !canUseCoachMode || mode === "player";

  // Check if user is admin (role from profile or membership)
  const isAdmin = profile?.role === 'admin' || membership?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-r border-[#1B1E20]/80 flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-[#1B1E20]/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/20 transition-shadow group-hover:shadow-[#00F6E5]/40">
            <LightningIcon className="h-5 w-5 text-[#0A0A0A]" />
          </div>
          <span className="text-xl font-bold tracking-wide text-white">
            CHALKBOARD
          </span>
        </Link>
      </div>

      {/* UserActions section */}
      <SidebarUserActions />

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        {/* Team Content Section (for players) or Main Nav (for coaches) */}
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Team Learning Center
          </span>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/playbook" && pathname === "/") ||
              (item.href === "/games" && pathname === "/games") ||
              (item.href === "/games/assignment" && pathname === "/games/assignment") ||
              (item.href === "/activities" && pathname.startsWith("/activities")) ||
              (item.href === "/coach/activities" && pathname.startsWith("/coach/activities"));

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide cursor-not-allowed opacity-50"
                  title="Coming Soon"
                >
                  <item.icon className="h-5 w-5 text-slate-600" />
                  <span className="text-slate-600">{item.name}</span>
                  <span className="absolute left-full ml-4 hidden group-hover:block whitespace-nowrap rounded-md bg-[#1B1E20] px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg">
                    Coming Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-[#00F6E5]/10 text-[#00F6E5] border-l-4 border-[#00F6E5] -ml-[1px] pl-[15px]"
                    : "text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? "text-[#00F6E5]" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Learning Center Section - Only show for players in player mode */}
        {isPlayerMode && (
          <>
            {/* Divider with label */}
            <div className="mt-6 pt-4 border-t border-[#1B1E20]/80">
              <div className="px-4 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Personal Learning Center
                </span>
              </div>
              <div className="space-y-1">
                {learningCenterNavItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                        isActive
                          ? "bg-[#00F6E5]/10 text-[#00F6E5] border-l-4 border-[#00F6E5] -ml-[1px] pl-[15px]"
                          : "text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive ? "text-[#00F6E5]" : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Admin link - only visible to admins */}
        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-[#1B1E20]/80">
            <Link
              href="/admin/settings"
              className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                pathname === '/admin/settings'
                  ? "bg-[#00F6E5]/10 text-[#00F6E5] border-l-4 border-[#00F6E5] -ml-[1px] pl-[15px]"
                  : "text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
              }`}
            >
              <AdminIcon
                className={`h-5 w-5 ${
                  pathname === '/admin/settings' ? "text-[#00F6E5]" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span>ADMIN</span>
            </Link>
          </div>
        )}

        {/* Temporary Debug Info - Remove after fixing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-auto p-3 bg-red-500/10 border-t border-red-500/30">
            <div className="text-xs text-red-300 space-y-1">
              <div>P: {profile?.role || 'null'}</div>
              <div>M: {membership?.role || 'null'}</div>
              <div>Admin: {String(isAdmin)}</div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS — Clean, geometric, SF Symbol-style
// ═══════════════════════════════════════════════════════════════════════════

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function PlaybookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FilmRoomIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}

function GamesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="12" x2="6" y2="12" strokeWidth={3} strokeLinecap="round" />
      <line x1="10" y1="12" x2="10" y2="12" strokeWidth={3} strokeLinecap="round" />
      <circle cx="17" cy="10" r="1" fill="currentColor" />
      <circle cx="17" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function AICoachIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <path d="M12 4v-2" />
      <path d="M9 5l-1-1.5" />
      <path d="M15 5l1-1.5" />
    </svg>
  );
}

function AssignmentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
      <path d="M9 17h6" />
    </svg>
  );
}

function ScannerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 16v.01" />
      <line x1="12" y1="8" x2="12" y2="8" />
      <line x1="8" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AssignmentLibraryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="3" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
      <path d="M6 6v2m0 0v2m0-2h2m-2 0H4" />
      <path d="M16 6v2m0 0v2m0-2h2m-2 0h-2" />
    </svg>
  );
}

function LeaderboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8" />
      <path d="M12 21v-4" />
      <path d="M6 13H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
      <path d="M18 13h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <rect x="6" y="7" width="12" height="14" rx="1" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <line x1="12" y1="3" x2="12" y2="7" />
    </svg>
  );
}

function PerformanceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M7 10h.01" />
      <path d="M7 14h.01" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  );
}
