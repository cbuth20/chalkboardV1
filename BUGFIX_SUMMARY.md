# Bug Fixes Summary

## Issues Fixed

### 1. ✅ Passive Event Listener Error
**Error:** `Unable to preventDefault inside passive event listener invocation`

**Root Cause:** React's synthetic events use passive listeners by default, which prevents `preventDefault()` from working.

**Fix:**
- Added `containerRef` to `useViewport` hook
- Registered wheel event listener directly with `{ passive: false }` option
- Removed `onWheel` prop from JSX, now handled via addEventListener

**Files Modified:**
- `src/components/play-builder/hooks/useViewport.ts`
- `src/components/play-recognition/PlayBuilder.tsx`

---

### 2. ✅ Missing setSelectedPlayer Function
**Error:** `state.setSelectedPlayer is not a function`

**Root Cause:** `selectedPlayer` state was missing from `usePlayBuilderState` hook

**Fix:**
- Added `selectedPlayer: string | null` state to interface
- Added `setSelectedPlayer` setter to interface
- Implemented state variable in hook
- Added to return statement

**Files Modified:**
- `src/components/play-builder/hooks/usePlayBuilderState.ts`

---

### 3. ✅ Improved Zoom Functionality

**Issues:**
- Zoom sensitivity too high
- Zoom not centered on cursor
- Zoom jumping to top-left

**Fixes:**
1. **Reduced Sensitivity:**
   - Changed delta from `0.05` to `0.03` for smoother control

2. **Proper Zoom-to-Cursor:**
   - Calculate normalized mouse position (0-1)
   - Find point in current viewBox under cursor
   - Calculate new viewBox dimensions
   - Adjust pan offset to keep cursor point stationary

3. **Better Coordinate Calculation:**
   - Use `e.currentTarget` instead of `e.target` for consistent rect
   - Calculate viewBox coordinates properly
   - Update both zoom and panOffset together

**Files Modified:**
- `src/components/play-builder/hooks/useViewport.ts`

---

## Testing Tools Added

### Debug Overlay Component
**Location:** `src/components/play-builder/DebugOverlay.tsx`

**Features:**
- Real-time display of:
  - Current zoom level
  - Pan offset
  - Drawing/dragging/panning states
  - Selected player
  - Route count
  - Mouse position (when available)

**Usage:**
- Press **Shift+D** to toggle the debug overlay
- Overlay appears in top-right corner
- Non-interactive (pointer-events: none)

**Benefits:**
- See exact state values in real-time
- Verify zoom/pan calculations
- Debug interaction states
- Understand what's happening during clicks/drags

---

## Testing Guide

### How to Test More Effectively

#### 1. Enable Debug Overlay
```
1. Open the PlayBuilder
2. Press Shift+D to show debug info
3. Watch values change as you interact
```

#### 2. Test Zoom Functionality
```
Test Steps:
1. Enable debug overlay (Shift+D)
2. Move mouse over different parts of field
3. Scroll to zoom in/out
4. Watch:
   - Zoom value should change smoothly
   - Pan offset should adjust
   - Area under cursor should stay stationary

Expected:
- Zoom changes by 0.03 per scroll tick
- Pan offset adjusts to keep cursor point stable
- No jumping or sudden movements
```

#### 3. Test Route Drawing
```
Test Steps:
1. Enable debug overlay
2. Click on an offensive player
3. Watch "Drawing Route" indicator turn ✅
4. Watch "Selected" show player ID
5. Move mouse to draw
6. Release to finish

Expected:
- Route starts from player's position, not mouse click
- Route follows mouse movement
- Route completes on mouse up
```

#### 4. Test Player Dragging
```
Test Steps:
1. Hold Shift
2. Click and drag a player
3. Watch "Dragging Player" turn ✅
4. Release to finish

Expected:
- Player moves with cursor
- Offensive players stay ≥1 yard behind LOS
- Defensive players stay ≥1 yard in front of LOS
```

#### 5. Test Double-Click
```
Test Steps:
1. Double-click on a player
2. Watch selected player change
3. Verify Player Actions panel opens
4. No errors in console

Expected:
- No ViewBox NaN errors
- Player Actions panel opens
- Field double-click doesn't trigger
```

---

## Console Logging for Advanced Debugging

### Add to PlayBuilder for detailed logging:

```typescript
// Add after hook initialization
useEffect(() => {
  console.log('🎯 State Update:', {
    zoom: viewport.zoom,
    panOffset: viewport.panOffset,
    isDrawing: routeDrawing.isDrawingRoute,
    selectedPlayer: state.selectedPlayer
  });
}, [viewport.zoom, viewport.panOffset, routeDrawing.isDrawingRoute, state.selectedPlayer]);
```

### Add to useViewport for zoom debugging:

```typescript
// Inside handleWheel, after calculations
console.log('🔍 Zoom Debug:', {
  oldZoom: zoom,
  newZoom,
  mousePos: { x: mouseX, y: mouseY },
  normalized: { x: normalizedX, y: normalizedY },
  point: { x: pointX, y: pointY },
  newPan: { x: newPanX, y: newPanY }
});
```

---

## Common Issues & Solutions

### Issue: Zoom still feels off
**Check:**
- Debug overlay shows correct zoom values
- Pan offset is adjusting
- No console errors

**Solutions:**
1. Adjust delta in `useViewport.ts` (currently 0.03)
2. Check if viewBox calculation is correct
3. Verify container rect is accurate

### Issue: Routes still draw from wrong position
**Check:**
- Debug overlay shows correct selected player
- Player position in state matches visual position

**Solutions:**
1. Verify `state.offensePlayers.find()` is finding the right player
2. Check player ID matches between visual and state
3. Add console.log in handlePlayerMouseDown

### Issue: Double-click still causes errors
**Check:**
- Error message in console
- Debug overlay shows state changes

**Solutions:**
1. Verify e.stopPropagation() is being called
2. Check event is being passed to handler
3. Ensure field double-click has target check

---

## Performance Monitoring

### React DevTools Profiler
```
1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with play builder
5. Stop recording
6. Analyze render times

Look for:
- Excessive re-renders
- Long render times
- Components rendering unnecessarily
```

### Browser Performance Tab
```
1. Open DevTools → Performance
2. Click Record
3. Zoom/pan/draw routes
4. Stop recording
5. Check for:
   - Frame drops
   - Long tasks
   - Memory issues
```

---

## Next Steps for Further Debugging

1. **If zoom issues persist:**
   - Log every value in zoom calculation
   - Test with different viewBox dimensions
   - Verify SVG coordinate system

2. **If route drawing issues persist:**
   - Log player position vs route start
   - Verify coordinate transformation
   - Check if player state is stale

3. **If performance issues:**
   - Use React Profiler
   - Check for missing memoization
   - Verify React.memo() is working

---

## Files Modified in This Session

- `src/components/play-builder/hooks/useViewport.ts` - Fixed zoom and passive listener
- `src/components/play-builder/hooks/usePlayBuilderState.ts` - Added selectedPlayer
- `src/components/play-builder/components/FieldCanvas.tsx` - Updated event handlers
- `src/components/play-recognition/PlayBuilder.tsx` - Multiple fixes
- `src/components/play-builder/DebugOverlay.tsx` - NEW debug tool

---

## Quick Reference

### Keyboard Shortcuts
- **Shift+D** - Toggle debug overlay
- **Cmd+Z** - Undo
- **Cmd+Shift+Z** - Redo
- **Shift+Drag** - Move player instead of drawing route

### Debug Overlay Indicators
- ✅ = Active/True
- ❌ = Inactive/False
- Values update in real-time

### Common Debug Workflow
1. Press Shift+D to enable overlay
2. Perform action
3. Watch state changes
4. Check for unexpected values
5. Review console for errors
6. Adjust and retry
