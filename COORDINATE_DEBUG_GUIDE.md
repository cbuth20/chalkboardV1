# Coordinate Debugging Guide

## Recent Fixes

### ✅ 1. Zoom Only on Shift+Scroll
**Change:** Zoom now only activates when holding Shift while scrolling

**Benefits:**
- Regular scrolling doesn't interfere with clicking players
- No accidental zoom when interacting with field
- More predictable behavior

**Usage:**
- **Regular scroll**: Page scroll (no zoom)
- **Shift + scroll**: Zoom in/out

---

### 🔍 2. Enhanced Coordinate Debugging
**Added:**
- Real-time SVG coordinate display in debug overlay
- Detailed console logging when drawing routes
- Better tracking of coordinate transformations

---

## How to Debug Route Drawing

### Step 1: Enable Debug Mode
```
1. Press Shift+D to show debug overlay
2. Debug panel appears in top-right corner
```

### Step 2: Test Route Drawing with Logging
```
1. With debug enabled, click on a player to start drawing
2. Move mouse to draw route
3. Open browser console (F12)
4. Look for logs like:
   🎯 Coordinate Calculation: {
     screen: { x: 500, y: 300 },
     rect: { ... },
     normalized: { x: 0.5, y: 0.25 },
     viewBox: { width: 100, height: 120 },
     panOffset: { x: 0, y: 0 },
     zoom: 1,
     result: { x: 50, y: 30 }
   }
```

### Step 3: Verify Coordinates
The debug overlay shows:
- **Zoom**: Current zoom level
- **Pan**: Current pan offset
- **SVG Coords**: Where the cursor is in SVG space
  - X should be 0-100
  - Y should be 0-120

### Expected Values
For a normal 100x120 field:
- **Top-left**: (0, 0)
- **Top-center**: (50, 0)
- **Center**: (50, 60)
- **Bottom-center**: (50, 120)

### What to Check
1. **Without zoom/pan:**
   - Move cursor to center of field
   - SVG coords should be ~(50, 60)

2. **With zoom:**
   - Zoom in (Shift+scroll)
   - SVG coords should still match visual position

3. **With pan:**
   - Pan the field (drag background)
   - SVG coords should still match visual position

---

## Common Issues & What to Look For

### Issue: Route appears in wrong location

**Check in console logs:**
1. **Screen coords** - Are these correct? (Should match cursor position)
2. **Normalized coords** - Should be 0-1 range
3. **ViewBox dimensions** - Should be `100/zoom` and `120/zoom`
4. **Result coords** - Do these match where you clicked?

**Debugging steps:**
```
1. Click player at center of field (~50, 60)
2. Check console log for result coords
3. If result is NOT ~(50, 60), something's wrong
4. Check these values:
   - Is zoom = 1? (if not zoomed)
   - Is panOffset = {x: 0, y: 0}? (if not panned)
   - Is normalized ~(0.5, 0.5)? (for center)
```

### Issue: Route follows cursor but offset

**Likely causes:**
1. Pan offset not accounted for correctly
2. Zoom calculation incorrect
3. SVG rect is from wrong element

**Check:**
```
1. Enable debug overlay
2. Move cursor slowly across field
3. Watch "SVG Coords" in real-time
4. Coords should smoothly follow cursor position
```

### Issue: Route jumps or stutters

**Check:**
1. Distance throttling might be too aggressive (currently 2 units)
2. Coordinate calculations causing jumps

**To test:**
```
1. Draw route very slowly
2. Watch console logs
3. Look for sudden jumps in coordinates
```

---

## Testing Checklist

### ✅ Basic Zoom Test
- [ ] Scroll without Shift → No zoom
- [ ] Shift+Scroll → Smooth zoom
- [ ] Zoom centers on cursor position
- [ ] Debug overlay shows zoom value changing

### ✅ Route Drawing Test (No Zoom/Pan)
- [ ] Click player at center field
- [ ] Move cursor to different positions
- [ ] Route points follow cursor visually
- [ ] Debug coords match visual position
- [ ] Console logs show reasonable values

### ✅ Route Drawing Test (With Zoom)
- [ ] Zoom in (Shift+scroll)
- [ ] Click player
- [ ] Draw route
- [ ] Route still follows cursor correctly
- [ ] Debug coords adjust for zoom

### ✅ Route Drawing Test (With Pan)
- [ ] Pan field by dragging background
- [ ] Click player
- [ ] Draw route
- [ ] Route follows cursor correctly
- [ ] Debug coords adjust for pan

### ✅ Combined Test
- [ ] Zoom in
- [ ] Pan around
- [ ] Click player
- [ ] Draw route
- [ ] Everything still works

---

## Sample Console Output (What Good Looks Like)

```javascript
🎯 Coordinate Calculation: {
  screen: { x: 640, y: 384 },           // Mouse on screen
  rect: {
    left: 240,                          // SVG position on screen
    top: 144,
    width: 800,                         // SVG size
    height: 960
  },
  normalized: { x: 0.5, y: 0.25 },     // Cursor at 50% width, 25% height
  viewBox: { width: 100, height: 120 }, // No zoom (1x)
  panOffset: { x: 0, y: 0 },           // No pan
  zoom: 1,
  result: { x: 50, y: 30 }             // Final SVG coordinates
}
```

**Calculation verification:**
- normalized.x (0.5) × viewBox.width (100) + panOffset.x (0) = **50** ✓
- normalized.y (0.25) × viewBox.height (120) + panOffset.y (0) = **30** ✓

---

## If Route Is Still Wrong

### Collect this information:

1. **Screen recording** showing:
   - Where you click
   - Where route appears
   - Debug overlay visible

2. **Console logs** showing:
   - The coordinate calculations
   - Any errors

3. **Description:**
   - Is route offset consistently (e.g., always 10 units right)?
   - Does offset change with zoom?
   - Does offset change with pan?

### Quick Fix to Try

If route is consistently offset, the issue might be SVG rect calculation. Try this:

**In coordinateHelpers.ts, add:**
```typescript
// Force rect recalculation
svg.getBoundingClientRect(); // Call once
const rect = svg.getBoundingClientRect(); // Get fresh rect
```

---

## Advanced Debugging

### Add visual cursor indicator

To see exactly where the system thinks your cursor is, add to FieldCanvas:

```typescript
{/* Debug cursor dot */}
{showDebug && mousePos && (
  <circle
    cx={mousePos.x}
    cy={mousePos.y}
    r="1"
    fill="red"
    stroke="white"
    strokeWidth="0.2"
  />
)}
```

This will show a red dot where the system calculates your cursor to be.

---

## Summary of Changes

### Files Modified:
1. **useViewport.ts** - Zoom only on Shift+scroll
2. **coordinateHelpers.ts** - Added debug logging
3. **PlayBuilder.tsx** - Pass debug flag, track mouse coords
4. **DebugOverlay.tsx** - Enhanced display

### New Behavior:
- ✅ Zoom requires Shift key
- ✅ Detailed coordinate logging
- ✅ Real-time SVG coordinate display
- ✅ Better debugging tools

### Test Now:
1. Enable debug (Shift+D)
2. Try drawing a route
3. Check if coordinates look correct
4. Share console output if still issues
