"use client";

// ═══════════════════════════════════════════════════════════════════════════
// COACH AVATAR — Clean minimal HUD avatar with modes and animations
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import type { CoachMode } from "@/lib/ai-coach/types";

interface CoachAvatarProps {
  mode: CoachMode;
  isProcessing?: boolean;
  statusMessage?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const MODE_CONFIG: Record<CoachMode, { label: string; icon: React.ReactNode; color: string }> = {
  teach: {
    label: "TEACH MODE",
    icon: <TeachIcon />,
    color: "#00F6E5",
  },
  quiz: {
    label: "QUIZ MODE",
    icon: <QuizIcon />,
    color: "#F5C253",
  },
  film: {
    label: "FILM MODE",
    icon: <FilmIcon />,
    color: "#3DF3FF",
  },
  draw: {
    label: "DRAW MODE",
    icon: <DrawIcon />,
    color: "#FF6A3D",
  },
  assist: {
    label: "ASSIST MODE",
    icon: <AssistIcon />,
    color: "#00F6E5",
  },
  analyze: {
    label: "ANALYZE MODE",
    icon: <AnalyzeIcon />,
    color: "#9B59B6",
  },
};

const SIZE_CONFIG = {
  sm: {
    container: "h-10 w-10",
    icon: "h-5 w-5",
    ring: "h-12 w-12",
    pulse: "h-14 w-14",
  },
  md: {
    container: "h-14 w-14",
    icon: "h-7 w-7",
    ring: "h-16 w-16",
    pulse: "h-20 w-20",
  },
  lg: {
    container: "h-20 w-20",
    icon: "h-10 w-10",
    ring: "h-24 w-24",
    pulse: "h-28 w-28",
  },
};

export function CoachAvatar({
  mode,
  isProcessing = false,
  statusMessage,
  size = "md",
  showLabel = true,
  className = "",
}: CoachAvatarProps) {
  const config = MODE_CONFIG[mode];
  const sizeConfig = SIZE_CONFIG[size];
  const [dots, setDots] = useState("");

  // Animate processing dots
  useEffect(() => {
    if (!isProcessing) {
      setDots("");
      return;
    }
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Avatar Container */}
      <div className="relative">
        {/* Outer Pulse Ring (when processing) */}
        {isProcessing && (
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeConfig.pulse} rounded-full animate-ping opacity-20`}
            style={{ backgroundColor: config.color }}
          />
        )}

        {/* Inner Glow Ring */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeConfig.ring} rounded-full`}
          style={{
            background: `radial-gradient(circle, ${config.color}20 0%, transparent 70%)`,
            boxShadow: isProcessing ? `0 0 30px ${config.color}40` : `0 0 15px ${config.color}20`,
            transition: "box-shadow 0.3s ease",
          }}
        />

        {/* Main Avatar Circle */}
        <div
          className={`relative ${sizeConfig.container} rounded-full flex items-center justify-center transition-all duration-300`}
          style={{
            background: `linear-gradient(135deg, ${config.color}30 0%, ${config.color}10 100%)`,
            border: `2px solid ${config.color}60`,
            boxShadow: `0 0 20px ${config.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          {/* Coach with Hat & Headset Icon */}
          <div style={{ color: config.color }} className={sizeConfig.icon}>
            <CoachHeadsetIcon />
          </div>

          {/* Processing Spinner Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 rounded-full">
              <svg className="h-full w-full animate-spin" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={config.color}
                  strokeWidth="2"
                  strokeDasharray="80 200"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Status Indicator Dot */}
        <div
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0A0A0A]"
          style={{
            backgroundColor: isProcessing ? config.color : "#22C55E",
            boxShadow: `0 0 8px ${isProcessing ? config.color : "#22C55E"}`,
          }}
        />
      </div>

      {/* Label & Status */}
      {showLabel && (
        <div className="flex flex-col">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {statusMessage && (
            <span className="text-sm text-slate-400">
              {statusMessage}
              {isProcessing && <span className="inline-block w-6">{dots}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE ICONS — Clean SF Symbol-style icons
// ═══════════════════════════════════════════════════════════════════════════

function TeachIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
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

function DrawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function AssistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="14.83" y1="9.17" x2="18.36" y2="5.64" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7v6" strokeLinecap="round" />
      <path d="M7 10h6" strokeLinecap="round" />
    </svg>
  );
}

// Coach figure with hat and headset
function CoachHeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-full w-full">
      {/* Head/Face outline */}
      <circle cx="12" cy="13" r="5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Coach cap/visor */}
      <path d="M6 10.5c0-3.5 2.5-6 6-6s6 2.5 6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5h14" strokeLinecap="round" strokeLinejoin="round" />
      {/* Cap brim */}
      <path d="M17 10.5l2.5 1" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Headset band over cap */}
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Left earpiece */}
      <rect x="2.5" y="11" width="3" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Right earpiece */}
      <rect x="18.5" y="11" width="3" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Microphone boom */}
      <path d="M5.5 15v2c0 .5.5 1 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mic */}
      <circle cx="9.5" cy="18" r="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default CoachAvatar;

