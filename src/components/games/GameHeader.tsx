"use client";

import Link from "next/link";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  color?: "teal" | "orange" | "ice" | "gold";
}

export function GameHeader({
  title,
  subtitle,
  currentQuestion,
  totalQuestions,
  score,
  color = "teal",
}: GameHeaderProps) {
  const colorStyles = {
    teal: {
      accent: "text-[#00F6E5]",
      bg: "bg-[#00F6E5]/10 border-[#00F6E5]/30",
    },
    orange: {
      accent: "text-[#FF6A3D]",
      bg: "bg-[#FF6A3D]/10 border-[#FF6A3D]/30",
    },
    ice: {
      accent: "text-[#3DF3FF]",
      bg: "bg-[#3DF3FF]/10 border-[#3DF3FF]/30",
    },
    gold: {
      accent: "text-[#F5C253]",
      bg: "bg-[#F5C253]/10 border-[#F5C253]/30",
    },
  };

  const style = colorStyles[color];

  return (
    <div className="flex items-center justify-between">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-4">
        <Link
          href="/games"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#1B1E20]/80 text-slate-400 transition-all hover:border-slate-600 hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className={`text-xl font-black tracking-wide ${style.accent}`}>{title}</h1>
          {subtitle && <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4">
        {/* Question Counter */}
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${style.bg}`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Q</span>
          <span className={`font-mono text-lg font-bold ${style.accent}`}>
            {currentQuestion}/{totalQuestions}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 rounded-lg border border-[#F5C253]/30 bg-[#F5C253]/10 px-3 py-2">
          <StarIcon className="h-4 w-4 text-[#F5C253]" />
          <span className="font-mono text-lg font-bold text-[#F5C253]">{score}</span>
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}








