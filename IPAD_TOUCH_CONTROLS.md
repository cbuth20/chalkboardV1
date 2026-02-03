# iPad Touch Controls Guide

## Overview

PlayBuilder now has full iPad/touch screen support with intuitive gestures for all interactions.

---

## Touch Modes

### Toggle at Bottom Left
- **✏️ Draw Mode** - For drawing routes on offense players
- **✋ Move Mode** - For repositioning players

**Auto-switching:**
- Pass play → Defaults to Draw mode
- Run play → Defaults to Move mode

---

## Gestures

### Navigation & Zoom

**Pinch to Zoom**
- Two fingers: Pinch in/out
- Zooms toward the center point between your fingers
- Range: 0.5x to 2x

**Pan/Scroll**
- Single finger drag on field background
- Moves the view around when zoomed in
- Constrained to prevent going too far off-screen

**Double-tap**
- Quickly tap field twice
- Resets zoom to 1x and centers view

### Drawing Routes (Draw Mode)

**Start Route**
1. Tap offensive player (QB, WR, RB, etc.)
2. Route drawing starts

**Draw Route**
1. Keep finger down and drag
2. Route follows your finger
3. Creates smooth path

**Finish Route**
1. Lift finger
2. Route is saved

**Tips:**
- Works just like mouse click-and-drag
- Route starts from player position
- Distance throttling keeps routes smooth

### Moving Players (Move Mode)

**Move Player**
1. Tap and hold player
2. Drag to new position
3. Release to place

**Constraints:**
- Offense players: Stay behind LOS
- Defense players: Stay in front of LOS

**Tips:**
- Switch to Move mode or works automatically in Run plays
- All players (offense & defense) can be moved

---

## Technical Details

### Touch Event Handling

**Single Touch:**
- On player → Start drawing (Draw mode) or moving (Move mode)
- On field → Pan view (when not drawing/moving)
- On field → Draw route points (when drawing)

**Two Finger Touch:**
- Always triggers pinch zoom
- Overrides other gestures

**Touch-to-Mouse Conversion:**
- Touch events converted to synthetic mouse events
- Same coordinate system as mouse
- Works with existing route/drag logic

### Preventing Conflicts

**`touchAction: 'none'`:**
- Applied to SVG and player elements
- Prevents default browser behaviors
- Stops accidental scrolling during drawing

**Event Prevention:**
- Multi-touch on field → Container handles (zoom/pan)
- Single touch on player → Player interaction
- Single touch while drawing → Route continues

---

## Visual Feedback

### Touch Mode Indicator
Located at bottom left (only on touch devices):
```
┌──────────────────┐
│ ✏️ Draw  ✋ Move │
└──────────────────┘
```

### Player States
- **Normal** - Cyan circle (offense) or red (defense)
- **Being dragged** - White circle with glow
- **Drawing route** - White circle with glow
- **Has route** - Brighter cyan (#3DF3FF)

---

## Known Behaviors

### Auto Mode Switching
- Pass play selected → Auto-switches to Draw mode
- Run play selected → Auto-switches to Move mode
- Can manually override with toggle

### Gesture Priority
1. **Two-finger pinch** → Always zoom
2. **Touch player** → Draw/move player
3. **Touch field** → Pan view

### Route Drawing
- Only works on offense players
- Only works with skill positions (QB, WR, RB, TE)
- Can't draw routes on O-line

---

## Troubleshooting

### Routes not drawing
- Check you're in **Draw mode** (✏️)
- Make sure you're touching an offensive player
- Player must be routable (not O-line)

### Players not moving
- Check you're in **Move mode** (✋)
- Or play mode is set to Run (auto-switches)

### Can't zoom
- Use **two fingers** for pinch
- Single finger won't zoom

### Accidental panning
- This happens when touching empty field
- To draw routes, touch player first
- To move players, switch to Move mode

### View stuck/offset
- Double-tap field to reset
- Or use two-finger pinch to zoom out

---

## Comparison: Mouse vs Touch

| Action | Mouse | Touch |
|--------|-------|-------|
| Draw Route | Click player, drag, release | Tap player, drag, lift |
| Move Player | Shift+click, drag | Move mode: tap, drag |
| Zoom | Shift+scroll | Two-finger pinch |
| Pan | Removed (scroll only) | Single-finger drag |
| Reset View | Double-click field | Double-tap field |

---

## Tips for Best Experience

1. **Use landscape mode** for more screen space
2. **Zoom in** for precise route drawing
3. **Switch modes** explicitly if auto-switching is confusing
4. **Double-tap to reset** if view gets messy
5. **Two-finger pinch** is your friend for navigation

---

## Implementation Notes

### Files Modified
1. **FieldCanvas.tsx**
   - Added touch event handlers
   - Converts touch to synthetic mouse events
   - Added `touchAction: 'none'` to prevent conflicts

2. **useTouchGestures.ts**
   - Already had pinch-zoom
   - Already had pan gesture
   - Already had touch detection

3. **PlayBuilder.tsx**
   - Passes touch props to FieldCanvas
   - Wires up touch mode toggle

### Key Features
- ✅ Touch device detection
- ✅ Mode switching (draw/move)
- ✅ Pinch to zoom
- ✅ Pan with single finger
- ✅ Route drawing on touch
- ✅ Player movement on touch
- ✅ Double-tap to reset
- ✅ Prevents text selection
- ✅ Prevents default scrolling

---

## Future Enhancements

Potential improvements:
- Three-finger pan (keep two-finger for zoom)
- Long-press for player menu
- Haptic feedback on player selection
- Touch-optimized UI sizing
- Gesture hints/tutorial
