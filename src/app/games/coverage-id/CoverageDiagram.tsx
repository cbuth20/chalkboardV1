// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE DIAGRAM WRAPPER — Code-drawn coverage shell visualization
// Replaces the old image-based component with shared diagram component
// Uses GameDiagramWrapper for large, centered, readable diagrams
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { 
  CoverageDiagram as SharedCoverageDiagram,
  GameDiagramWrapper 
} from "@/components/football";
import { getCoverageByLegacyId, FORMATIONS, type LegacyCoverageId } from "@/types/football";

interface CoverageDiagramProps {
  // Legacy prop for backward compatibility
  diagramSrc?: string;
  // New props for code-drawn diagrams
  coverageId?: LegacyCoverageId;
  formationId?: string;
  showLabels?: boolean;
}

/**
 * CoverageDiagram wrapper that uses the shared code-drawn component.
 * Wraps the diagram in GameDiagramWrapper for large, readable display.
 */
export function CoverageDiagram({
  coverageId,
  formationId,
  showLabels = false,
}: CoverageDiagramProps) {
  // Get the coverage shell data
  const shell = coverageId ? getCoverageByLegacyId(coverageId) : undefined;
  
  // Get optional formation for context
  const formation = formationId
    ? FORMATIONS.find((f) => f.id === formationId)
    : FORMATIONS.find((f) => f.id === "shotgun-spread"); // Default to spread for visual context

  // If no valid shell, show placeholder
  if (!shell) {
    return (
      <div className="diagram-wrapper w-full max-w-[900px] mx-auto flex justify-center items-start h-[412px]">
        <div className="diagram-inner origin-top scale-[1.4]">
          <div className="relative flex w-[500px] h-[280px] items-center justify-center rounded-xl border border-slate-700/50 bg-[#1B1E20]/80 overflow-hidden">
            <DiagramPlaceholder />
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameDiagramWrapper variant="coverage" scale={1.4}>
      <SharedCoverageDiagram
        shell={shell}
        formation={formation}
        showLabels={showLabels}
        showZones={false}
        scalable={true}
      />
    </GameDiagramWrapper>
  );
}

function DiagramPlaceholder() {
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-3">
        <svg
          className="h-16 w-16 text-slate-600"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="4" y="12" width="56" height="40" rx="2" />
          <line x1="4" y1="22" x2="10" y2="22" />
          <line x1="4" y1="32" x2="10" y2="32" />
          <line x1="4" y1="42" x2="10" y2="42" />
          <line x1="54" y1="22" x2="60" y2="22" />
          <line x1="54" y1="32" x2="60" y2="32" />
          <line x1="54" y1="42" x2="60" y2="42" />
          <line x1="32" y1="12" x2="32" y2="52" strokeDasharray="4 2" />
          <circle cx="32" cy="24" r="3" fill="currentColor" fillOpacity={0.3} />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" fillOpacity={0.3} />
          <circle cx="44" cy="20" r="2.5" fill="currentColor" fillOpacity={0.3} />
        </svg>
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Coverage Shell Loading...
      </p>
    </div>
  );
}

export default CoverageDiagram;
