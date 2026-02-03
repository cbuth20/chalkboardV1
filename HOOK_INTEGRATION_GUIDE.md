# Hook Integration Guide

## How to Integrate Extracted Hooks into PlayBuilder.tsx

This guide shows exactly how to replace the inline logic in `PlayBuilder.tsx` with the extracted hooks.

## Current Structure (Before)

```typescript
export function PlayBuilder({ onSave, onBack, ...props }: PlayBuilderProps) {
  // 27+ useState declarations
  const [playMode, setPlayMode] = useState<PlayMode>(...);
  const [offensePlayers, setOffensePlayers] = useState<DiagramPlayer[]>(...);
  // ... many more states

  // History management (lines 563-598)
  const saveToHistory = useCallback(() => { /* ... */ }, []);
  const undo = () => { /* ... */ };
  const redo = () => { /* ... */ };

  // Viewport management (lines 1035-1094)
  const resetView = () => { /* ... */ };
  const handleWheel = (event) => { /* ... */ };

  // Touch gestures (lines 1096-1178)
  const handleTouchStart = (event) => { /* ... */ };
  // ... etc

  // Player dragging (lines 729-764, 805-822)
  const handlePlayerMouseDown = (event, playerId, side) => { /* ... */ };

  // Route drawing (lines 680-721, 791-804, 826-838)
  const handleDeleteRoute = (playerId) => { /* ... */ };
  // ... etc

  // Massive render function (lines 1218-2605)
  return ( /* ... 1400 lines of JSX ... */ );
}
```

## New Structure (After)

```typescript
import {
  useHistory,
  useViewport,
  useTouchGestures,
  usePlayerDrag,
  useRouteDrawing
} from '@/components/play-builder/hooks';

export function PlayBuilder({ onSave, onBack, ...props }: PlayBuilderProps) {
  // Play state (keep for now, will move to usePlayBuilderState later)
  const [playMode, setPlayMode] = useState<PlayMode>(props.initialPlayData?.mode || 'pass');
  const [offensePlayers, setOffensePlayers] = useState<DiagramPlayer[]>(
    props.initialPlayData?.offensePlayers || INITIAL_OFFENSE
  );
  const [defensePlayers, setDefensePlayers] = useState<DiagramPlayer[]>(
    props.initialPlayData?.defensePlayers || INITIAL_DEFENSE
  );
  const [routes, setRoutes] = useState<DiagramRoute[]>(props.initialPlayData?.routes || []);
  const [lineOfScrimmage, setLineOfScrimmage] = useState(50);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Refs
  const fieldRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // HOOK 1: History (undo/redo)
  const history = useHistory(
    offensePlayers,
    setOffensePlayers,
    defensePlayers,
    setDefensePlayers,
    routes,
    setRoutes,
    props.initialPlayData
  );

  // HOOK 2: Viewport (zoom/pan)
  const viewport = useViewport();

  // HOOK 3: Touch Gestures (iPad support)
  const touch = useTouchGestures({
    zoom: viewport.zoom,
    setZoom: viewport.setZoom,
    panOffset: viewport.panOffset,
    setPanOffset: viewport.setPanOffset,
    isPanning: viewport.isPanning,
    setIsPanning: viewport.setIsPanning,
    panStartPos: viewport.panStartPos,
    setPanStartPos: viewport.setPanStartPos,
    playMode,
    fieldRef
  });

  // HOOK 4: Player Dragging
  const playerDrag = usePlayerDrag(
    offensePlayers,
    setOffensePlayers,
    defensePlayers,
    setDefensePlayers,
    lineOfScrimmage,
    history.saveSnapshot
  );

  // HOOK 5: Route Drawing
  const routeDrawing = useRouteDrawing(
    routes,
    setRoutes,
    offensePlayers,
    history.saveSnapshot
  );

  // Simplified handlers that delegate to hooks
  const handlePlayerMouseDown = (e: React.MouseEvent, playerId: string, side: 'offense' | 'defense') => {
    e.stopPropagation();
    if (props.viewOnly) return;

    // Defense always moves
    if (side === 'defense') {
      playerDrag.startDrag(playerId, side);
      return;
    }

    // Offense: determine if drawing route or moving player
    const shouldDrawRoute = touch.isTouchDevice
      ? (playMode === 'pass' && touch.touchMode === 'draw')
      : (playMode === 'pass' && !e.shiftKey);

    if (shouldDrawRoute) {
      const player = offensePlayers.find(p => p.id === playerId);
      if (player) {
        routeDrawing.startDrawing(playerId, { x: player.x, y: player.y });
      }
    } else {
      playerDrag.startDrag(playerId, side);
    }
  };

  const handleFieldMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getFieldCoordinates(e, fieldRef.current, viewport.zoom, viewport.panOffset, snapToGrid);
    if (!coords) return;

    // Handle panning
    if (viewport.isPanning) {
      viewport.handlePanMove(e.clientX, e.clientY);
      return;
    }

    // Handle route drawing
    if (routeDrawing.isDrawingRoute) {
      routeDrawing.addPoint(coords);
      return;
    }

    // Handle player dragging
    if (playerDrag.isDraggingPlayer) {
      playerDrag.updateDrag(coords);
    }
  };

  const handleFieldMouseUp = () => {
    routeDrawing.finishDrawing();
    playerDrag.endDrag();
    viewport.handlePanEnd();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history.undo, history.redo]);

  // Render (to be extracted into components)
  return (
    <div
      className="..."
      onTouchStart={touch.handleTouchStart}
      onTouchMove={touch.handleTouchMove}
      onTouchEnd={touch.handleTouchEnd}
      onWheel={viewport.handleWheel}
    >
      {/* Header, FormationBar, FieldCanvas, WidgetBar, Panels */}
    </div>
  );
}
```

## Detailed Replacement Map

### 1. Replace History Management

**Remove these (lines 551-598):**
```typescript
const [history, setHistory] = useState<HistoryState[]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);

const saveToHistory = useCallback(() => { /* ... */ }, []);
const undo = () => { /* ... */ };
const redo = () => { /* ... */ };
const canUndo = historyIndex > 0;
const canRedo = historyIndex < history.length - 1;
```

**Replace with:**
```typescript
const history = useHistory(
  offensePlayers,
  setOffensePlayers,
  defensePlayers,
  setDefensePlayers,
  routes,
  setRoutes,
  props.initialPlayData
);

// Use: history.saveSnapshot(), history.undo(), history.redo()
// Use: history.canUndo, history.canRedo
```

### 2. Replace Viewport Management

**Remove these (lines 527-531, 1035-1094):**
```typescript
const [zoom, setZoom] = useState(1);
const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);
const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

const resetView = () => { /* ... */ };
const handleWheel = (event: React.WheelEvent) => { /* ... */ };
```

**Replace with:**
```typescript
const viewport = useViewport();

// Use: viewport.zoom, viewport.panOffset
// Use: viewport.handleWheel, viewport.handlePanStart/Move/End
// Use: viewport.resetView()
```

### 3. Replace Touch Gestures

**Remove these (lines 532-541, 1083-1178):**
```typescript
const [touchState, setTouchState] = useState({ /* ... */ });
const [isTouchDevice, setIsTouchDevice] = useState(false);
const [touchMode, setTouchMode] = useState<'draw' | 'move'>('draw');

const handleTouchStart = (event: React.TouchEvent) => { /* ... */ };
const handleTouchMove = (event: React.TouchEvent) => { /* ... */ };
const handleTouchEnd = (event: React.TouchEvent) => { /* ... */ };
const getTouchDistance = (touch1, touch2) => { /* ... */ };
const getTouchCenter = (touch1, touch2) => { /* ... */ };
```

**Replace with:**
```typescript
const touch = useTouchGestures({
  zoom: viewport.zoom,
  setZoom: viewport.setZoom,
  panOffset: viewport.panOffset,
  setPanOffset: viewport.setPanOffset,
  isPanning: viewport.isPanning,
  setIsPanning: viewport.setIsPanning,
  panStartPos: viewport.panStartPos,
  setPanStartPos: viewport.setPanStartPos,
  playMode,
  fieldRef
});

// Use: touch.isTouchDevice, touch.touchMode
// Use: touch.handleTouchStart/Move/End
```

### 4. Replace Player Dragging

**Remove these (lines 516-519):**
```typescript
const [isDraggingPlayer, setIsDraggingPlayer] = useState(false);
const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
const [draggedPlayerSide, setDraggedPlayerSide] = useState<'offense' | 'defense' | null>(null);
```

**Update `handlePlayerMouseDown` (lines 729-764):**
```typescript
// Old code sets drag state directly
setIsDraggingPlayer(true);
setDraggedPlayerId(playerId);
setDraggedPlayerSide(side);

// New code delegates to hook
playerDrag.startDrag(playerId, side);
```

**Update `handleFieldMouseMove` (lines 805-822):**
```typescript
// Old code updates player positions directly with LOS checks
if (isDraggingPlayer && draggedPlayerId && draggedPlayerSide) {
  const losY = LOS_OPTIONS.find(opt => opt.value === lineOfScrimmage)?.y || 60;
  // ... constraint logic ...
}

// New code delegates to hook
if (playerDrag.isDraggingPlayer) {
  playerDrag.updateDrag(coords);
}
```

**Update `handleFieldMouseUp` (lines 840-849):**
```typescript
// Old code resets drag state and saves history
if (isDraggingPlayer) {
  saveToHistory();
}
setIsDraggingPlayer(false);
setDraggedPlayerId(null);
setDraggedPlayerSide(null);

// New code delegates to hook
playerDrag.endDrag();
```

### 5. Replace Route Drawing

**Remove these (lines 511-513, 546):**
```typescript
const [isDrawingRoute, setIsDrawingRoute] = useState(false);
const [currentRoutePoints, setCurrentRoutePoints] = useState<{x: number, y: number}[]>([]);
const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
const [copiedRoute, setCopiedRoute] = useState<DiagramRoute | null>(null);
```

**Remove these functions (lines 680-721):**
```typescript
const handleDeleteRoute = (playerId: string) => { /* ... */ };
const handleCopyRoute = (playerId: string) => { /* ... */ };
const handlePasteRoute = (playerId: string) => { /* ... */ };
```

**Replace with:**
```typescript
const routeDrawing = useRouteDrawing(
  routes,
  setRoutes,
  offensePlayers,
  history.saveSnapshot
);

// Use: routeDrawing.isDrawingRoute, routeDrawing.selectedPlayer
// Use: routeDrawing.copyRoute(), routeDrawing.pasteRoute(), routeDrawing.deleteRoute()
// Use: routeDrawing.routeByPlayerId for O(1) lookups
```

**Update route lookup in render (lines 2535-2579):**
```typescript
// BEFORE: O(n) lookup for every player
{offensePlayers.map(player => {
  const hasRoute = routes.some(r => r.playerId === player.id);  // ❌ O(n)
  return <PlayerCircle key={player.id} hasRoute={hasRoute} />;
})}

// AFTER: O(1) lookup with memoized map
{offensePlayers.map(player => {
  const hasRoute = routeDrawing.routeByPlayerId[player.id] !== undefined;  // ✅ O(1)
  return <PlayerCircle key={player.id} hasRoute={hasRoute} />;
})}
```

## Import Replacements

**Remove these imports (top of file):**
```typescript
// These are now in extracted utils
const OFFENSIVE_FORMATIONS = { /* ... */ };
const DEFENSIVE_FORMATIONS = { /* ... */ };
const INITIAL_OFFENSE = [ /* ... */ ];
const INITIAL_DEFENSE = [ /* ... */ ];
const LOS_OPTIONS = [ /* ... */ ];
const ROUTE_TEMPLATES = [ /* ... */ ];
```

**Add these imports:**
```typescript
import {
  useHistory,
  useViewport,
  useTouchGestures,
  usePlayerDrag,
  useRouteDrawing
} from '@/components/play-builder/hooks';

import {
  OFFENSIVE_FORMATIONS,
  DEFENSIVE_FORMATIONS,
  INITIAL_OFFENSE,
  INITIAL_DEFENSE,
  LOS_OPTIONS,
  ROUTE_TEMPLATES,
  getFieldCoordinates
} from '@/components/play-builder/utils';

import type {
  BuiltPlayData,
  FloatingPanelType,
  RouteTemplate,
  HistoryState
} from '@/components/play-builder/types';
```

## Testing After Integration

1. **Test History:**
   - Draw a route, press Cmd+Z → should undo
   - Press Cmd+Shift+Z → should redo
   - Move a player, undo → should move back

2. **Test Viewport:**
   - Shift+scroll → should zoom
   - Click and drag background → should pan
   - Double-click field → should reset

3. **Test Touch (on iPad):**
   - Pinch → should zoom
   - Double-tap → should reset
   - Touch mode toggle → should switch between draw/move

4. **Test Player Drag:**
   - Shift+drag offense player → should move (respecting LOS)
   - Drag defense player → should move (respecting LOS)
   - Try to drag offense player past LOS → should constrain

5. **Test Route Drawing:**
   - Click and drag from player → should draw route
   - Check route list → should show new route
   - Copy/paste route → should work
   - Delete route → should remove

## Performance Validation

Use React DevTools Profiler:

1. **Before integration:**
   - Draw a route: note render count and time
   - Move mouse over field: note render frequency

2. **After integration:**
   - Same actions should show:
     - Fewer renders (hooks isolate state changes)
     - Faster render time (memoized route lookups)
     - Smoother interaction (distance throttling)

Expected improvements:
- Route drawing: ~80% reduction in render time
- Mouse movement: ~85% fewer unnecessary renders
- Overall responsiveness: significantly better

## Common Issues

### Issue: "routeByPlayerId is undefined"
**Solution:** Make sure you're using the hook return value:
```typescript
const routeDrawing = useRouteDrawing(...);
// Use: routeDrawing.routeByPlayerId
```

### Issue: "LOS constraints not working"
**Solution:** Ensure you're passing the correct lineOfScrimmage value:
```typescript
const playerDrag = usePlayerDrag(
  offensePlayers,
  setOffensePlayers,
  defensePlayers,
  setDefensePlayers,
  lineOfScrimmage,  // ✅ Make sure this is defined
  history.saveSnapshot
);
```

### Issue: "Touch gestures not working"
**Solution:** Make sure you're applying handlers to the container:
```typescript
<div
  onTouchStart={touch.handleTouchStart}
  onTouchMove={touch.handleTouchMove}
  onTouchEnd={touch.handleTouchEnd}
>
```

### Issue: "Undo/redo keyboard shortcuts not working"
**Solution:** Add the useEffect for keyboard listeners (shown above)

## Next Steps After Integration

Once the hooks are integrated:

1. Extract `FieldCanvas` component (use `routeByPlayerId` for lookups)
2. Extract panel components
3. Add `React.memo()` to components
4. Add `useCallback()` to remaining handlers
5. Profile with React DevTools to verify improvements

---

**Remember:** The goal is to make the code more maintainable while fixing bugs. Take it step by step, test thoroughly after each change.
