"use client";

interface GameTimerProps {
  timeLeft: number;
  totalTime: number;
  color?: "teal" | "orange" | "gold";
}

export function GameTimer({ timeLeft, totalTime, color = "teal" }: GameTimerProps) {
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 10;

  const colorStyles = {
    teal: {
      bar: isLow ? "from-[#FF6A3D] to-[#ff8a5c]" : "from-[#00F6E5] to-[#3DF3FF]",
      text: isLow ? "text-[#FF6A3D]" : "text-[#00F6E5]",
      glow: isLow ? "shadow-[#FF6A3D]/30" : "shadow-[#00F6E5]/30",
    },
    orange: {
      bar: isLow ? "from-[#FF6A3D] to-[#ff8a5c]" : "from-[#FF6A3D] to-[#ff8a5c]",
      text: isLow ? "text-[#FF6A3D]" : "text-[#FF6A3D]",
      glow: "shadow-[#FF6A3D]/30",
    },
    gold: {
      bar: isLow ? "from-[#FF6A3D] to-[#ff8a5c]" : "from-[#F5C253] to-[#ffd97a]",
      text: isLow ? "text-[#FF6A3D]" : "text-[#F5C253]",
      glow: isLow ? "shadow-[#FF6A3D]/30" : "shadow-[#F5C253]/30",
    },
  };

  const style = colorStyles[color];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Timer Display */}
      <div className={`font-mono text-2xl font-bold ${style.text} ${isLow ? "animate-pulse" : ""}`}>
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div className="flex-1 h-3 rounded-full bg-[#1B1E20] border border-[#1B1E20] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-1000 ease-linear shadow-lg ${style.glow}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}








