// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK DIAGRAM — Public exports
//
// All field geometry derived from @/lib/field (FIELD_SPEC) for regulation accuracy.
// ═══════════════════════════════════════════════════════════════════════════

// Main component
export { PlayField } from './PlayField';

// Sub-components (for advanced composition)
export { DiagramBackground } from './DiagramBackground';
export { DiagramYardLines } from './DiagramYardLines';
export { DiagramHashMarks } from './DiagramHashMarks';
export { DiagramNumbers } from './DiagramNumbers';
export { DiagramLOS } from './DiagramLOS';
export { OffenseLayer } from './OffenseLayer';
export { DefenseLayer } from './DefenseLayer';
export { RoutesLayer } from './RoutesLayer';
export { BlockingLayer } from './BlockingLayer';
export { BallCarrierLayer } from './BallCarrierLayer';
export { DebugOverlay } from './DebugOverlay';

// Types
export type {
  Point,
  HashType,
  PlayMode,
  PlayerSide,
  DiagramPlayer,
  DiagramRoute,
  BlockingAssignment,
  BallCarrierPath,
  DiagramTheme,
  PlayFieldProps,
  // Re-exported from @/lib/field
  FieldPoint,
  ViewBox,
  HashStandard,
} from './types';

// Theme
export { DEFAULT_DIAGRAM_THEME } from './types';

// Re-export field utilities for convenience
export {
  FIELD_DIMENSIONS,
  HASHMARKS,
  DEFAULT_PLAY_WINDOW,
  createViewBox,
} from '@/lib/field';







