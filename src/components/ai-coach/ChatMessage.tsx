"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CHAT MESSAGE — Rich message component with support for all content types
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import type { CoachMessage, MessageContent, SuggestedAction } from "@/lib/ai-coach/types";
import { CoverageDiagram, FormationDiagram, RouteDiagram } from "@/components/football";
import { getCoverageById, getFormationById } from "@/domain/football";

interface ChatMessageProps {
  message: CoachMessage;
  onActionClick?: (action: SuggestedAction) => void;
}

export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const isCoach = message.role === "coach";
  const isSystem = message.role === "system";

  return (
    <div
      className={`flex gap-3 ${isCoach ? "flex-row" : "flex-row-reverse"} ${
        isSystem ? "justify-center" : ""
      }`}
    >
      {/* Avatar */}
      {!isSystem && (
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
            isCoach
              ? "bg-gradient-to-br from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A]"
              : "bg-[#1B1E20] text-slate-400 border border-slate-700"
          }`}
        >
          {isCoach ? "🏈" : "U"}
        </div>
      )}

      {/* Message Content */}
      <div
        className={`flex flex-col gap-2 max-w-[85%] ${
          isCoach ? "" : "items-end"
        } ${isSystem ? "items-center max-w-full" : ""}`}
      >
        {/* Role Label (for coach) */}
        {isCoach && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F6E5]">
            AI COACH
          </span>
        )}

        {/* Content Blocks */}
        <div className={`flex flex-col gap-3 ${isCoach ? "" : "items-end"}`}>
          {message.content.map((content, idx) => (
            <ContentBlock
              key={idx}
              content={content}
              isCoach={isCoach}
              onActionClick={onActionClick}
            />
          ))}
        </div>

        {/* Suggested Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.suggestedActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onActionClick?.(action)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide 
                  bg-[#1B1E20] border border-[#00F6E5]/20 text-[#00F6E5]
                  hover:bg-[#00F6E5]/10 hover:border-[#00F6E5]/40 transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-600 mt-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT BLOCK — Renders different content types
// ═══════════════════════════════════════════════════════════════════════════

interface ContentBlockProps {
  content: MessageContent;
  isCoach: boolean;
  onActionClick?: (action: SuggestedAction) => void;
}

function ContentBlock({ content, isCoach, onActionClick }: ContentBlockProps) {
  const [isExpanded, setIsExpanded] = useState(!content.isExpandable);

  const baseClasses = isCoach
    ? "bg-gradient-to-br from-[#1B1E20]/90 to-[#0f172a]/80 border border-[#00F6E5]/15 rounded-xl rounded-tl-sm"
    : "bg-[#1B1E20] border border-slate-700/50 rounded-xl rounded-tr-sm";

  switch (content.type) {
    case "text":
      return (
        <div className={`${baseClasses} px-4 py-3`}>
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
            <FormattedText text={content.text || ""} />
          </div>
          {content.isExpandable && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-[#00F6E5] hover:underline"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      );

    case "diagram":
      return (
        <div className={`${baseClasses} p-4`}>
          <DiagramRenderer data={content.diagram!} />
        </div>
      );

    case "flashcard":
      return (
        <FlashcardBlock data={content.flashcard!} baseClasses={baseClasses} />
      );

    case "quiz":
      return (
        <QuizBlock
          data={content.quiz!}
          baseClasses={baseClasses}
          onActionClick={onActionClick}
        />
      );

    case "play-breakdown":
      return (
        <PlayBreakdownBlock
          data={content.playBreakdown!}
          baseClasses={baseClasses}
        />
      );

    case "correction":
      return (
        <div
          className={`${baseClasses} px-4 py-3 border-l-4 border-l-[#FF6A3D]`}
        >
          <div className="flex items-start gap-2">
            <span className="text-[#FF6A3D]">⚠️</span>
            <div className="text-sm text-slate-200">{content.text}</div>
          </div>
        </div>
      );

    case "suggestion":
      return (
        <div
          className={`${baseClasses} px-4 py-3 border-l-4 border-l-[#F5C253]`}
        >
          <div className="flex items-start gap-2">
            <span className="text-[#F5C253]">💡</span>
            <div className="text-sm text-slate-200">{content.text}</div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTED TEXT — Parse and render markdown-like formatting
// ═══════════════════════════════════════════════════════════════════════════

function FormattedText({ text }: { text: string }) {
  // Split by newlines and process each line
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith("# ")) {
          return (
            <h2
              key={idx}
              className="text-lg font-bold text-white mt-4 mb-2 first:mt-0"
            >
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3
              key={idx}
              className="text-base font-bold text-white mt-3 mb-1.5"
            >
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-sm font-bold text-white mt-2 mb-1">
              {line.slice(4)}
            </h4>
          );
        }

        // Bullet points
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={idx} className="flex gap-2 ml-2">
              <span className="text-[#00F6E5]">•</span>
              <span>{processInlineFormatting(line.slice(2))}</span>
            </div>
          );
        }

        // Empty lines
        if (line.trim() === "") {
          return <div key={idx} className="h-2" />;
        }

        // Regular text
        return (
          <p key={idx} className="mb-1">
            {processInlineFormatting(line)}
          </p>
        );
      })}
    </>
  );
}

function processInlineFormatting(text: string): React.ReactNode {
  // Process **bold** text
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function DiagramRenderer({
  data,
}: {
  data: NonNullable<MessageContent["diagram"]>;
}) {
  // Look up full objects from IDs
  const coverage = data.coverageId ? getCoverageById(data.coverageId) : undefined;
  const formation = data.formationId ? getFormationById(data.formationId) : undefined;

  return (
    <div className="w-full">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
        {data.type.replace("-", " ")} Diagram
      </div>
      <div className="bg-[#0A0A0A] rounded-lg overflow-hidden border border-slate-800">
        {data.type === "coverage" && coverage && (
          <CoverageDiagram shell={coverage} />
        )}
        {data.type === "formation" && formation && (
          <FormationDiagram formation={formation} />
        )}
        {data.type === "route" && data.routes && data.routes.length > 0 && (
          <RouteDiagram />
        )}
        {data.type === "full-play" && (
          <div className="p-4 text-center text-slate-400 text-sm">
            Full play diagram with{" "}
            {data.concept && `${data.concept} concept`}
            {data.formationId && ` from ${data.formationId}`}
            {data.coverageId && ` vs ${data.coverageId}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLASHCARD BLOCK
// ═══════════════════════════════════════════════════════════════════════════

function FlashcardBlock({
  data,
  baseClasses,
}: {
  data: NonNullable<MessageContent["flashcard"]>;
  baseClasses: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`${baseClasses} p-4 cursor-pointer transition-all hover:scale-[1.02]`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5C253]">
          FLASHCARD
        </span>
        <span className="text-[10px] text-slate-500">
          {isFlipped ? "ANSWER" : "QUESTION"} • Click to flip
        </span>
      </div>
      <div className="min-h-[60px] flex items-center">
        <p className="text-sm text-slate-200">
          {isFlipped ? data.back : data.front}
        </p>
      </div>
      {!isFlipped && data.hint && (
        <p className="text-xs text-slate-500 mt-2 italic">Hint: {data.hint}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ BLOCK
// ═══════════════════════════════════════════════════════════════════════════

function QuizBlock({
  data,
  baseClasses,
  onActionClick,
}: {
  data: NonNullable<MessageContent["quiz"]>;
  baseClasses: string;
  onActionClick?: (action: SuggestedAction) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setShowResult(true);
    }
  };

  const isCorrect = selectedAnswer === data.correctAnswer;

  return (
    <div className={`${baseClasses} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F6E5]">
          QUIZ
        </span>
        <span
          className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
            data.difficulty === "beginner"
              ? "bg-green-500/20 text-green-400"
              : data.difficulty === "intermediate"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {data.difficulty}
        </span>
      </div>

      <p className="text-sm text-white font-medium mb-4">{data.question}</p>

      <div className="space-y-2">
        {data.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => !showResult && setSelectedAnswer(idx)}
            disabled={showResult}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
              showResult
                ? idx === data.correctAnswer
                  ? "bg-green-500/20 border-green-500/50 text-green-300"
                  : idx === selectedAnswer
                  ? "bg-red-500/20 border-red-500/50 text-red-300"
                  : "bg-[#1B1E20] border-slate-700/50 text-slate-400"
                : selectedAnswer === idx
                ? "bg-[#00F6E5]/10 border-[#00F6E5]/40 text-[#00F6E5]"
                : "bg-[#1B1E20] border-slate-700/50 text-slate-300 hover:bg-[#1B1E20]/80"
            } border`}
          >
            <span className="font-mono mr-2">
              {String.fromCharCode(65 + idx)}.
            </span>
            {option}
          </button>
        ))}
      </div>

      {!showResult && selectedAnswer !== null && (
        <button
          onClick={handleSubmit}
          className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-[#00F6E5]/20 transition-all"
        >
          Submit Answer
        </button>
      )}

      {showResult && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            isCorrect
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          <p
            className={`text-sm font-medium mb-1 ${
              isCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {isCorrect ? "✓ Correct!" : "✗ Not quite"}
          </p>
          <p className="text-xs text-slate-300">{data.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAY BREAKDOWN BLOCK
// ═══════════════════════════════════════════════════════════════════════════

function PlayBreakdownBlock({
  data,
  baseClasses,
}: {
  data: NonNullable<MessageContent["playBreakdown"]>;
  baseClasses: string;
}) {
  return (
    <div className={`${baseClasses} p-4`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#3DF3FF] mb-3">
        PLAY BREAKDOWN
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0A0A0A] rounded-lg p-3 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Coverage</span>
          <p className="text-sm font-bold text-white">{data.coverage}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-3 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">
            Formation
          </span>
          <p className="text-sm font-bold text-white">{data.formation}</p>
        </div>
        {data.concept && (
          <div className="bg-[#0A0A0A] rounded-lg p-3 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">
              Concept
            </span>
            <p className="text-sm font-bold text-white">{data.concept}</p>
          </div>
        )}
        {data.protection && (
          <div className="bg-[#0A0A0A] rounded-lg p-3 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">
              Protection
            </span>
            <p className="text-sm font-bold text-white">{data.protection}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">
            Pre-Snap Reads
          </h4>
          <ul className="space-y-1">
            {data.presnap.map((note, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex gap-2">
                <span className="text-[#00F6E5]">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">
            Post-Snap Keys
          </h4>
          <ul className="space-y-1">
            {data.postsnap.map((note, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex gap-2">
                <span className="text-[#3DF3FF]">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-[#F5C253] uppercase mb-1">
            Coaching Notes
          </h4>
          <ul className="space-y-1">
            {data.coachingNotes.map((note, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex gap-2">
                <span className="text-[#F5C253]">→</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default ChatMessage;

