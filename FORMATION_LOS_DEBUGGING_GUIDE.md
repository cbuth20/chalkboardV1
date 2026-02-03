# Formation & LOS Changes - Debugging Guide

## What Was Fixed

### Issue: Formation and LOS changes weren't updating player positions

**Root Cause:**
The `useCallback` handlers were depending on the entire `state` object, which gets recreated on every render (since `usePlayBuilderState` returns a new object literal). This caused:
1. Handlers to be recreated on every render
2. Potential stale closure issues
3. Unnecessary re-renders of FormationBar

**Solution:**
Fixed the `useCallback` dependencies to only include:
- The specific setter functions (e.g., `state.setOffensePlayers`)
- The `history.saveSnapshot` function

This makes the handlers more stable and prevents recreation on every render.

---

## Changes Made

### PlayBuilder.tsx

**handleOffensiveFormationChange:**
- **Before:** `[state, history]` dependencies
- **After:** `[state.setOffensiveFormation, state.setOffensePlayers, history.saveSnapshot]`
- Only depends on the stable setter functions, not the entire state object

**handleDefensiveFormationChange:**
- **Before:** `[state, history]` dependencies
- **After:** `[state.setDefensiveFormation, state.setDefensePlayers, history.saveSnapshot]`

**handleLineOfScrimmageChange:**
- **Before:** `[state, history]` dependencies
- **After:** `[state.setLineOfScrimmage, state.setOffensePlayers, state.setDefensePlayers, history.saveSnapshot]`
- Removed unnecessary `state.offensePlayers` and `state.defensePlayers` from dependencies since we're using the updater function form

---

## How to Test

### Step 1: Open PlayBuilder
1. Navigate to the learning center
2. Click "Create New Play"
3. The PlayBuilder should open

### Step 2: Test Formation Changes

#### Test Offensive Formation:
1. Open browser console (F12)
2. Look for the "Offensive Formation" dropdown at the top
3. Current selection should be "Pro Set" (default)
4. Select "Shotgun" from the dropdown

**Expected Console Output:**
```
==================================================
🏈 OFFENSIVE FORMATION CHANGE TRIGGERED
Formation name: Shotgun
Preset found: true
Preset structure: {qb: {…}, rb: {…}, ...}
Preset keys: ['qb', 'rb', 'fb', 'wr1', 'wr2', 'wr3', 'lt', 'lg', 'c', 'rg', 'rt']
Inside setOffensePlayers callback
Previous players: [{id: 'qb', x: 50, y: 65, ...}, ...]
Player qb: {currentPos: {x: 50, y: 65}, presetPos: {x: 50, y: 70}, willUpdate: true}
Player rb: {currentPos: {x: 45, y: 70}, presetPos: {x: 45, y: 70}, willUpdate: true}
... (for each player)
Updated players: [{id: 'qb', x: 50, y: 70, ...}, ...]
Players actually changed: true
✅ Formation change complete
==================================================
```

**Expected Visual Result:**
- QB should move back from y=65 to y=70 (5 yards deeper)
- RB should stay at same depth y=70
- All other offensive players should update to Shotgun positions

#### Test Defensive Formation:
1. Select different defensive formations from "Defensive Formation" dropdown
2. Current options: "4-3", "3-4", "Nickel (4-2-5)", etc.

**Expected Console Output:**
```
🛡️ Changing defensive formation to: 3-4
📍 Applying preset: {cb1: {…}, cb2: {…}, ...}
  Moving cb1 to (30, 48)
  Moving cb2 to (70, 48)
  ... (for each player)
✅ Updated defense players: [{...}]
```

**Expected Visual Result:**
- All defensive players should move to their new formation positions

---

### Step 3: Test LOS Changes

1. Look for the "Line of Scrimmage" dropdown
2. Current options:
   - Own 20 (value: 20, y: 80)
   - Own 40 (value: 40, y: 70)
   - 50 Yard Line (value: 50, y: 60)
   - Opp 40 (value: 60, y: 50)
   - Opp 20 / Red Zone (value: 80, y: 30)

3. Select "Opp 20 (Red Zone)"

**Expected Console Output:**
```
==================================================
📏 LOS CHANGE TRIGGERED
New LOS value: 80
LOS option found: {label: 'Opp 20 / Red Zone', value: 80, y: 30}
LOS Y coordinate: 30
Processing offense players: [{id: 'qb', y: 65}, ...]
  Offense qb: moving from y=65 to y=31
  Offense rb: moving from y=70 to y=31
  ... (for players that need to move)
Offense updated: true
Processing defense players: [{id: 'cb1', y: 48}, ...]
  Defense cb1: moving from y=48 to y=29
  ... (for players that need to move)
Defense updated: true
✅ LOS change complete
==================================================
```

**Expected Visual Result:**
- Yellow LOS line should move up the field to y=30
- All offensive players should be at y ≥ 31 (at least 1 yard behind LOS)
- All defensive players should be at y ≤ 29 (at least 1 yard in front of LOS)
- Players should visibly shift positions on the field

---

## Troubleshooting

### Issue: No Console Logs Appear

**Diagnosis:** The handlers aren't being called

**Possible Causes:**
1. Dropdown onChange event not firing
2. Handler not wired up correctly to FormationBar
3. FormationBar React.memo blocking updates

**Debug Steps:**
1. Check if clicking the dropdown shows options
2. Check if the dropdown value changes when you select an option
3. Add a console.log directly in FormationBar's onChange:
   ```typescript
   onChange={(e) => {
     console.log('Dropdown changed to:', e.target.value);
     onOffensiveFormationChange(e.target.value);
   }}
   ```

---

### Issue: Console Logs Appear But Players Don't Move

**Diagnosis:** State updates are happening but UI isn't re-rendering

**Possible Causes:**
1. React.memo on FieldCanvas blocking updates
2. Array reference not changing (React thinks nothing changed)
3. FieldCanvas not receiving updated props

**Debug Steps:**
1. Check the "Updated players" log - does it show "Players actually changed: true"?
2. Enable debug overlay (Shift+D) and watch the player positions
3. Check if FieldCanvas is receiving new props:
   ```typescript
   // In FieldCanvas.tsx
   useEffect(() => {
     console.log('FieldCanvas received new offensePlayers:', offensePlayers);
   }, [offensePlayers]);
   ```

---

### Issue: Only Some Players Move

**Diagnosis:** Player IDs don't match preset keys

**Debug Steps:**
1. Check the console logs for "Player X: willUpdate: false"
2. If willUpdate is false, the player ID doesn't exist in the preset
3. Verify player IDs match:
   - Offense: qb, rb, fb, wr1, wr2, wr3, lt, lg, c, rg, rt
   - Defense: cb1, cb2, fs, ss, mlb, wlb, slb, de1, de2, dt1, dt2

---

### Issue: Players Move to Wrong Positions

**Diagnosis:** Preset coordinates are incorrect or LOS constraint is overriding

**Debug Steps:**
1. Check the "presetPos" values in console - are they reasonable?
2. Check if LOS constraints are moving players after formation is applied
3. Verify coordinates:
   - X should be 0-100 (field width)
   - Y should be 0-120 (field length)
   - Offense should be y > LOS
   - Defense should be y < LOS

---

## Known Player IDs and Presets

### Offense Players (INITIAL_OFFENSE)
```
qb  → Quarterback  → group: backfield
rb  → Running Back → group: backfield
fb  → Fullback     → group: backfield
wr1 → Wide Receiver 1 → group: skill
wr2 → Wide Receiver 2 → group: skill
wr3 → Wide Receiver 3 → group: skill
lt  → Left Tackle  → group: line
lg  → Left Guard   → group: line
c   → Center       → group: line
rg  → Right Guard  → group: line
rt  → Right Tackle → group: line
```

### Defense Players (INITIAL_DEFENSE)
```
cb1 → Cornerback 1      → group: secondary
cb2 → Cornerback 2      → group: secondary
fs  → Free Safety       → group: secondary
ss  → Strong Safety     → group: secondary
mlb → Middle Linebacker → group: linebacker
wlb → Will Linebacker   → group: linebacker
slb → Sam Linebacker    → group: linebacker
de1 → Defensive End 1   → group: line
de2 → Defensive End 2   → group: line
dt1 → Defensive Tackle 1 → group: line
dt2 → Defensive Tackle 2 → group: line
```

### Formation Presets Available

**Offensive:**
- Pro Set
- Shotgun
- I-Formation
- Singleback
- Pistol
- Spread
- Trips Right
- Trips Left
- Empty
- Wing-T

**Defensive:**
- 4-3
- 3-4
- Nickel (4-2-5)
- Dime (4-1-6)
- Quarter (4-0-7)
- 46 Defense
- 5-2
- Cover 2
- Cover 3

---

## Expected Behavior Summary

### Formation Change:
1. User selects new formation from dropdown
2. Handler logs change to console
3. Preset positions loaded from OFFENSIVE_FORMATIONS or DEFENSIVE_FORMATIONS
4. History snapshot saved (for undo)
5. Each player mapped to new position from preset
6. Console logs each player's movement
7. FieldCanvas receives updated players array
8. Players render at new positions

### LOS Change:
1. User selects new LOS value from dropdown
2. Handler logs change to console
3. LOS Y coordinate calculated from LOS_OPTIONS
4. History snapshot saved (for undo)
5. Offensive players: Ensure y ≥ losY + 1
6. Defensive players: Ensure y ≤ losY - 1
7. Players moved if violating constraints
8. FieldCanvas receives updated players
9. Yellow LOS line and players render at new positions

---

## What to Share If Still Not Working

If formations/LOS still don't work after these fixes, please share:

1. **Full console output** when changing a formation
2. **Any error messages** in the console
3. **What you see visually** - do players move at all?
4. **Which formation** you're trying to change (offensive or defensive)
5. **Which dropdown value** you selected

This will help identify if it's:
- Handler not being called (no logs)
- State not updating (logs but no array change)
- UI not re-rendering (state changes but visual stays same)
- Coordinates wrong (players move to wrong spots)

---

## Files Modified

- **PlayBuilder.tsx** - Fixed useCallback dependencies for handlers
  - Lines 174-219: handleOffensiveFormationChange
  - Lines 221-243: handleDefensiveFormationChange
  - Lines 245-297: handleLineOfScrimmageChange

The fix ensures handlers are stable across renders and properly update player positions when formations or LOS changes.
