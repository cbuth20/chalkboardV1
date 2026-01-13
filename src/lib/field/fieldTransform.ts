// ═══════════════════════════════════════════════════════════════════════════════════════════
// FIELD TRANSFORM — Deterministic coordinate transforms for field rendering
//
// This module provides transforms between:
// 1. Field coordinates (yards) - the canonical coordinate system
// 2. SVG coordinates (viewBox units) - for rendering
// 3. Pixel coordinates - for interaction (clicks, etc.)
//
// IMPORTANT: All transforms are DETERMINISTIC. Same input = same output, always.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import { FieldPoint, ViewBox, FIELD_DIMENSIONS } from './fieldSpec';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PIXEL COORDINATE TYPE
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * A point in pixel coordinates (screen space).
 */
export type PixelPoint = {
  /** X position in pixels */
  px: number;
  /** Y position in pixels */
  py: number;
};

/**
 * Container dimensions for pixel transforms.
 */
export type ContainerDimensions = {
  /** Container width in pixels */
  width: number;
  /** Container height in pixels */
  height: number;
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// YARD <-> SVG TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Convert field coordinates (yards) to SVG coordinates.
 * 
 * In our system, SVG viewBox uses the same unit scale as yards (1:1 mapping).
 * This function is essentially an identity transform, but exists for:
 * 1. Semantic clarity
 * 2. Future-proofing if we need to add transformations
 * 3. Type safety (FieldPoint -> SVG coordinate)
 */
export function yardToSvg(point: FieldPoint): FieldPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

/**
 * Convert SVG coordinates to field coordinates (yards).
 * Inverse of yardToSvg.
 */
export function svgToYard(point: FieldPoint): FieldPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SVG <-> PIXEL TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Convert SVG coordinates to pixel coordinates.
 * 
 * This accounts for:
 * - viewBox offset (minX, minY)
 * - viewBox size vs container size (scaling)
 * - preserveAspectRatio behavior (assumes xMidYMid meet)
 * 
 * @param svg - Point in SVG/yard coordinates
 * @param viewBox - Current viewBox [minX, minY, width, height]
 * @param container - Container dimensions in pixels
 * @returns Point in pixel coordinates
 */
export function svgToPixel(
  svg: FieldPoint,
  viewBox: ViewBox,
  container: ContainerDimensions
): PixelPoint {
  const [minX, minY, vbWidth, vbHeight] = viewBox;

  // Calculate scale factor (preserveAspectRatio: xMidYMid meet)
  const scaleX = container.width / vbWidth;
  const scaleY = container.height / vbHeight;
  const scale = Math.min(scaleX, scaleY); // "meet" uses the smaller scale

  // Calculate offset to center the content (xMidYMid)
  const scaledWidth = vbWidth * scale;
  const scaledHeight = vbHeight * scale;
  const offsetX = (container.width - scaledWidth) / 2;
  const offsetY = (container.height - scaledHeight) / 2;

  // Transform: subtract viewBox origin, scale, add centering offset
  const px = (svg.x - minX) * scale + offsetX;
  const py = (svg.y - minY) * scale + offsetY;

  return { px, py };
}

/**
 * Convert pixel coordinates to SVG/yard coordinates.
 * Inverse of svgToPixel.
 * 
 * @param pixel - Point in pixel coordinates
 * @param viewBox - Current viewBox [minX, minY, width, height]
 * @param container - Container dimensions in pixels
 * @returns Point in SVG/yard coordinates
 */
export function pixelToSvg(
  pixel: PixelPoint,
  viewBox: ViewBox,
  container: ContainerDimensions
): FieldPoint {
  const [minX, minY, vbWidth, vbHeight] = viewBox;

  // Calculate scale factor (same as svgToPixel)
  const scaleX = container.width / vbWidth;
  const scaleY = container.height / vbHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate offset (same as svgToPixel)
  const scaledWidth = vbWidth * scale;
  const scaledHeight = vbHeight * scale;
  const offsetX = (container.width - scaledWidth) / 2;
  const offsetY = (container.height - scaledHeight) / 2;

  // Inverse transform: subtract offset, divide by scale, add viewBox origin
  const x = (pixel.px - offsetX) / scale + minX;
  const y = (pixel.py - offsetY) / scale + minY;

  return { x, y };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// YARD <-> PIXEL CONVENIENCE TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Convert field coordinates (yards) directly to pixel coordinates.
 */
export function yardToPixel(
  yard: FieldPoint,
  viewBox: ViewBox,
  container: ContainerDimensions
): PixelPoint {
  const svg = yardToSvg(yard);
  return svgToPixel(svg, viewBox, container);
}

/**
 * Convert pixel coordinates directly to field coordinates (yards).
 */
export function pixelToYard(
  pixel: PixelPoint,
  viewBox: ViewBox,
  container: ContainerDimensions
): FieldPoint {
  const svg = pixelToSvg(pixel, viewBox, container);
  return svgToYard(svg);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Clamp a field point to stay within valid field bounds.
 */
export function clampToField(point: FieldPoint): FieldPoint {
  return {
    x: Math.max(0, Math.min(FIELD_DIMENSIONS.LENGTH_YARDS, point.x)),
    y: Math.max(0, Math.min(FIELD_DIMENSIONS.WIDTH_YARDS, point.y)),
  };
}

/**
 * Snap a field point to the nearest yard grid.
 * @param point - Point in yard coordinates
 * @param gridSize - Grid size in yards (default 1)
 */
export function snapToYardGrid(point: FieldPoint, gridSize: number = 1): FieldPoint {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Snap to half-yard grid for more precise placement.
 */
export function snapToHalfYard(point: FieldPoint): FieldPoint {
  return snapToYardGrid(point, 0.5);
}

/**
 * Calculate the distance between two field points in yards.
 */
export function distanceYards(p1: FieldPoint, p2: FieldPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the angle from p1 to p2 in degrees.
 * 0° = right (positive X), 90° = down (positive Y)
 */
export function angleDegrees(from: FieldPoint, to: FieldPoint): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

/**
 * Calculate pixels per yard at the current zoom level.
 * Useful for sizing elements that should be consistent regardless of zoom.
 */
export function getPixelsPerYard(viewBox: ViewBox, container: ContainerDimensions): number {
  const [, , vbWidth, vbHeight] = viewBox;
  const scaleX = container.width / vbWidth;
  const scaleY = container.height / vbHeight;
  return Math.min(scaleX, scaleY);
}

/**
 * Check if a point is within the visible viewBox.
 */
export function isPointVisible(point: FieldPoint, viewBox: ViewBox, margin: number = 0): boolean {
  const [minX, minY, width, height] = viewBox;
  return (
    point.x >= minX - margin &&
    point.x <= minX + width + margin &&
    point.y >= minY - margin &&
    point.y <= minY + height + margin
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TRANSFORM FACTORY
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Create a transform object bound to specific viewBox and container dimensions.
 * Useful for components that need to do many transforms with the same parameters.
 */
export function createFieldTransform(viewBox: ViewBox, container: ContainerDimensions) {
  return {
    yardToPixel: (yard: FieldPoint) => yardToPixel(yard, viewBox, container),
    pixelToYard: (pixel: PixelPoint) => pixelToYard(pixel, viewBox, container),
    pixelsPerYard: getPixelsPerYard(viewBox, container),
    isVisible: (point: FieldPoint, margin?: number) => isPointVisible(point, viewBox, margin),
    clamp: clampToField,
    snap: snapToYardGrid,
  };
}

export type FieldTransform = ReturnType<typeof createFieldTransform>;
