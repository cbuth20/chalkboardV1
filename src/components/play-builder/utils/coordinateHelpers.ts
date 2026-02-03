// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert screen coordinates to SVG field coordinates
 */
export function getFieldCoordinates(
  event: { clientX: number; clientY: number },
  svg: SVGSVGElement | null,
  zoom: number,
  panOffset: { x: number; y: number },
  snapToGrid: boolean = false,
  debug: boolean = false
): { x: number; y: number } | null {
  if (!svg) return null;

  // Use SVG's built-in coordinate transformation
  // This properly handles all transformations including viewBox
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  // Get the inverse of the screen CTM (current transformation matrix)
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;

  // Transform screen coordinates to SVG coordinates
  const svgPoint = point.matrixTransform(ctm.inverse());

  let x = svgPoint.x;
  let y = svgPoint.y;

  if (debug) {
    console.log('🎯 Coordinate Calculation (SVG Transform):', {
      screen: { x: event.clientX, y: event.clientY },
      svgPoint: { x: svgPoint.x, y: svgPoint.y },
      viewBox: svg.viewBox.baseVal,
      zoom,
      panOffset,
      result: { x, y }
    });
  }

  if (snapToGrid) {
    return {
      x: Math.round(x / 2) * 2,
      y: Math.round(y / 2) * 2
    };
  }

  return { x, y };
}

/**
 * Calculate distance between two touch points
 */
export function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate center point between two touches
 */
export function getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total route distance
 */
export function calculateRouteDistance(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(points[i - 1], points[i]);
  }
  return total;
}
