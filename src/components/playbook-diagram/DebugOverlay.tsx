// ═══════════════════════════════════════════════════════════════════════════
// DEBUG OVERLAY — Validation overlay for field regulation compliance
//
// Shows:
// - Cursor position in yard coordinates
// - LOS position marker
// - Hash mark positions (with labels)
// - 5-yard grid confirmation
// - Field spec summary
//
// Toggle with showDebug prop on PlayField component.
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { DiagramTheme, HashType } from './types';
import {
  FIELD_DIMENSIONS,
  HASHMARKS,
  NUMBERS,
  DEFAULT_PLAY_WINDOW,
  type ViewBox,
  type HashStandard,
} from '@/lib/field';

export type DebugOverlayProps = {
  viewBox: ViewBox;
  theme: DiagramTheme;
  hashType: HashType;
  losY: number;
  /** Container ref for mouse position calculation */
  containerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * DebugOverlay renders validation information for field regulation compliance.
 * Useful for verifying that hash marks, yard lines, and coordinates are correct.
 */
export const DebugOverlay = memo(function DebugOverlay({
  viewBox,
  theme,
  hashType,
  losY,
  containerRef,
}: DebugOverlayProps) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [minX, minY, width, height] = viewBox;
  const maxX = minX + width;
  const maxY = minY + height;

  // Get hash positions from FIELD_SPEC
  const hashSpec = HASHMARKS[hashType as HashStandard] || HASHMARKS.NFL;
  const leftHashY = hashSpec.LEFT_HASH_Y;
  const rightHashY = hashSpec.RIGHT_HASH_Y;
  const centerY = FIELD_DIMENSIONS.WIDTH_YARDS / 2;

  // Handle mouse move to track cursor position in yard coordinates
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // Calculate scale (preserveAspectRatio: xMidYMid meet)
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate offset for centering
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    // Convert pixel position to yard coordinates
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const x = (px - offsetX) / scale + minX;
    const y = (py - offsetY) / scale + minY;

    setMousePos({ x, y });
  }, [containerRef, viewBox, minX, minY, width, height]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, containerRef]);

  return (
    <g className="debug-overlay">
      {/* Hash mark position labels */}
      <g className="hash-labels">
        {/* Left hash label */}
        {leftHashY >= minY && leftHashY <= maxY && (
          <text
            x={minX + 1}
            y={leftHashY - 0.5}
            fill="#FF6B6B"
            fontSize={0.7}
            fontFamily="monospace"
            fontWeight="600"
          >
            LEFT HASH Y={leftHashY.toFixed(2)}
          </text>
        )}
        {/* Right hash label */}
        {rightHashY >= minY && rightHashY <= maxY && (
          <text
            x={minX + 1}
            y={rightHashY + 1}
            fill="#FF6B6B"
            fontSize={0.7}
            fontFamily="monospace"
            fontWeight="600"
          >
            RIGHT HASH Y={rightHashY.toFixed(2)}
          </text>
        )}
        {/* Center line label */}
        {centerY >= minY && centerY <= maxY && (
          <text
            x={maxX - 12}
            y={centerY + 0.3}
            fill="#4ECDC4"
            fontSize={0.6}
            fontFamily="monospace"
            fontWeight="600"
          >
            CENTER Y={centerY.toFixed(2)}
          </text>
        )}
      </g>

      {/* LOS marker with label */}
      <g className="los-marker">
        <text
          x={maxX - 8}
          y={losY - 0.5}
          fill={theme.losColor}
          fontSize={0.7}
          fontFamily="monospace"
          fontWeight="700"
        >
          LOS Y={losY}
        </text>
      </g>

      {/* Cursor crosshair and coordinates */}
      {mousePos && mousePos.x >= minX && mousePos.x <= maxX && mousePos.y >= minY && mousePos.y <= maxY && (
        <g className="cursor-marker">
          {/* Vertical crosshair line */}
          <line
            x1={mousePos.x}
            y1={minY}
            x2={mousePos.x}
            y2={maxY}
            stroke="rgba(255, 107, 107, 0.3)"
            strokeWidth="0.05"
            strokeDasharray="0.3 0.2"
          />
          {/* Horizontal crosshair line */}
          <line
            x1={minX}
            y1={mousePos.y}
            x2={maxX}
            y2={mousePos.y}
            stroke="rgba(255, 107, 107, 0.3)"
            strokeWidth="0.05"
            strokeDasharray="0.3 0.2"
          />
          {/* Coordinate readout */}
          <rect
            x={mousePos.x + 0.5}
            y={mousePos.y - 2}
            width={8}
            height={1.6}
            rx={0.2}
            fill="rgba(0, 0, 0, 0.85)"
            stroke="#FF6B6B"
            strokeWidth="0.05"
          />
          <text
            x={mousePos.x + 1}
            y={mousePos.y - 0.8}
            fill="#FF6B6B"
            fontSize={0.65}
            fontFamily="monospace"
            fontWeight="600"
          >
            X:{mousePos.x.toFixed(1)} Y:{mousePos.y.toFixed(1)}
          </text>
        </g>
      )}

      {/* Field spec info panel */}
      <g className="spec-panel">
        <rect
          x={minX + 0.5}
          y={maxY - 5}
          width={18}
          height={4.5}
          rx={0.3}
          fill="rgba(0, 0, 0, 0.85)"
          stroke="rgba(255, 107, 107, 0.5)"
          strokeWidth="0.05"
        />
        <text
          x={minX + 1}
          y={maxY - 4}
          fill="#FF6B6B"
          fontSize={0.55}
          fontFamily="monospace"
          fontWeight="700"
        >
          FIELD_SPEC DEBUG
        </text>
        <text
          x={minX + 1}
          y={maxY - 3}
          fill="#FFFFFF"
          fontSize={0.5}
          fontFamily="monospace"
        >
          Hash: {hashType} | Width: {FIELD_DIMENSIONS.WIDTH_YARDS.toFixed(1)}yd
        </text>
        <text
          x={minX + 1}
          y={maxY - 2.2}
          fill="#FFFFFF"
          fontSize={0.5}
          fontFamily="monospace"
        >
          ViewBox: [{minX},{minY},{width},{height}]
        </text>
        <text
          x={minX + 1}
          y={maxY - 1.4}
          fill="#4ECDC4"
          fontSize={0.5}
          fontFamily="monospace"
        >
          ✓ Coords in YARDS (regulation)
        </text>
      </g>

      {/* 10-yard grid reference markers */}
      <g className="grid-markers">
        {[30, 40, 50, 60, 70].map((x) => {
          if (x >= minX && x <= maxX) {
            return (
              <text
                key={`grid-${x}`}
                x={x}
                y={maxY - 0.5}
                fill="rgba(255, 255, 255, 0.3)"
                fontSize={0.5}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {x}yd
              </text>
            );
          }
          return null;
        })}
      </g>
    </g>
  );
});

export default DebugOverlay;
