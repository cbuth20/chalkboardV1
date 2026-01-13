// ═══════════════════════════════════════════════════════════════════════════
// GAME DIAGRAM WRAPPER — Shared scalable wrapper for all game diagrams
// Ensures diagrams are large, centered, and readable across all four games
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { ReactNode } from "react";

export interface GameDiagramWrapperProps {
  children: ReactNode;
  /** Scale factor for the diagram. Default is 1.6 for large, readable diagrams */
  scale?: number;
  /** Maximum width of the wrapper. Default is 900px */
  maxWidth?: number;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Variant for different game types - affects accent colors */
  variant?: "coverage" | "blitz" | "formation" | "route" | "default";
}

/**
 * GameDiagramWrapper provides a consistent, scalable container for all
 * football diagrams across the four Chalkboard games.
 * 
 * Features:
 * - Scales diagrams up using transform for readability (default 1.6x)
 * - Centers diagrams within the game panel
 * - Uses percentage-based sizing for clean scaling
 * - Provides consistent layout across Coverage ID, Blitz ID, Formation, and Route Tag
 * 
 * Usage:
 * ```tsx
 * <GameDiagramWrapper variant="coverage" scale={1.6}>
 *   <CoverageDiagram shell={shell} />
 * </GameDiagramWrapper>
 * ```
 */
export function GameDiagramWrapper({
  children,
  scale = 1.4,
  maxWidth = 900,
  className = "",
  variant = "default",
}: GameDiagramWrapperProps) {
  // Calculate the container height to accommodate scaled content
  // Base diagram is ~280px, so at 1.4x scale we need ~392px of space
  const containerHeight = Math.round(280 * scale) + 20;

  return (
    <div
      className={`diagram-wrapper w-full mx-auto flex justify-center items-start ${className}`}
      style={{
        maxWidth: `${maxWidth}px`,
        boxSizing: "border-box",
        // Provide enough height for the scaled diagram
        height: `${containerHeight}px`,
      }}
    >
      <div
        className="diagram-inner"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default GameDiagramWrapper;

