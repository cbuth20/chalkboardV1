// ═══════════════════════════════════════════════════════════════════════════════════════════
// FIELD MODULE — Barrel export for field geometry and transforms
//
// This is the single import point for all field-related utilities.
// Usage: import { FIELD_DIMENSIONS, yardToPixel } from '@/lib/field';
// ═══════════════════════════════════════════════════════════════════════════════════════════

// Field specification constants
export {
  // Dimensions
  FIELD_DIMENSIONS,
  
  // Hashmarks
  HASHMARKS,
  getHashmarkPositions,
  getCenterY,
  
  // Yard lines
  YARDLINES,
  getYardLinePositions,
  isLabeledYardLine,
  yardLineToDisplayNumber,
  
  // Sideline numbers
  NUMBERS,
  
  // Play window / viewport
  DEFAULT_PLAY_WINDOW,
  createViewBox,
  
  // Types
  type FieldPoint,
  type ViewBox,
  type HashStandard,
  
  // Summary for documentation
  FIELD_SPEC_SUMMARY,
} from './fieldSpec';

// Coordinate transforms
export {
  // Yard <-> SVG
  yardToSvg,
  svgToYard,
  
  // SVG <-> Pixel
  svgToPixel,
  pixelToSvg,
  
  // Yard <-> Pixel (convenience)
  yardToPixel,
  pixelToYard,
  
  // Utilities
  clampToField,
  snapToYardGrid,
  snapToHalfYard,
  distanceYards,
  angleDegrees,
  getPixelsPerYard,
  isPointVisible,
  
  // Factory
  createFieldTransform,
  
  // Types
  type PixelPoint,
  type ContainerDimensions,
  type FieldTransform,
} from './fieldTransform';
