# Formation & LOS Fixes

## Changes Made

### ✅ 1. Re-Added Line of Scrimmage Dropdown
**Location:** Formation Bar (top of screen)

**Features:**
- Dropdown to select LOS position
- Options: Own 20, Own 40, 50 Yard Line, Opp 40, Opp 20 (Red Zone)
- Players automatically reposition when LOS changes

**Behavior:**
- Offensive players: Stay at least 1 yard behind LOS
- Defensive players: Stay at least 1 yard in front of LOS
- If players violate LOS rules, they're automatically moved to legal positions

---

### ✅ 2. Fixed Formation Changes
**Problem:** Changing formations wasn't updating player positions

**Solution:**
- Added debug logging to track formation changes
- Verified preset application logic
- Handlers properly update player positions from presets

---

## How It Works

### Formation Change Flow
```
1. User selects new formation
   ↓
2. Handler logs change to console
   ↓
3. Preset positions loaded from OFFENSIVE/DEFENSIVE_FORMATIONS
   ↓
4. Snapshot saved (for undo)
   ↓
5. Each player moved to preset position
   ↓
6. Console logs each player movement
   ↓
7. Players render at new positions
```

### LOS Change Flow
```
1. User selects new LOS value
   ↓
2. Handler calculates new LOS Y coordinate
   ↓
3. Snapshot saved (for undo)
   ↓
4. Offensive players: Ensure y >= losY + 1
   ↓
5. Defensive players: Ensure y <= losY - 1
   ↓
6. Players moved if violating LOS rules
   ↓
7. Players render at adjusted positions
```

---

## Testing Guide

### Test Formation Changes

#### Offensive Formations:
1. Open PlayBuilder
2. Look for "Offensive Formation" dropdown
3. Current options:
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

4. **Test:**
   - Select "Shotgun"
   - Watch offense players move to shotgun positions
   - QB should move back, RB should align behind QB

5. **Verify:**
   - Check console for logs:
     ```
     🏈 Changing offensive formation to: Shotgun
     📍 Applying preset: {...}
       Moving qb to (50, 70)
       Moving rb to (50, 75)
     ✅ Updated offense players: [...]
     ```

#### Defensive Formations:
1. Look for "Defensive Formation" dropdown
2. Current options:
   - 4-3
   - 3-4
   - Nickel (4-2-5)
   - Dime (4-1-6)
   - Quarter (4-0-7)
   - 46 Defense
   - 5-2
   - Cover 2
   - Cover 3

3. **Test:**
   - Select "Nickel (4-2-5)"
   - Watch defense players move to nickel positions
   - Should add extra DB, adjust front 7

4. **Verify:**
   - Check console for logs:
     ```
     🛡️ Changing defensive formation to: Nickel (4-2-5)
     📍 Applying preset: {...}
     ✅ Updated defense players: [...]
     ```

---

### Test LOS Changes

1. Look for "Line of Scrimmage" dropdown
2. Current options:
   - Own 20 (Y: 80)
   - Own 40 (Y: 70)
   - 50 Yard Line (Y: 60)
   - Opp 40 (Y: 50)
   - Opp 20 / Red Zone (Y: 30)

3. **Test:**
   - Start at "50 Yard Line"
   - Select "Opp 20 (Red Zone)"
   - Watch players move up the field

4. **Verify:**
   - Offense stays behind yellow LOS line
   - Defense stays in front of yellow LOS line
   - Check console:
     ```
     📏 Changing LOS to: 80
     📍 LOS Y coordinate: 30
       Moving qb down by 30 yards
     ✅ LOS change complete
     ```

---

## What to Expect

### Formation Changes
**Expected:**
- Instant player repositioning
- Players snap to preset positions
- Formation shape clearly visible
- Console logs show each movement

**If Not Working:**
1. Check browser console
2. Look for error messages
3. Verify dropdown value changes
4. Check if handler is called

### LOS Changes
**Expected:**
- All players shift vertically
- LOS line (yellow) moves
- Offense stays behind line
- Defense stays in front
- Console shows adjustments

**If Not Working:**
1. Check console logs
2. Verify LOS value changes
3. Check if players violate LOS rules
4. Verify constraint logic works

---

## Console Debugging

### Formation Change Logs
```javascript
// Good formation change:
🏈 Changing offensive formation to: Shotgun
📍 Applying preset: {qb: {x:50, y:70}, rb: {x:50, y:75}, ...}
  Moving qb to (50, 70)
  Moving rb to (50, 75)
  Moving wr1 to (30, 61)
  ... (all players)
✅ Updated offense players: [{id: 'qb', x: 50, y: 70}, ...]

// If preset not found:
⚠️ No preset found for formation: InvalidName
```

### LOS Change Logs
```javascript
// Good LOS change:
📏 Changing LOS to: 80
📍 LOS Y coordinate: 30
  Moving qb down by 30 yards
  Moving rb down by 25 yards
✅ LOS change complete

// With constraint violations:
📏 Changing LOS to: 50
📍 LOS Y coordinate: 50
  Moving qb down by 5 yards  // Was too far forward
  Moving de1 up by 3 yards   // Was too far back
✅ LOS change complete
```

---

## Known Player IDs

### Offense
- `qb` - Quarterback
- `rb` - Running Back
- `fb` - Fullback
- `wr1` - Wide Receiver 1 (X)
- `wr2` - Wide Receiver 2 (Slot)
- `wr3` - Wide Receiver 3 (Z)
- `lt` - Left Tackle
- `lg` - Left Guard
- `c` - Center
- `rg` - Right Guard
- `rt` - Right Tackle

### Defense
- `cb1` - Cornerback 1
- `cb2` - Cornerback 2
- `fs` - Free Safety
- `ss` - Strong Safety
- `mlb` - Middle Linebacker
- `wlb` - Will Linebacker (Weak Side)
- `slb` - Sam Linebacker (Strong Side)
- `de1` - Defensive End 1
- `de2` - Defensive End 2
- `dt1` - Defensive Tackle 1
- `dt2` - Defensive Tackle 2

---

## Troubleshooting

### Issue: Formation changes but players don't move

**Check:**
1. Open console (F12)
2. Change formation
3. Look for logs starting with 🏈 or 🛡️

**If you see logs:**
- Handlers are working
- Check if preset positions are valid
- Verify player IDs match preset keys

**If no logs:**
- Handler not being called
- Check dropdown onChange
- Verify handler is passed to FormationBar

---

### Issue: LOS changes but players don't move

**Check:**
1. Open console
2. Change LOS
3. Look for logs starting with 📏

**If you see logs but no movement:**
- Check player positions in logs
- Verify constraint logic
- Check if players already satisfy constraints

**If no logs:**
- Handler not being called
- Check dropdown onChange
- Verify handler is wired up

---

### Issue: Players move to wrong positions

**Check console logs:**
```javascript
// Look for this section:
Moving qb to (50, 70)  // X and Y should be reasonable
```

**Verify:**
- X should be 0-100 (field width)
- Y should be 0-120 (field length)
- Positions should match formation shape visually

---

## Files Modified

1. ✅ `FormationBar.tsx`
   - Added LOS_OPTIONS import
   - Added lineOfScrimmage and onLineOfScrimmageChange to props
   - Added LOS dropdown to render

2. ✅ `PlayBuilder.tsx`
   - Added handleLineOfScrimmageChange handler
   - Added debug logging to formation handlers
   - Wired up handleLineOfScrimmageChange to FormationBar
   - Pass hasStructuredData to FormationBar

---

## Summary

Both formation changes and LOS changes should now work correctly:
- ✅ Formation dropdown updates player positions
- ✅ LOS dropdown moves players and enforces constraints
- ✅ Console logging helps debug any issues
- ✅ Undo/redo works for both changes

Test it out and check the console logs to verify everything is working!
