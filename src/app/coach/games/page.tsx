"use client";

import PlayerNavbar from "@/components/PlayerNavbar";
import { useState, useEffect } from "react";
import type {
  CoachDashboardResponse,
  PlayerRankingSummary,
  PlayerAtRisk,
  MostImprovedPlayer,
} from "@/lib/analytics/types";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COACH GAMES OVERVIEW DASHBOARD
// 
// A comprehensive dashboard for coaches to monitor team performance, player Football IQ,
// identify standouts and at-risk players, and track week-over-week progress.
// ═══════════════════════════════════════════════════════════════════════════════════════════

export default function CoachGamesDashboard() {
  const [dashboardData, setDashboardData] = useState<CoachDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPositionGroup, setSelectedPositionGroup] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "season">("week");

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const teamId = "team-browns"; // In production, get from auth context
        const url = new URL(`/api/analytics/team/${teamId}/dashboard`, window.location.origin);
        if (selectedPositionGroup) {
          url.searchParams.set("positionGroup", selectedPositionGroup);
        }
        
        const res = await fetch(url.toString());
        const data = await res.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [selectedPositionGroup]);

  if (loading) {
    return <LoadingState />;
  }

  if (!dashboardData) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] holographic-grid">
      <PlayerNavbar />

      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="badge-teal">Coach Dashboard</span>
                <span className="text-xs text-slate-500">
                  Updated {new Date(dashboardData.generatedAt).toLocaleTimeString()}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                Games Overview
              </h1>
              <p className="mt-1 text-slate-400">
                {dashboardData.teamName} • Football IQ & Performance Analytics
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Time Range */}
              <div className="flex rounded-lg border border-[#1B1E20] bg-[#0A0A0A] p-1">
                {(["week", "month", "season"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                      timeRange === range
                        ? "bg-[#00F6E5]/15 text-[#00F6E5]"
                        : "text-slate-500 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Position Filter */}
              <select
                value={selectedPositionGroup || ""}
                onChange={(e) => setSelectedPositionGroup(e.target.value || null)}
                className="rounded-lg border border-[#1B1E20] bg-[#0A0A0A] px-4 py-2.5 text-sm font-medium text-white focus:border-[#00F6E5]/50 focus:outline-none"
              >
                <option value="">All Positions</option>
                <option value="QB Room">QB Room</option>
                <option value="WR Room">WR Room</option>
                <option value="RB Room">RB Room</option>
                <option value="O-Line">O-Line</option>
                <option value="Secondary">Secondary</option>
                <option value="Linebackers">Linebackers</option>
                <option value="D-Line">D-Line</option>
              </select>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            KPI CARDS — Top-Line Metrics
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KPICard
            title="Total Sessions"
            value={dashboardData.kpis.thisWeek.totalSessions}
            delta={dashboardData.kpis.deltas.sessions}
            deltaPercent={dashboardData.kpis.deltas.sessionsPercent}
            icon={<GamepadIcon className="h-5 w-5" />}
            color="teal"
          />
          <KPICard
            title="Active Players"
            value={dashboardData.kpis.thisWeek.activePlayers}
            delta={dashboardData.kpis.deltas.activePlayers}
            deltaPercent={dashboardData.kpis.deltas.activePlayersPercent}
            icon={<UsersIcon className="h-5 w-5" />}
            color="ice"
          />
          <KPICard
            title="Avg Accuracy"
            value={`${dashboardData.kpis.thisWeek.averageAccuracy.toFixed(1)}%`}
            delta={dashboardData.kpis.deltas.accuracy}
            deltaPercent={dashboardData.kpis.deltas.accuracyPercent}
            icon={<TargetIcon className="h-5 w-5" />}
            color="gold"
            suffix="%"
          />
          <KPICard
            title="Total XP"
            value={dashboardData.kpis.thisWeek.totalXPEarned.toLocaleString()}
            delta={dashboardData.kpis.deltas.xp}
            deltaPercent={dashboardData.kpis.deltas.xpPercent}
            icon={<StarIcon className="h-5 w-5" />}
            color="orange"
          />
          <KPICard
            title="Team Football IQ"
            value={dashboardData.kpis.thisWeek.averageFootballIQ}
            delta={dashboardData.kpis.deltas.footballIQ}
            deltaPercent={dashboardData.kpis.deltas.footballIQPercent}
            icon={<BrainIcon className="h-5 w-5" />}
            color="teal"
            highlight
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN GRID — Rankings, Chart, Call-outs
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Player Rankings (8 cols) */}
          <div className="lg:col-span-8">
            <PlayerRankingsTable players={dashboardData.playerRankings} />
          </div>

          {/* Right Column: Charts & Call-outs (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Coverage vs Blitz IQ Chart */}
            <IQComparisonChart data={dashboardData.iqComparison} />

            {/* Most Improved Call-out */}
            {dashboardData.mostImproved && (
              <MostImprovedCard player={dashboardData.mostImproved} />
            )}

            {/* Players At Risk Call-outs */}
            {dashboardData.playersAtRisk.length > 0 && (
              <PlayersAtRiskCard players={dashboardData.playersAtRisk} />
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            POSITION ROOM BREAKDOWN
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wider text-white">
            Position Room Breakdown
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardData.positionRooms.map((room) => (
              <PositionRoomCard key={room.positionGroup} room={room} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

function KPICard({
  title,
  value,
  delta,
  deltaPercent,
  icon,
  color,
  suffix = "",
  highlight = false,
}: {
  title: string;
  value: string | number;
  delta: number;
  deltaPercent: number;
  icon: React.ReactNode;
  color: "teal" | "ice" | "gold" | "orange";
  suffix?: string;
  highlight?: boolean;
}) {
  const colorStyles = {
    teal: {
      iconBg: "bg-[#00F6E5]/10",
      iconColor: "text-[#00F6E5]",
      border: highlight ? "border-[#00F6E5]/40" : "border-[#1B1E20]",
    },
    ice: {
      iconBg: "bg-[#3DF3FF]/10",
      iconColor: "text-[#3DF3FF]",
      border: "border-[#1B1E20]",
    },
    gold: {
      iconBg: "bg-[#F5C253]/10",
      iconColor: "text-[#F5C253]",
      border: "border-[#1B1E20]",
    },
    orange: {
      iconBg: "bg-[#FF6A3D]/10",
      iconColor: "text-[#FF6A3D]",
      border: "border-[#1B1E20]",
    },
  };

  const style = colorStyles[color];
  const isPositive = delta >= 0;

  return (
    <div
      className={`glass-card p-5 ${style.border} ${
        highlight ? "ring-1 ring-[#00F6E5]/20" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.iconBg}`}>
          <span className={style.iconColor}>{icon}</span>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          )}
          {Math.abs(deltaPercent).toFixed(1)}%
        </div>
      </div>
      <div className="text-2xl font-black text-white lg:text-3xl">
        {value}
        {suffix}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
          {isPositive ? "+" : ""}
          {delta}
        </span>{" "}
        vs last week
      </div>
    </div>
  );
}

function PlayerRankingsTable({ players }: { players: PlayerRankingSummary[] }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1B1E20] px-6 py-4">
        <div className="flex items-center gap-3">
          <BrainIcon className="h-5 w-5 text-[#00F6E5]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Football IQ Rankings
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {players.length} players
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1B1E20]/50 bg-[#0A0A0A]/50">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Player
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Football IQ
              </th>
              <th className="hidden px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 md:table-cell">
                Coverage
              </th>
              <th className="hidden px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 md:table-cell">
                Blitz
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Accuracy
              </th>
              <th className="hidden px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 lg:table-cell">
                Games
              </th>
              <th className="hidden px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 lg:table-cell">
                Streak
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B1E20]/30">
            {players.map((player, index) => (
              <tr
                key={player.userId}
                className="transition-colors hover:bg-[#1B1E20]/30"
              >
                {/* Rank */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RankBadge rank={player.rank} />
                    {player.rankChange !== null && player.rankChange !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          player.rankChange > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {player.rankChange > 0 ? "↑" : "↓"}
                        {Math.abs(player.rankChange)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Player Info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1B1E20] to-[#0A0A0A] text-xs font-bold text-slate-400">
                      {player.firstName[0]}
                      {player.lastName[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {player.displayName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{player.position}</span>
                        {player.jerseyNumber && (
                          <>
                            <span>•</span>
                            <span>#{player.jerseyNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Football IQ */}
                <td className="px-4 py-3 text-center">
                  <IQBadge score={player.footballIQ} size="lg" />
                </td>

                {/* Coverage IQ */}
                <td className="hidden px-4 py-3 text-center md:table-cell">
                  <IQBadge score={player.coverageIQ} color="teal" />
                </td>

                {/* Blitz IQ */}
                <td className="hidden px-4 py-3 text-center md:table-cell">
                  <IQBadge score={player.blitzIQ} color="orange" />
                </td>

                {/* Accuracy */}
                <td className="px-4 py-3 text-center">
                  <span className="font-mono text-sm font-semibold text-white">
                    {player.accuracy.toFixed(1)}%
                  </span>
                </td>

                {/* Games */}
                <td className="hidden px-4 py-3 text-center lg:table-cell">
                  <span className="text-sm text-slate-400">
                    {player.gamesThisWeek}
                  </span>
                </td>

                {/* Streak */}
                <td className="hidden px-4 py-3 text-center lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {player.currentStreak > 0 ? (
                      <>
                        <FireIcon className="h-4 w-4 text-[#F5C253]" />
                        <span className="font-bold text-[#F5C253]">
                          {player.currentStreak}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IQComparisonChart({ data }: { data: CoachDashboardResponse["iqComparison"] }) {
  // Find max value for scaling
  const maxValue = Math.max(
    ...data.datasets.flatMap((d) => d.data),
    100
  );

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Coverage IQ vs Blitz IQ
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#00F6E5]" />
            <span className="text-xs text-slate-400">Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF6A3D]" />
            <span className="text-xs text-slate-400">Blitz</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        {data.labels.map((label, index) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">{label}</span>
              <span className="font-mono text-slate-500">
                {data.datasets[0].data[index]} / {data.datasets[1].data[index]}
              </span>
            </div>
            <div className="flex gap-1">
              {/* Coverage bar */}
              <div className="h-4 flex-1 overflow-hidden rounded-l bg-[#1B1E20]">
                <div
                  className="h-full rounded-l bg-gradient-to-r from-[#00F6E5] to-[#00F6E5]/70 transition-all duration-500"
                  style={{
                    width: `${(data.datasets[0].data[index] / maxValue) * 100}%`,
                  }}
                />
              </div>
              {/* Blitz bar */}
              <div className="h-4 flex-1 overflow-hidden rounded-r bg-[#1B1E20]">
                <div
                  className="h-full rounded-r bg-gradient-to-r from-[#FF6A3D]/70 to-[#FF6A3D] transition-all duration-500"
                  style={{
                    width: `${(data.datasets[1].data[index] / maxValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MostImprovedCard({ player }: { player: MostImprovedPlayer }) {
  return (
    <div className="glass-card overflow-hidden border-emerald-500/20">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-5 py-3">
        <TrendingUpIcon className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Most Improved Player
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-sm font-bold text-emerald-400">
            {player.displayName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="font-semibold text-white">{player.displayName}</div>
            <div className="text-xs text-slate-500">{player.position}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-500/5 p-3">
            <div className="text-2xl font-black text-emerald-400">
              +{player.footballIQGain}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              IQ Gain
            </div>
          </div>
          <div className="rounded-lg bg-emerald-500/5 p-3">
            <div className="text-2xl font-black text-emerald-400">
              +{player.accuracyGain.toFixed(1)}%
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Accuracy
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-emerald-400">
              {player.mostImprovedCategory.category}
            </span>
            {" "}improved from {player.mostImprovedCategory.previousScore} → {player.mostImprovedCategory.currentScore}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayersAtRiskCard({ players }: { players: PlayerAtRisk[] }) {
  return (
    <div className="glass-card overflow-hidden border-[#FF6A3D]/20">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#FF6A3D]/20 bg-[#FF6A3D]/5 px-5 py-3">
        <AlertIcon className="h-4 w-4 text-[#FF6A3D]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A3D]">
          Players At Risk
        </span>
        <span className="ml-auto rounded-full bg-[#FF6A3D]/15 px-2 py-0.5 text-xs font-bold text-[#FF6A3D]">
          {players.length}
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-[#1B1E20]/50">
        {players.map((player) => (
          <div key={player.userId} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B1E20] text-xs font-bold text-slate-400">
                  {player.displayName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {player.displayName}
                  </div>
                  <div className="text-xs text-slate-500">{player.position}</div>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  player.riskLevel === "high"
                    ? "bg-red-500/15 text-red-400"
                    : player.riskLevel === "medium"
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-slate-500/15 text-slate-400"
                }`}
              >
                {player.riskLevel} risk
              </span>
            </div>

            {/* Risk reasons */}
            <div className="mb-2 space-y-1">
              {player.riskReasons.slice(0, 2).map((reason, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs ${
                    reason.severity === "alert"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {reason.severity === "alert" ? (
                    <AlertIcon className="h-3 w-3" />
                  ) : (
                    <WarningIcon className="h-3 w-3" />
                  )}
                  {reason.message}
                </div>
              ))}
            </div>

            {/* Action */}
            <div className="rounded bg-[#FF6A3D]/5 px-2 py-1.5 text-xs text-slate-400">
              <span className="font-medium text-[#FF6A3D]">Action: </span>
              {player.suggestedAction}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionRoomCard({
  room,
}: {
  room: CoachDashboardResponse["positionRooms"][0];
}) {
  const iqDelta = room.footballIQvsTeam;
  const isAboveTeam = iqDelta > 0;

  return (
    <div className="glass-card p-5 transition-all hover:border-[#00F6E5]/30">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-white">{room.displayName}</h3>
        <span className="text-xs text-slate-500">
          {room.activePlayerCount}/{room.playerCount} active
        </span>
      </div>

      {/* Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xl font-black text-[#00F6E5]">
            {room.averageFootballIQ}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            Avg IQ
            <span
              className={`font-semibold ${
                isAboveTeam ? "text-emerald-400" : "text-red-400"
              }`}
            >
              ({isAboveTeam ? "+" : ""}
              {iqDelta} vs team)
            </span>
          </div>
        </div>
        <div>
          <div className="text-xl font-black text-white">
            {room.averageAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Accuracy</div>
        </div>
      </div>

      {/* Top Player */}
      {room.topPlayer && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#F5C253]/20 bg-[#F5C253]/5 p-2">
          <TrophyIcon className="h-4 w-4 text-[#F5C253]" />
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-[#F5C253]">
              {room.topPlayer.displayName}
            </span>{" "}
            leads with {room.topPlayer.footballIQ} IQ
          </span>
        </div>
      )}

      {/* Weak Categories */}
      {room.weakestCategories.length > 0 && (
        <div className="rounded-lg border border-[#FF6A3D]/20 bg-[#FF6A3D]/5 p-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#FF6A3D]">
            Focus Area
          </div>
          {room.weakestCategories.map((cat, i) => (
            <div key={i} className="text-xs text-slate-400">
              {cat.category}: {cat.averageScore} (team avg: {cat.teamAverageScore})
            </div>
          ))}
        </div>
      )}

      {/* Activity bar */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
          <span>Weekly Activity</span>
          <span>{room.totalGamesThisWeek} games</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1B1E20]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00F6E5] to-[#3DF3FF]"
            style={{
              width: `${Math.min((room.totalGamesThisWeek / 60) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "bg-[#F5C253]/20 text-[#F5C253] ring-1 ring-[#F5C253]/30"
      : rank === 2
      ? "bg-slate-400/20 text-slate-300 ring-1 ring-slate-400/30"
      : rank === 3
      ? "bg-[#cd7f32]/20 text-[#cd7f32] ring-1 ring-[#cd7f32]/30"
      : "bg-[#1B1E20] text-slate-500";

  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${styles}`}
    >
      {rank}
    </div>
  );
}

function IQBadge({
  score,
  size = "md",
  color,
}: {
  score: number;
  size?: "md" | "lg";
  color?: "teal" | "orange";
}) {
  let bgColor: string;
  let textColor: string;

  if (color === "teal") {
    bgColor = "bg-[#00F6E5]/15";
    textColor = "text-[#00F6E5]";
  } else if (color === "orange") {
    bgColor = "bg-[#FF6A3D]/15";
    textColor = "text-[#FF6A3D]";
  } else if (score >= 90) {
    bgColor = "bg-[#F5C253]/15";
    textColor = "text-[#F5C253]";
  } else if (score >= 75) {
    bgColor = "bg-[#00F6E5]/15";
    textColor = "text-[#00F6E5]";
  } else if (score >= 60) {
    bgColor = "bg-[#3DF3FF]/15";
    textColor = "text-[#3DF3FF]";
  } else {
    bgColor = "bg-slate-500/15";
    textColor = "text-slate-400";
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg font-mono font-bold ${bgColor} ${textColor} ${
        size === "lg" ? "px-3 py-1.5 text-base" : "px-2 py-1 text-sm"
      }`}
    >
      {score}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
        <div className="text-sm text-slate-400">Loading dashboard...</div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <AlertIcon className="mx-auto mb-4 h-12 w-12 text-[#FF6A3D]" />
        <div className="text-lg font-bold text-white">Failed to load dashboard</div>
        <div className="text-sm text-slate-400">Please try refreshing the page</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.43 5-7.87V4c0-.55.45-1 1-1s1 .45 1 1v2.13c2.96 1.44 5 4.34 5 7.87 0 4.97-4.03 9-9 9zm0-16c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z" />
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

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}








