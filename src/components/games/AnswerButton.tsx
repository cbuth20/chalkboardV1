"use client";

interface AnswerButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrect?: boolean | null; // null = not revealed, true/false = revealed
  color?: "teal" | "orange" | "ice" | "gold";
}

export function AnswerButton({
  label,
  onClick,
  disabled = false,
  isSelected = false,
  isCorrect = null,
  color = "teal",
}: AnswerButtonProps) {
  // Determine button state styling
  const getStateStyles = () => {
    // Revealed as correct answer
    if (isCorrect === true && isSelected) {
      return "border-[#00F6E5] bg-[#00F6E5]/20 text-[#00F6E5] shadow-lg shadow-[#00F6E5]/20";
    }
    // Revealed as incorrect (user selected wrong)
    if (isCorrect === false && isSelected) {
      return "border-[#FF6A3D] bg-[#FF6A3D]/20 text-[#FF6A3D] shadow-lg shadow-[#FF6A3D]/20";
    }
    // Show correct answer (not selected but is correct)
    if (isCorrect === true && !isSelected) {
      return "border-[#00F6E5]/50 bg-[#00F6E5]/10 text-[#00F6E5]";
    }
    // Default disabled state after answer
    if (disabled) {
      return "border-slate-700/50 bg-[#1B1E20]/50 text-slate-500 cursor-not-allowed";
    }
    // Default interactive state
    return "border-[#1B1E20] bg-[#1B1E20]/80 text-white hover:border-[#00F6E5]/50 hover:bg-[#00F6E5]/10 hover:text-[#00F6E5] cursor-pointer";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center rounded-xl border-2 px-6 py-4 text-base font-bold uppercase tracking-wider transition-all duration-200 ${getStateStyles()}`}
    >
      {label}
      
      {/* Correct/Incorrect Icon */}
      {/* {isCorrect === true && isSelected && (
        <span className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#00F6E5]">
          <CheckIcon className="h-4 w-4 text-[#0A0A0A]" />
        </span>
      )} */}
      {isCorrect === false && isSelected && (
        <span className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6A3D]">
          <XIcon className="h-4 w-4 text-white" />
        </span>
      )}
    </button>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}








