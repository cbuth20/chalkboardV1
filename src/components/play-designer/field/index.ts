// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL FIELD COMPONENTS — Barrel export for the field system
// ═══════════════════════════════════════════════════════════════════════════

// Main component
export { FootballField, PlayerMarker, RouteLine } from './FootballField';
export type { PlayerMarkerProps, RouteLineProps } from './FootballField';

// Subcomponents
export { FieldBackground } from './FieldBackground';
export { YardLines } from './YardLines';
export { HashMarks } from './HashMarks';
export { Numbers } from './Numbers';
export { LOSLine } from './LOSLine';
export { Grid } from './Grid';
export { ZoomControls } from './ZoomControls';

// Hooks
export { useViewState, useFieldGestures } from './useViewState';

// Geometry utilities
export {
  FIELD_DIMENSIONS,
  HASH_MARKS,
  NUMBERS,
  ALIGNMENT_PRESETS,
  DEFAULT_VIEW_STATE,
  yardToSvgX,
  yardToSvgY,
  yardToSvg,
  svgToYardX,
  svgToYardY,
  svgToYard,
  snapToYard,
  snapToHalfYard,
  clampToField,
  getHashY,
  getAllHashY,
  getYardLinePositions,
  getMajorYardLinePositions,
  yardLineToNumber,
  isMajorYardLine,
  centerOnLOS,
  viewStateToTransform,
  clampScale,
  distanceYards,
  angleDegrees,
} from './geometry';

// Types
export type {
  Point,
  HashType,
  ViewState,
  PlayerSide,
  Player,
  RoutePoint,
  Route,
  FieldTheme,
  FootballFieldProps,
  FieldBackgroundProps,
  YardLinesProps,
  HashMarksProps,
  NumbersProps,
  LOSLineProps,
  GridProps,
  PlayersProps,
  RoutesProps,
  ZoomControlsProps,
  UseViewStateReturn,
  UseViewStateOptions,
} from './types';

export { DEFAULT_THEME } from './types';








