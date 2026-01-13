"use client";

// ═══════════════════════════════════════════════════════════════════════════
// USER ACTIONS — Shared component for user avatar and mode dropdown
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMode } from "@/contexts/ModeContext";

export function UserActions() {
  const { mode, setMode } = useMode();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        DF
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl shadow-xl shadow-black/50 animate-fade-in">
          <div className="p-2">
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#1B1E20]">
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
