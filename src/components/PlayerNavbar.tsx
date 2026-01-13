"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { name: "PLAYBOOK", href: "/playbook", icon: PlaybookIcon, disabled: false },
  { name: "FILM ROOM", href: "/film-room", icon: FilmRoomIcon, disabled: true },
  { name: "GAMES", href: "/games", icon: GamesIcon, disabled: true },
  { name: "ASSIGNMENTS", href: "/games/assignment", icon: AssignmentIcon, disabled: false },
  { name: "CHALK TALK", href: "/ai-coach", icon: AICoachIcon, disabled: false },
];

export default function PlayerNavbar() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1B1E20]/80 bg-[#0A0A0A]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-6">
        {/* Left Section: Logo + Status */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/20 transition-shadow group-hover:shadow-[#00F6E5]/40">
              <LightningIcon className="h-5 w-5 text-[#0A0A0A]" />
            </div>
            <span className="text-xl font-bold tracking-wide text-white">
              CHALKBOARD
            </span>
          </Link>

          {/* Status + Time */}
          <div className="hidden items-center gap-3 rounded-full border border-[#1B1E20] bg-[#1B1E20]/50 px-4 py-1.5 md:flex">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00F6E5] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00F6E5]"></span>
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                System Online
              </span>
            </div>
            <div className="h-4 w-px bg-[#1B1E20]"></div>
            <span className="font-mono text-sm font-medium text-slate-300">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Center Section: Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/playbook" && pathname === "/") ||
              (item.href === "/games" && pathname === "/games") ||
              (item.href === "/games/assignment" && pathname === "/games/assignment");

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide cursor-not-allowed opacity-50"
                  title="Coming Soon"
                >
                  <item.icon className="h-4 w-4 text-slate-600" />
                  {item.name}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block whitespace-nowrap rounded-md bg-[#1B1E20] px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg">
                    Coming Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                  isActive
                    ? "bg-[#00F6E5]/10 text-[#00F6E5]"
                    : "text-slate-400 hover:bg-[#1B1E20]/50 hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#00F6E5]" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                {item.name}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#00F6E5] shadow-[0_0_8px_rgba(0,246,229,0.6)]"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          <button className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00F6E5] to-[#3DF3FF] text-sm font-bold text-[#0A0A0A] shadow-lg shadow-[#00F6E5]/20 transition-shadow hover:shadow-[#00F6E5]/40">
            DF
          </button>
        </div>
      </div>
    </header>
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

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
