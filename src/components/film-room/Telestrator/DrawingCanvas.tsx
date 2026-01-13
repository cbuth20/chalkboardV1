"use client";

// ═══════════════════════════════════════════════════════════════════════════
// DRAWING CANVAS — Interactive SVG Drawing Surface
// Handles mouse/touch events for telestrator drawing
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback, useEffect } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import type { DrawingElement } from '../types';

interface DrawingCanvasProps {
  width: number;
  height: number;
  className?: string;
}

export function DrawingCanvas({ width, height, className = '' }: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);

  const { telestratorState, addElement, playerState } = useFilmRoom();

  // Get mouse position relative to SVG
  const getMousePosition = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height,
      };
    },
    [width, height]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!playerState.showTelestrator) return;

      const pos = getMousePosition(e);

      if (telestratorState.tool === 'text') {
        setTextInput({ x: pos.x, y: pos.y, value: '' });
        return;
      }

      setIsDrawing(true);
      setCurrentPoints([pos]);
    },
    [getMousePosition, telestratorState.tool, playerState.showTelestrator]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;

      const pos = getMousePosition(e);

      // For shapes that only need start and end points
      if (['arrow', 'line', 'circle', 'rectangle'].includes(telestratorState.tool)) {
        setCurrentPoints((prev) => [prev[0], pos]);
      } else {
        setCurrentPoints((prev) => [...prev, pos]);
      }
    },
    [isDrawing, getMousePosition, telestratorState.tool]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    const element: DrawingElement = {
      id: `draw-${Date.now()}`,
      type: telestratorState.tool,
      points: currentPoints,
      color: telestratorState.color,
      strokeWidth: telestratorState.strokeWidth,
      opacity: 1,
    };

    addElement(element);
    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, telestratorState, addElement]);

  // Handle text submit
  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }

    const element: DrawingElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      points: [{ x: textInput.x, y: textInput.y }],
      color: telestratorState.color,
      strokeWidth: telestratorState.strokeWidth,
      opacity: 1,
      text: textInput.value.trim(),
    };

    addElement(element);
    setTextInput(null);
  }, [textInput, telestratorState, addElement]);

  // Keyboard events for text input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInput) {
        if (e.key === 'Enter') {
          handleTextSubmit();
        } else if (e.key === 'Escape') {
          setTextInput(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [textInput, handleTextSubmit]);

  // Render current drawing preview
  const renderPreview = () => {
    if (!isDrawing || currentPoints.length === 0) return null;

    const { tool, color, strokeWidth } = telestratorState;

    switch (tool) {
      case 'pen':
      case 'route': {
        const pathData = currentPoints.reduce((acc, point, i) => {
          return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
        }, '');
        return (
          <path
            d={pathData}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={tool === 'route' ? '8 4' : 'none'}
            opacity={0.8}
          />
        );
      }

      case 'arrow':
      case 'line': {
        if (currentPoints.length < 2) return null;
        const start = currentPoints[0];
        const end = currentPoints[currentPoints.length - 1];
        return (
          <>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={0.8}
            />
            {tool === 'arrow' && (
              <ArrowHead
                x={end.x}
                y={end.y}
                angle={Math.atan2(end.y - start.y, end.x - start.x)}
                color={color}
              />
            )}
          </>
        );
      }

      case 'circle': {
        if (currentPoints.length < 2) return null;
        const cx = (currentPoints[0].x + currentPoints[1].x) / 2;
        const cy = (currentPoints[0].y + currentPoints[1].y) / 2;
        const rx = Math.abs(currentPoints[1].x - currentPoints[0].x) / 2;
        const ry = Math.abs(currentPoints[1].y - currentPoints[0].y) / 2;
        return (
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.8}
          />
        );
      }

      case 'rectangle': {
        if (currentPoints.length < 2) return null;
        const x = Math.min(currentPoints[0].x, currentPoints[1].x);
        const y = Math.min(currentPoints[0].y, currentPoints[1].y);
        const w = Math.abs(currentPoints[1].x - currentPoints[0].x);
        const h = Math.abs(currentPoints[1].y - currentPoints[0].y);
        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            rx={4}
            opacity={0.8}
          />
        );
      }

      default:
        return null;
    }
  };

  if (!playerState.showTelestrator) return null;

  return (
    <div className={`absolute inset-0 ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Existing Elements */}
        {telestratorState.elements.map((element) => (
          <DrawingElementRenderer key={element.id} element={element} />
        ))}

        {/* Current Drawing Preview */}
        {renderPreview()}
      </svg>

      {/* Text Input Overlay */}
      {textInput && (
        <div
          className="absolute"
          style={{ left: textInput.x, top: textInput.y, transform: 'translate(-50%, -50%)' }}
        >
          <input
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onBlur={handleTextSubmit}
            autoFocus
            className="px-2 py-1 rounded bg-black/80 border border-[#00F6E5]/50 text-white text-sm focus:outline-none min-w-[100px]"
            style={{ color: telestratorState.color }}
            placeholder="Enter text..."
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAWING ELEMENT RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function DrawingElementRenderer({ element }: { element: DrawingElement }) {
  const { type, points, color, strokeWidth, text, playerLabel } = element;

  if (points.length === 0) return null;

  switch (type) {
    case 'pen':
    case 'route': {
      const pathData = points.reduce((acc, point, i) => {
        return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
      }, '');
      return (
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={type === 'route' ? '8 4' : 'none'}
        />
      );
    }

    case 'arrow':
    case 'line': {
      if (points.length < 2) return null;
      const start = points[0];
      const end = points[points.length - 1];
      return (
        <g>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {type === 'arrow' && (
            <ArrowHead
              x={end.x}
              y={end.y}
              angle={Math.atan2(end.y - start.y, end.x - start.x)}
              color={color}
            />
          )}
        </g>
      );
    }

    case 'circle': {
      if (points.length < 2) return null;
      const cx = (points[0].x + points[1].x) / 2;
      const cy = (points[0].y + points[1].y) / 2;
      const rx = Math.abs(points[1].x - points[0].x) / 2;
      const ry = Math.abs(points[1].y - points[0].y) / 2;
      return (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );
    }

    case 'rectangle': {
      if (points.length < 2) return null;
      const x = Math.min(points[0].x, points[1].x);
      const y = Math.min(points[0].y, points[1].y);
      const w = Math.abs(points[1].x - points[0].x);
      const h = Math.abs(points[1].y - points[0].y);
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          rx={4}
        />
      );
    }

    case 'playerSpot': {
      return (
        <g>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r={16}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
          {playerLabel && (
            <text
              x={points[0].x}
              y={points[0].y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {playerLabel}
            </text>
          )}
        </g>
      );
    }

    case 'text': {
      return (
        <text
          x={points[0].x}
          y={points[0].y}
          fill={color}
          fontSize="16"
          fontWeight="bold"
        >
          {text}
        </text>
      );
    }

    default:
      return null;
  }
}

function ArrowHead({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const size = 12;
  const x1 = x - size * Math.cos(angle - Math.PI / 6);
  const y1 = y - size * Math.sin(angle - Math.PI / 6);
  const x2 = x - size * Math.cos(angle + Math.PI / 6);
  const y2 = y - size * Math.sin(angle + Math.PI / 6);

  return <polygon points={`${x},${y} ${x1},${y1} ${x2},${y2}`} fill={color} />;
}

export default DrawingCanvas;








