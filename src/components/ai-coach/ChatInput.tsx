"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CHAT INPUT — Rich input with toolbar and quick actions
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onActionClick: (action: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
}

const QUICK_ACTIONS = [
  { id: "ask", label: "Ask Coach", icon: <MessageIcon /> },
  { id: "diagram", label: "Draw Diagram", icon: <DiagramIcon /> },
  { id: "film", label: "Break Down Film", icon: <FilmIcon /> },
  { id: "quiz", label: "Quiz Me", icon: <QuizIcon /> },
  { id: "simplify", label: "Simplify It", icon: <SimplifyIcon /> },
];

export function ChatInput({
  onSend,
  onActionClick,
  isProcessing = false,
  placeholder = "Ask Chalk Talk anything...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      onSend(message.trim());
      setMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Quick Actions Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1E20] border border-slate-700/50 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-[#1B1E20]/80 hover:text-[#00F6E5] hover:border-[#00F6E5]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            <span className="h-3.5 w-3.5">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Container */}
      <div
        className={`relative flex items-end gap-3 rounded-xl bg-gradient-to-br from-[#1B1E20]/90 to-[#0f172a]/80 border transition-all duration-200 p-3 ${isFocused ? "border-[#00F6E5]/40 shadow-[0_0_15px_rgba(0,246,229,0.1)]" : "border-[#1B1E20]"}`}
      >
        {/* Input Field */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={1}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none min-h-[24px] max-h-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isProcessing}
          className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] font-bold hover:shadow-lg hover:shadow-[#00F6E5]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isProcessing ? (
            <LoadingSpinner />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className="flex justify-center">
        <span className="text-[10px] text-slate-600">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[#1B1E20] text-slate-400">Enter</kbd> to send •{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[#1B1E20] text-slate-400">Shift+Enter</kbd> for new line
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function SendIcon({ className }: { className?: string }) {
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
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DiagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="8" r="2" />
      <path d="M12 10v6" />
      <path d="M8 16h8" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

function SimplifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-full w-full">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default ChatInput;

