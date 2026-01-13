"use client";

// ═══════════════════════════════════════════════════════════════════════════
// USER ACTIONS — Shared component for user avatar and mode dropdown
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";

export function UserActions() {
  const { mode, setMode } = useMode();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleModeChange = (newMode: "player" | "coach") => {
    setMode(newMode);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00F6E5] to-[#3DF3FF] text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#00F6E5]/20 transition-shadow hover:shadow-[#00F6E5]/40"
      >
        {getUserInitials()}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl shadow-xl shadow-black/50 animate-fade-in">
          <div className="p-2">
            {/* User Info */}
            <div className="px-3 py-2 border-b border-[#1B1E20]">
              <p className="text-xs font-medium text-white truncate">
                {user?.email}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                {mode === "player" ? "Player Mode" : "Coach Mode"}
              </p>
            </div>

            {/* Mode Switcher Header */}
            <div className="px-3 py-2 mt-1">
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

            {/* Sign Out */}
            <div className="mt-2 pt-2 border-t border-[#1B1E20]">
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/login');
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
