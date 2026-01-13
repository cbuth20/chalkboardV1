"use client";

interface ResultsModalProps {
  totalQuestions: number;
  correctCount: number;
  score: number;
  onPlayAgain: () => void;
  onExit: () => void;
  gameName: string;
}

export function ResultsModal({
  totalQuestions,
  correctCount,
  score,
  onPlayAgain,
  onExit,
  gameName,
}: ResultsModalProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Determine performance tier
  const getPerformanceTier = () => {
    if (accuracy >= 90) return { label: "DOG OF THE DAY 🔥", color: "text-[#F5C253]", message: "Elite performance! You're seeing the field like a pro." };
    if (accuracy >= 75) return { label: "SOLID 💪", color: "text-[#00F6E5]", message: "Good work! Keep building that football IQ." };
    if (accuracy >= 50) return { label: "GETTING THERE 📈", color: "text-[#3DF3FF]", message: "Progress is progress. Keep grinding." };
    return { label: "NEED MORE REPS 🏋️", color: "text-[#FF6A3D]", message: "Back to the film room. You got this!" };
  };

  const tier = getPerformanceTier();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4 overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="border-b border-[#1B1E20] px-6 py-4 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {gameName} Complete
          </h2>
          <p className={`mt-2 text-2xl font-black ${tier.color}`}>{tier.label}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 p-6">
          <StatBox label="Score" value={score.toString()} color="gold" />
          <StatBox label="Accuracy" value={`${accuracy}%`} color="teal" />
          <StatBox 
            label="Correct" 
            value={`${correctCount}/${totalQuestions}`} 
            color={accuracy >= 75 ? "teal" : "orange"} 
          />
        </div>

        {/* Message */}
        <div className="px-6 pb-4">
          <p className="text-center text-sm text-slate-400">{tier.message}</p>
        </div>

        {/* XP Earned */}
        <div className="mx-6 mb-6 flex items-center justify-center gap-2 rounded-xl border border-[#F5C253]/20 bg-[#F5C253]/5 py-3">
          <StarIcon className="h-5 w-5 text-[#F5C253]" />
          <span className="font-mono text-lg font-bold text-[#F5C253]">+{score} XP</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-[#1B1E20] p-4">
          <button
            onClick={onExit}
            className="flex-1 rounded-lg border border-slate-700 bg-[#1B1E20] py-3 text-sm font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
          >
            Exit
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 btn-primary !py-3 flex items-center justify-center gap-2"
          >
            <PlayIcon className="h-4 w-4" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: "teal" | "gold" | "orange" }) {
  const colorStyles = {
    teal: "text-[#00F6E5]",
    gold: "text-[#F5C253]",
    orange: "text-[#FF6A3D]",
  };

  return (
    <div className="text-center">
      <div className={`font-mono text-3xl font-black ${colorStyles[color]}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}








