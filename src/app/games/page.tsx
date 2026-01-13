"use client";

import PlayerNavbar from "@/components/PlayerNavbar";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — Football IQ Games
// ═══════════════════════════════════════════════════════════════════════════

const PLAYER_STATS = {
  name: "Demetric Felton",
  initials: "DF",
  position: "WR",
  team: "Cleveland Browns",
  level: 24,
  xp: 8750,
  xpToNextLevel: 10000,
  streak: 7,
  totalGames: 156,
  accuracy: 94,
  rank: 3,
  weeklyXp: 2340,
};

const GAMES = [
  {
    id: "coverage-recognition",
    title: "COVERAGE ID",
    subtitle: "Recognition Test",
    description: "Flash pre-snap looks and identify coverage schemes. Cov 1, 2, 3, 4, Quarters, Match, and more.",
    icon: "shield",
    color: "teal",
    difficulty: "ALL LEVELS",
    avgTime: "45s",
    plays: 25,
    accuracy: 92,
    streak: 5,
    isHot: true,
    isNew: false,
  },
  {
    id: "blitz-id",
    title: "BLITZ ID",
    subtitle: "Protection Challenge",
    description: "Read fronts and pressures. Call the right protection: Slide, Full Slide, Man, RB Scan.",
    icon: "flame",
    color: "orange",
    difficulty: "INTERMEDIATE",
    avgTime: "30s",
    plays: 20,
    accuracy: 88,
    streak: 3,
    isHot: false,
    isNew: true,
  },
  {
    id: "route-matching",
    title: "ROUTE TAG",
    subtitle: "Pattern Recognition",
    description: "Identify route tags and concepts. From basic slants to advanced Mesh and Mills.",
    icon: "route",
    color: "ice",
    difficulty: "ALL LEVELS",
    avgTime: "25s",
    plays: 30,
    accuracy: 96,
    streak: 12,
    isHot: false,
    isNew: false,
  },
  {
    id: "formation-memory",
    title: "FORMATION",
    subtitle: "Memory Game",
    description: "Study the formation for 10 seconds, then recreate it. Drag players to their positions.",
    icon: "grid",
    color: "gold",
    difficulty: "ADVANCED",
    avgTime: "60s",
    plays: 15,
    accuracy: 78,
    streak: 2,
    isHot: false,
    isNew: false,
  },
  {
    id: "play-responsibility",
    title: "ASSIGNMENT",
    subtitle: "Responsibility Quiz",
    description: "Position-specific play knowledge. What's your assignment on this play?",
    icon: "clipboard",
    color: "teal",
    difficulty: "TEAM SPECIFIC",
    avgTime: "40s",
    plays: 20,
    accuracy: 91,
    streak: 4,
    isHot: false,
    isNew: false,
  },
  {
    id: "red-zone-scenarios",
    title: "RED ZONE",
    subtitle: "Scenario Decisions",
    description: "Quick situational decisions inside the 20. Make the right read under pressure.",
    icon: "target",
    color: "orange",
    difficulty: "ADVANCED",
    avgTime: "35s",
    plays: 18,
    accuracy: 85,
    streak: 1,
    isHot: true,
    isNew: false,
  },
  {
    id: "two-minute-drill",
    title: "TWO-MINUTE",
    subtitle: "Mental Clock",
    description: "Clock management decisions under pressure. Timeouts, tempo, and optimal outcomes.",
    icon: "clock",
    color: "ice",
    difficulty: "ADVANCED",
    avgTime: "90s",
    plays: 10,
    accuracy: 82,
    streak: 0,
    isHot: false,
    isNew: true,
  },
  {
    id: "film-reaction",
    title: "FILM CLIP",
    subtitle: "Reaction Game",
    description: "Watch short clips and quickly identify the defense or answer strategic questions.",
    icon: "film",
    color: "gold",
    difficulty: "ALL LEVELS",
    avgTime: "20s",
    plays: 35,
    accuracy: 89,
    streak: 6,
    isHot: false,
    isNew: false,
  },
];

const DAILY_CHALLENGE = {
  title: "COVERAGE GAUNTLET",
  description: "Identify 15 coverage schemes in under 3 minutes. No mistakes allowed.",
  xpReward: 500,
  timeLimit: "3:00",
  difficulty: "EXPERT",
  completedToday: false,
  expiresIn: "14h 32m",
};

const LEADERBOARD = [
  { rank: 1, name: "Marcus Williams", position: "QB", xp: 12450, streak: 14, avatar: "MW" },
  { rank: 2, name: "Jamal Adams", position: "WR", xp: 11200, streak: 11, avatar: "JA" },
  { rank: 3, name: "Demetric Felton", position: "WR", xp: 8750, streak: 7, avatar: "DF", isYou: true },
  { rank: 4, name: "Tyler Boyd", position: "WR", xp: 8120, streak: 5, avatar: "TB" },
  { rank: 5, name: "Chris Olave", position: "WR", xp: 7890, streak: 9, avatar: "CO" },
  { rank: 6, name: "Garrett Wilson", position: "WR", xp: 7650, streak: 3, avatar: "GW" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function GamesPage() {
  const [mode, setMode] = useState<"train" | "compete">("train");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "coverage" | "routes" | "situational">("all");

  const xpProgress = (PLAYER_STATS.xp / PLAYER_STATS.xpToNextLevel) * 100;

  return (
    <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
      <PlayerNavbar />

      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
        {/* ═══════════════════════════════════════════════════════════════════
            TOP HUD BAR — Level, XP, Streak, Mode Toggle
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Player Stats HUD */}
          <div className="flex items-center gap-6">
            {/* Level Badge */}
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] shadow-lg shadow-[#00F6E5]/30">
                <span className="text-2xl font-black text-[#0A0A0A]">{PLAYER_STATS.level}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#F5C253] text-xs font-bold text-[#0A0A0A] shadow-lg">
                <StarIcon className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1 min-w-[200px]">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Level {PLAYER_STATS.level}
                </span>
                <span className="font-mono text-sm font-medium text-[#00F6E5]">
                  {PLAYER_STATS.xp.toLocaleString()} / {PLAYER_STATS.xpToNextLevel.toLocaleString()} XP
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#1B1E20] border border-[#00F6E5]/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00F6E5] to-[#3DF3FF] transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                >
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-4">
                <span className="text-xs text-slate-500">
                  <span className="text-[#F5C253] font-semibold">+{PLAYER_STATS.weeklyXp}</span> XP this week
                </span>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="hidden lg:flex items-center gap-3 rounded-xl border border-[#F5C253]/20 bg-[#F5C253]/5 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5C253]/15">
                <FireIcon className="h-5 w-5 text-[#F5C253]" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#F5C253]">{PLAYER_STATS.streak}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#F5C253]/70">Day Streak</div>
              </div>
            </div>

            {/* Accuracy */}
            <div className="hidden xl:flex items-center gap-3 rounded-xl border border-[#00F6E5]/20 bg-[#00F6E5]/5 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00F6E5]/15">
                <TargetIcon className="h-5 w-5 text-[#00F6E5]" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#00F6E5]">{PLAYER_STATS.accuracy}%</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#00F6E5]/70">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Right: Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex rounded-xl border border-[#1B1E20] bg-[#0A0A0A] p-1">
              {/* Sliding Background */}
              <div
                className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-gradient-to-r transition-all duration-300 ${
                  mode === "train"
                    ? "left-1 from-[#00F6E5] to-[#00d4c5]"
                    : "left-[calc(50%+2px)] from-[#FF6A3D] to-[#ff8a5c]"
                }`}
              />
              <button
                onClick={() => setMode("train")}
                className={`relative z-10 flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === "train" ? "text-[#0A0A0A]" : "text-slate-400 hover:text-white"
                }`}
              >
                <BrainIcon className="h-4 w-4" />
                Train
              </button>
              <button
                onClick={() => setMode("compete")}
                className={`relative z-10 flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === "compete" ? "text-[#0A0A0A]" : "text-slate-400 hover:text-white"
                }`}
              >
                <TrophyIcon className="h-4 w-4" />
                Compete
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            DAILY CHALLENGE BANNER
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-[#FF6A3D]/30">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6A3D]/10 via-[#0A0A0A] to-[#F5C253]/10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjRkY2QTNEIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Content */}
            <div className="flex items-start gap-5">
              {/* Pulse Icon */}
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6A3D] to-[#ff8a5c] shadow-lg shadow-[#FF6A3D]/30">
                <ZapIcon className="h-8 w-8 text-white" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F5C253] opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-[#F5C253]"></span>
                </span>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FF6A3D]">
                    Daily Challenge
                  </span>
                  <span className="rounded-full bg-[#F5C253]/15 border border-[#F5C253]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#F5C253]">
                    {DAILY_CHALLENGE.difficulty}
                  </span>
                </div>
                <h2 className="mb-2 text-2xl font-black tracking-tight text-white lg:text-3xl">
                  {DAILY_CHALLENGE.title}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-slate-400">
                  {DAILY_CHALLENGE.description}
                </p>
              </div>
            </div>

            {/* Right: Stats & CTA */}
            <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
              {/* Reward */}
              <div className="flex items-center gap-2 rounded-xl border border-[#F5C253]/20 bg-[#F5C253]/5 px-4 py-3">
                <StarIcon className="h-5 w-5 text-[#F5C253]" />
                <span className="font-mono text-lg font-bold text-[#F5C253]">+{DAILY_CHALLENGE.xpReward} XP</span>
              </div>

              {/* Time Limit */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-[#1B1E20]/50 px-4 py-3">
                <ClockIcon className="h-5 w-5 text-slate-400" />
                <span className="font-mono text-lg font-semibold text-white">{DAILY_CHALLENGE.timeLimit}</span>
              </div>

              {/* CTA Button */}
              <button className="btn-primary flex items-center gap-2 !px-8 !py-3.5 text-base shadow-lg shadow-[#00F6E5]/20 hover:shadow-[#00F6E5]/40">
                <PlayIcon className="h-5 w-5" />
                Start Challenge
              </button>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="border-t border-[#FF6A3D]/20 bg-[#0A0A0A]/50 px-6 py-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Expires in <span className="font-mono text-[#FF6A3D]">{DAILY_CHALLENGE.expiresIn}</span>
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FILTER TABS
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All Games", count: 8 },
            { key: "coverage", label: "Coverage & Blitz", count: 2 },
            { key: "routes", label: "Routes & Concepts", count: 3 },
            { key: "situational", label: "Situational", count: 3 },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as typeof selectedFilter)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all ${
                selectedFilter === filter.key
                  ? "bg-[#00F6E5]/15 text-[#00F6E5] border border-[#00F6E5]/30"
                  : "text-slate-400 hover:bg-[#1B1E20] hover:text-white border border-transparent"
              }`}
            >
              {filter.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  selectedFilter === filter.key
                    ? "bg-[#00F6E5]/20 text-[#00F6E5]"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            GAMES GRID + LEADERBOARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Games Grid — 3 columns */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {GAMES.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>

          {/* Leaderboard Sidebar — 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <LeaderboardCard players={LEADERBOARD} />
              
              {/* Quick Stats */}
              <div className="mt-4 glass-card p-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Your Stats
                </h3>
                <div className="space-y-4">
                  <StatRow
                    icon={<GamepadIcon className="h-4 w-4" />}
                    label="Total Games"
                    value={PLAYER_STATS.totalGames.toString()}
                    color="teal"
                  />
                  <StatRow
                    icon={<TargetIcon className="h-4 w-4" />}
                    label="Avg. Accuracy"
                    value={`${PLAYER_STATS.accuracy}%`}
                    color="gold"
                  />
                  <StatRow
                    icon={<TrendingUpIcon className="h-4 w-4" />}
                    label="Team Rank"
                    value={`#${PLAYER_STATS.rank}`}
                    color="orange"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION — Mobile Footer
      ═══════════════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around py-3">
          <FooterNavItem icon={<HomeIcon className="h-5 w-5" />} label="Home" active />
          <FooterNavItem icon={<GamepadIcon className="h-5 w-5" />} label="Games" />
          <FooterNavItem icon={<FireIcon className="h-5 w-5" />} label="Streaks" />
          <FooterNavItem icon={<TrophyIcon className="h-5 w-5" />} label="Leaderboard" />
          <FooterNavItem icon={<UserIcon className="h-5 w-5" />} label="Profile" />
        </div>
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function GameCard({ game }: { game: typeof GAMES[0] }) {
  const router = useRouter();
  
  // Map game IDs to their routes
  const gameRoutes: Record<string, string> = {
    // "coverage-recognition": "/games/coverage-id",
    "blitz-id": "/games/blitz-id",
    "route-matching": "/games/route-tag",
    "formation-memory": "/games/formation",
    "play-responsibility": "/games/assignment",
    "red-zone-scenarios": "/games/red-zone",
    "two-minute-drill": "/games/two-minute",
    "film-reaction": "/games/film-clip",
  };

  const handleClick = () => {
    const route = gameRoutes[game.id];
    if (route) {
      router.push(route);
    }
  };

  const colorStyles = {
    teal: {
      iconBg: "bg-[#00F6E5]/15 border-[#00F6E5]/30",
      iconColor: "text-[#00F6E5]",
      glow: "group-hover:shadow-[#00F6E5]/20",
      border: "group-hover:border-[#00F6E5]/40",
      accent: "#00F6E5",
    },
    ice: {
      iconBg: "bg-[#3DF3FF]/15 border-[#3DF3FF]/30",
      iconColor: "text-[#3DF3FF]",
      glow: "group-hover:shadow-[#3DF3FF]/20",
      border: "group-hover:border-[#3DF3FF]/40",
      accent: "#3DF3FF",
    },
    gold: {
      iconBg: "bg-[#F5C253]/15 border-[#F5C253]/30",
      iconColor: "text-[#F5C253]",
      glow: "group-hover:shadow-[#F5C253]/20",
      border: "group-hover:border-[#F5C253]/40",
      accent: "#F5C253",
    },
    orange: {
      iconBg: "bg-[#FF6A3D]/15 border-[#FF6A3D]/30",
      iconColor: "text-[#FF6A3D]",
      glow: "group-hover:shadow-[#FF6A3D]/20",
      border: "group-hover:border-[#FF6A3D]/40",
      accent: "#FF6A3D",
    },
  };

  const style = colorStyles[game.color as keyof typeof colorStyles];

  return (
    <div
      onClick={handleClick}
      className={`group glass-card relative cursor-pointer overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${style.glow} ${style.border}`}
    >
      {/* Badges */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {game.isHot && (
          <span className="flex items-center gap-1 rounded-full bg-[#FF6A3D]/15 border border-[#FF6A3D]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6A3D]">
            <FireIcon className="h-3 w-3" />
            Hot
          </span>
        )}
        {game.isNew && (
          <span className="rounded-full bg-[#00F6E5]/15 border border-[#00F6E5]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00F6E5]">
            New
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl border ${style.iconBg}`}>
        <GameIcon type={game.icon} className={`h-7 w-7 ${style.iconColor}`} />
      </div>

      {/* Title */}
      <div className="mb-1">
        <h3 className={`text-lg font-black tracking-wide text-white transition-colors`}>
          {game.title}
        </h3>
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {game.subtitle}
        </p>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-slate-400 line-clamp-2">
        {game.description}
      </p>

      {/* Stats Row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-400">{game.avgTime}</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <TargetIcon className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-400">{game.accuracy}%</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <FireIcon className="h-3.5 w-3.5 text-[#F5C253]" />
          <span className="text-xs font-bold text-[#F5C253]">{game.streak}</span>
        </div>
      </div>

      {/* Difficulty Badge */}
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-[#1B1E20] border border-[#1B1E20] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {game.difficulty}
        </span>
        
        {/* Play Button */}
        <button
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${style.iconBg} group-hover:scale-110`}
        >
          <PlayIcon className={`h-4 w-4 ${style.iconColor}`} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#1B1E20]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${game.accuracy}%`,
            background: `linear-gradient(90deg, ${style.accent}, ${style.accent}80)`,
          }}
        />
      </div>
    </div>
  );
}

function LeaderboardCard({ players }: { players: typeof LEADERBOARD }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1B1E20] px-5 py-4">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-[#F5C253]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            WR Room Leaders
          </h3>
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          This Week
        </span>
      </div>

      {/* Player List */}
      <div className="divide-y divide-[#1B1E20]/50">
        {players.map((player) => (
          <div
            key={player.rank}
            className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#1B1E20]/30 ${
              player.isYou ? "bg-[#00F6E5]/5" : ""
            }`}
          >
            {/* Rank */}
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                player.rank === 1
                  ? "bg-[#F5C253]/20 text-[#F5C253]"
                  : player.rank === 2
                  ? "bg-slate-400/20 text-slate-400"
                  : player.rank === 3
                  ? "bg-[#cd7f32]/20 text-[#cd7f32]"
                  : "bg-[#1B1E20] text-slate-500"
              }`}
            >
              {player.rank}
            </div>

            {/* Avatar */}
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                player.isYou
                  ? "bg-gradient-to-br from-[#00F6E5] to-[#3DF3FF] text-[#0A0A0A]"
                  : "bg-[#1B1E20] text-slate-400"
              }`}
            >
              {player.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${player.isYou ? "text-[#00F6E5]" : "text-white"}`}>
                  {player.name}
                </span>
                {player.isYou && (
                  <span className="rounded bg-[#00F6E5]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#00F6E5]">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">{player.position}</span>
            </div>

            {/* XP */}
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-[#F5C253]">
                {player.xp.toLocaleString()}
              </div>
              <div className="flex items-center justify-end gap-1">
                <FireIcon className="h-3 w-3 text-[#FF6A3D]" />
                <span className="text-xs text-slate-500">{player.streak}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All */}
      <button className="flex w-full items-center justify-center gap-2 border-t border-[#1B1E20] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-[#00F6E5] transition-colors hover:bg-[#00F6E5]/5">
        View Full Leaderboard
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "teal" | "gold" | "orange";
}) {
  const colorClasses = {
    teal: "text-[#00F6E5]",
    gold: "text-[#F5C253]",
    orange: "text-[#FF6A3D]",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-mono text-lg font-bold ${colorClasses[color]}`}>{value}</span>
    </div>
  );
}

function FooterNavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex flex-col items-center gap-1 px-3 py-1 ${
        active ? "text-[#00F6E5]" : "text-slate-500"
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME ICONS
// ═══════════════════════════════════════════════════════════════════════════

function GameIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "shield":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "flame":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case "route":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="19" r="2" />
          <path d="M12 17V7" />
          <path d="M7 12l5-5 5 5" />
        </svg>
      );
    case "grid":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case "target":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "film":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY ICONS
// ═══════════════════════════════════════════════════════════════════════════

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
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

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.43 5-7.87V4c0-.55.45-1 1-1s1 .45 1 1v2.13c2.96 1.44 5 4.34 5 7.87 0 4.97-4.03 9-9 9zm0-16c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
      <path d="M15.7 10.4a.5.5 0 0 1 .3.8l-3.5 4.2a.5.5 0 0 1-.8 0l-1.9-2.3a.5.5 0 0 1 .4-.8l1.4 0 1-1.5a.5.5 0 0 1 .5-.2l2.6-.2Z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v7a5 5 0 0 1-10 0V4Z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function GamepadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4" />
      <path d="M8 10v4" />
      <circle cx="17" cy="10" r="1" fill="currentColor" />
      <circle cx="17" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
