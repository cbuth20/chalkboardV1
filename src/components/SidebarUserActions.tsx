"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";

export function SidebarUserActions() {
  const { mode, setMode } = useMode();
  const { user, signOut, userRole, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canUseCoachMode = userRole === "coach" || userRole === "admin";

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    const email = user.email;
    return email.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Enforce: players cannot stay in coach mode or coach routes
  useEffect(() => {
    if (canUseCoachMode) return;

    const coachRoutes = ['/play-recognition', '/coach'];
    const isCoachRoute = coachRoutes.some(route => pathname.startsWith(route));

    if (mode === "coach") {
      setMode("player");
      if (isCoachRoute) {
        router.push("/playbook");
      }
    } else if (isCoachRoute) {
      router.push("/playbook");
    }
  }, [canUseCoachMode, mode, pathname, router, setMode]);

  const handleModeChange = (newMode: "player" | "coach") => {
    if (!canUseCoachMode) {
      // Players cannot switch modes
      return;
    }
    setMode(newMode);
    setIsDropdownOpen(false);

    // Define coach-specific routes
    const coachRoutes = ['/play-recognition', '/coach/team', '/coach/assignments', '/coach/games'];

    // Define player-specific routes
    const playerRoutes = ['/playbook', '/games/assignment', '/team', '/settings', '/film-room', '/games', '/ai-coach'];

    // Check if current path is a coach or player route
    const isCoachRoute = coachRoutes.some(route => pathname.startsWith(route));
    const isPlayerRoute = playerRoutes.some(route => pathname.startsWith(route));

    // Navigate to appropriate default route when switching modes
    if (newMode === 'coach' && isPlayerRoute) {
      // Switching to coach mode while on a player page - go to Scanner (default coach page)
      router.push('/play-recognition');
    } else if (newMode === 'player' && isCoachRoute) {
      // Switching to player mode while on a coach page - go to Playbook (default player page)
      router.push('/playbook');
    }
  };

  return (
    <div className="relative px-4 pt-4 pb-2 border-b border-[#1B1E20]/80" ref={dropdownRef}>
      {/* User Info Button - Full width in sidebar */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20]/50 hover:bg-[#1B1E20] transition-all"
      >
        {/* Avatar */}
        {profile?.avatarUrl ? (
          <div className="h-10 w-10 rounded-full overflow-hidden bg-[#1B1E20] border border-white/10 flex-shrink-0">
            <img
              src={profile.avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
              onError={(e) => {
                // fallback to initials if the image fails
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-200">
              {getUserInitials()}
            </div>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00F6E5] to-[#3DF3FF] text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#00F6E5]/20 flex-shrink-0">
            {getUserInitials()}
          </div>
        )}

        {/* User Info */}
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-medium text-white truncate">
            {user?.email}
          </p>
          {canUseCoachMode ? (
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
              {mode === "player" ? "Player Mode" : "Coach Mode"}
            </p>
          ) : (
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
              Account
            </p>
          )}
        </div>

        {/* Dropdown indicator */}
        <ChevronIcon
          className={`h-4 w-4 text-slate-500 transition-transform flex-shrink-0 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - Positioned to the right of sidebar */}
      {isDropdownOpen && (
        <div className="absolute left-full ml-2 top-0 w-56 rounded-lg border border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl shadow-xl shadow-black/50 animate-fade-in z-[60]">
          <div className="p-2">
            {canUseCoachMode && (
              <>
                {/* Mode Switcher Header */}
                <div className="px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Switch Mode
                  </p>
                </div>

                {/* Mode Options */}
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => handleModeChange("player")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === "player"
                        ? "bg-[#00F6E5]/10 text-[#00F6E5]"
                        : "text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
                    }`}
                  >
                    <PlayerIcon
                      className={`h-4 w-4 ${
                        mode === "player" ? "text-[#00F6E5]" : "text-slate-500"
                      }`}
                    />
                    <span>Player Mode</span>
                    {mode === "player" && (
                      <CheckIcon className="ml-auto h-4 w-4 text-[#00F6E5]" />
                    )}
                  </button>

                  <button
                    onClick={() => handleModeChange("coach")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === "coach"
                        ? "bg-[#00F6E5]/10 text-[#00F6E5]"
                        : "text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
                    }`}
                  >
                    <CoachIcon
                      className={`h-4 w-4 ${
                        mode === "coach" ? "text-[#00F6E5]" : "text-slate-500"
                      }`}
                    />
                    <span>Coach Mode</span>
                    {mode === "coach" && (
                      <CheckIcon className="ml-auto h-4 w-4 text-[#00F6E5]" />
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Account */}
            <div className={`${canUseCoachMode ? 'mt-2 pt-2 border-t border-[#1B1E20]' : 'mt-1'}`}>
              <div className="px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Account
                </p>
              </div>

              <button
                onClick={() => {
                  router.push('/settings');
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
              >
                <SettingsIcon className="h-4 w-4 text-slate-500" />
                <span>Account settings</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="mt-2 pt-2 border-t border-[#1B1E20]">
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
              >
                <SignOutIcon className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function ChevronIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PlayerIcon({ className }: { className?: string }) {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CoachIcon({ className }: { className?: string }) {
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6" />
      <path d="M17 20.66A9 9 0 1 1 20.66 17" />
    </svg>
  );
}
