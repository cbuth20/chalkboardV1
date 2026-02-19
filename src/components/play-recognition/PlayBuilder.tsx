"use client";

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import type { DiagramPlayer, DiagramRoute, BlockingAssignment, BallCarrierPath, PlayMode } from '@/components/playbook-diagram/types';
import type { SideOfBall, OffensivePlayType, DefensivePlayType } from '@/types/play-assignments';

// Import custom hooks
import {
  useHistory,
  useViewport,
  useTouchGestures,
  usePlayerDrag,
  useRouteDrawing,
  usePlayBuilderState
} from '../play-builder/hooks';

// Import components
import {
  FieldCanvas,
  FormationBar,
  WidgetBar,
  FloatingPanelContainer,
  PlayMetadataPanel,
  RouteManagementPanel,
  RouteTemplatesPanel,
  FieldControlsPanel,
  ExportPanel,
  PlayerActionsPanel,
  PlayerResponsibilitiesPanel,
  QuickGuidePanel
} from '../play-builder/components';
import { AssignmentPanel } from '../play-builder/AssignmentPanel';
import { DebugOverlay } from '../play-builder/DebugOverlay';

// Import utilities
import {
  OFFENSIVE_FORMATIONS,
  DEFENSIVE_FORMATIONS,
  INITIAL_OFFENSE,
  INITIAL_DEFENSE,
  LOS_OPTIONS,
  getFieldCoordinates
} from '../play-builder/utils';

// Import types
import type { RouteTemplate } from '../play-builder/types';
import { ROUTE_TEMPLATES } from '../play-builder/utils/routeTemplates';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (Re-export for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

export interface BuiltPlayData {
  mode: PlayMode;
  offensePlayers: DiagramPlayer[];
  defensePlayers: DiagramPlayer[];
  routes?: DiagramRoute[];
  blocking?: BlockingAssignment[];
  ballCarrierPath?: BallCarrierPath;
  metadata: {
    name: string;
    formation: string;
    concept: string;
    playType: 'PASS' | 'RUN' | 'RPO';
    strength: 'Right' | 'Left';
    personnel: string;
  };
}

export interface PlayBuilderProps {
  onSave: (playData: BuiltPlayData, metadata?: PlaybookMetadataInput) => void;
  onBack: () => void;
  orgId?: string;
  mode?: 'coach' | 'player';
  initialPlayData?: BuiltPlayData;
  viewOnly?: boolean;
  embedded?: boolean;
  situationalTags?: Array<{ id: string; name: string; category: string }>;
  conceptTags?: Array<{ id: string; name: string }>;
  formations?: Array<{ id: string; name: string; sideOfBall: SideOfBall }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PlayBuilder({
  onSave,
  onBack,
  orgId,
  mode = 'coach',
  initialPlayData,
  viewOnly = false,
  embedded = false,
  situationalTags = [],
  conceptTags = [],
  formations = []
}: PlayBuilderProps) {
  // Refs
  const fieldRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [debugMousePos, setDebugMousePos] = useState<{ x: number; y: number } | undefined>();

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOM HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  // Central state management
  const state = usePlayBuilderState(initialPlayData);

  // Destructure setters for stable references in useCallback dependencies
  const {
    setOffensePlayers,
    setDefensePlayers,
    setOffensiveFormation,
    setDefensiveFormation,
    setLineOfScrimmage
  } = state;

  // History management (undo/redo)
  const history = useHistory(
    state.offensePlayers,
    state.setOffensePlayers,
    state.defensePlayers,
    state.setDefensePlayers,
    state.routes,
    state.setRoutes,
    initialPlayData
  );

  // Viewport management (zoom/pan)
  const viewport = useViewport();

  // Touch gestures (iPad support)
  const touch = useTouchGestures({
    zoom: viewport.zoom,
    setZoom: viewport.setZoom,
    panOffset: viewport.panOffset,
    setPanOffset: viewport.setPanOffset,
    isPanning: viewport.isPanning,
    setIsPanning: viewport.setIsPanning,
    panStartPos: viewport.panStartPos,
    setPanStartPos: viewport.setPanStartPos,
    playMode: state.playMode,
    fieldRef
  });

  // Player dragging
  const playerDrag = usePlayerDrag(
    state.offensePlayers,
    state.setOffensePlayers,
    state.defensePlayers,
    state.setDefensePlayers,
    state.lineOfScrimmage,
    history.saveSnapshot
  );

  // Route drawing
  const routeDrawing = useRouteDrawing(
    state.routes,
    state.setRoutes,
    state.offensePlayers,
    history.saveSnapshot
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+D: Toggle debug overlay
      if (e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
      // Escape: Deselect player and close panels
      if (e.key === 'Escape') {
        if (state.selectedPlayer) {
          state.setSelectedPlayer(null);
        }
        if (state.activePanel) {
          state.setActivePanel(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedPlayer, state.activePanel, state.setSelectedPlayer, state.setActivePanel]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper to adjust routes when players move
  const adjustRoutesForPlayerMovement = useCallback((oldPlayers: DiagramPlayer[], newPlayers: DiagramPlayer[]) => {
    state.setRoutes(prevRoutes => {
      return prevRoutes.map(route => {
        const oldPlayer = oldPlayers.find(p => p.id === route.playerId);
        const newPlayer = newPlayers.find(p => p.id === route.playerId);

        if (!oldPlayer || !newPlayer) return route;

        // Calculate offset
        const dx = newPlayer.x - oldPlayer.x;
        const dy = newPlayer.y - oldPlayer.y;

        // If no movement, return original route
        if (dx === 0 && dy === 0) return route;

        console.log(`🔄 Adjusting route for ${route.playerId}: offset (${dx}, ${dy})`);

        // Adjust all route points by the offset
        return {
          ...route,
          points: route.points.map(point => ({
            x: point.x + dx,
            y: point.y + dy
          }))
        };
      });
    });
  }, [state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Formation handlers
  const handleOffensiveFormationChange = useCallback((formationName: string) => {
    console.log('='.repeat(50));
    console.log('🏈 OFFENSIVE FORMATION CHANGE TRIGGERED');
    console.log('Formation name:', formationName);

    setOffensiveFormation(formationName);
    const preset = OFFENSIVE_FORMATIONS[formationName];

    console.log('Preset found:', !!preset);
    console.log('Preset structure:', preset);
    console.log('Preset keys:', preset ? Object.keys(preset) : 'none');

    if (preset) {
      history.saveSnapshot();

      const oldPlayers = state.offensePlayers;
      setOffensePlayers(prev => {
        console.log('Inside setOffensePlayers callback');
        console.log('Previous players:', prev);

        const updated = prev.map(player => {
          const pos = preset[player.id as keyof typeof preset] as { x: number; y: number } | undefined;
          console.log(`Player ${player.id}:`, {
            currentPos: { x: player.x, y: player.y },
            presetPos: pos,
            willUpdate: !!pos
          });

          if (pos) {
            return { ...player, x: pos.x, y: pos.y };
          }
          return player;
        });

        console.log('Updated players:', updated);
        console.log('Players actually changed:', JSON.stringify(prev) !== JSON.stringify(updated));

        // Adjust routes after state update
        setTimeout(() => {
          adjustRoutesForPlayerMovement(oldPlayers, updated);
        }, 0);

        return updated;
      });

      console.log('✅ Formation change complete');
    } else {
      console.error('❌ No preset found for formation:', formationName);
      console.log('Available formations:', Object.keys(OFFENSIVE_FORMATIONS));
    }
    console.log('='.repeat(50));
  }, [setOffensiveFormation, setOffensePlayers, history.saveSnapshot]);

  const handleDefensiveFormationChange = useCallback((formationName: string) => {
    console.log('🛡️ Changing defensive formation to:', formationName);
    setDefensiveFormation(formationName);
    const preset = DEFENSIVE_FORMATIONS[formationName];
    if (preset) {
      console.log('📍 Applying preset:', preset);
      history.saveSnapshot();
      setDefensePlayers(prev => {
        const updated = prev.map(player => {
          const pos = preset[player.id as keyof typeof preset] as { x: number; y: number } | undefined;
          if (pos) {
            console.log(`  Moving ${player.id} to (${pos.x}, ${pos.y})`);
            return { ...player, x: pos.x, y: pos.y };
          }
          return player;
        });
        console.log('✅ Updated defense players:', updated);
        return updated;
      });
    } else {
      console.warn('⚠️ No preset found for formation:', formationName);
    }
  }, [setDefensiveFormation, setDefensePlayers, history.saveSnapshot]);

  const handleLineOfScrimmageChange = useCallback((losValue: number) => {
    console.log('='.repeat(50));
    console.log('📏 LOS CHANGE TRIGGERED');
    console.log('New LOS value:', losValue);
    console.log('Current LOS value:', state.lineOfScrimmage);

    const oldLosOption = LOS_OPTIONS.find(opt => opt.value === state.lineOfScrimmage);
    const newLosOption = LOS_OPTIONS.find(opt => opt.value === losValue);

    if (!newLosOption || !oldLosOption) {
      console.error('❌ LOS option not found');
      return;
    }

    const oldLosY = oldLosOption.y;
    const newLosY = newLosOption.y;
    const losYOffset = newLosY - oldLosY;

    console.log('Old LOS Y:', oldLosY, '→ New LOS Y:', newLosY, '(offset:', losYOffset, ')');

    if (losYOffset === 0) {
      console.log('⚠️ No LOS change needed');
      return;
    }

    history.saveSnapshot();
    setLineOfScrimmage(losValue);

    // Store old players for route adjustment
    const oldOffensePlayers = state.offensePlayers;
    const oldDefensePlayers = state.defensePlayers;

    // Move ALL offensive players by the LOS offset
    setOffensePlayers(prev => {
      console.log('Moving offense players by offset:', losYOffset);
      const updated = prev.map(player => {
        const newY = player.y + losYOffset;
        const minY = newLosY + 1; // Ensure they stay behind LOS
        const finalY = Math.max(newY, minY);

        console.log(`  Offense ${player.id}: ${player.y} → ${newY} (constrained to ${finalY})`);
        return { ...player, y: finalY };
      });

      // Adjust routes after state update
      setTimeout(() => {
        adjustRoutesForPlayerMovement(oldOffensePlayers, updated);
      }, 0);

      return updated;
    });

    // Move ALL defensive players by the LOS offset
    setDefensePlayers(prev => {
      console.log('Moving defense players by offset:', losYOffset);
      const updated = prev.map(player => {
        const newY = player.y + losYOffset;
        const maxY = newLosY - 1; // Ensure they stay in front of LOS
        const finalY = Math.min(newY, maxY);

        console.log(`  Defense ${player.id}: ${player.y} → ${newY} (constrained to ${finalY})`);
        return { ...player, y: finalY };
      });

      return updated;
    });

    console.log('✅ LOS change complete');
    console.log('='.repeat(50));
  }, [state.lineOfScrimmage, state.offensePlayers, state.defensePlayers, setLineOfScrimmage, setOffensePlayers, setDefensePlayers, history.saveSnapshot, adjustRoutesForPlayerMovement]);

  const handleFormationChange = useCallback((formationId: string) => {
    console.log('📋 handleFormationChange called with:', formationId);
    state.setSelectedFormationId(formationId);
    const formation = formations.find(f => f.id === formationId);

    if (!formation) {
      console.warn('⚠️ No formation found with id:', formationId);
      return;
    }

    console.log('📋 Found formation:', formation);
    state.setFormation(formation.name);

    // Apply preset positions based on formation name and side of ball
    const isOffense = formation.sideOfBall === 'offense';
    const presets = isOffense ? OFFENSIVE_FORMATIONS : DEFENSIVE_FORMATIONS;

    // Try exact match first
    let preset = presets[formation.name];
    let matchedName = formation.name;

    // If no exact match, try partial match (e.g., "Shotgun" in "11 Personnel - Shotgun")
    if (!preset) {
      console.log('📋 No exact match, trying partial match for:', formation.name);
      const presetKeys = Object.keys(presets);

      // Normalize formation name for better matching (remove hyphens, extra spaces, etc)
      const normalizedFormation = formation.name.toLowerCase().replace(/\s+/g, ' ').trim();

      for (const key of presetKeys) {
        const normalizedKey = key.toLowerCase().replace(/[-\s]+/g, ' ').trim();

        // Check if normalized formation contains normalized key
        if (normalizedFormation.includes(normalizedKey)) {
          preset = presets[key];
          matchedName = key;
          console.log('📋 Found partial match:', key, '(normalized)');
          break;
        }
      }
    }

    console.log('📋 Looking for preset:', formation.name, 'in', isOffense ? 'OFFENSIVE' : 'DEFENSIVE', 'formations');
    console.log('📋 Matched preset name:', matchedName);
    console.log('📋 Preset found:', !!preset);

    if (preset) {
      history.saveSnapshot();

      if (isOffense) {
        console.log('📋 Applying offensive formation preset');
        const oldPlayers = state.offensePlayers;
        setOffensePlayers(prev => {
          const updated = prev.map(player => {
            const pos = preset[player.id as keyof typeof preset] as { x: number; y: number } | undefined;
            if (pos) {
              console.log(`  📋 Moving offense ${player.id} to (${pos.x}, ${pos.y})`);
              return { ...player, x: pos.x, y: pos.y };
            }
            return player;
          });
          console.log('✅ Offense players updated');

          // Adjust routes after state update
          setTimeout(() => {
            adjustRoutesForPlayerMovement(oldPlayers, updated);
          }, 0);

          return updated;
        });
      } else {
        console.log('📋 Applying defensive formation preset');
        setDefensePlayers(prev => {
          const updated = prev.map(player => {
            const pos = preset[player.id as keyof typeof preset] as { x: number; y: number } | undefined;
            if (pos) {
              console.log(`  📋 Moving defense ${player.id} to (${pos.x}, ${pos.y})`);
              return { ...player, x: pos.x, y: pos.y };
            }
            return player;
          });
          console.log('✅ Defense players updated');
          return updated;
        });
      }
    } else {
      console.warn('⚠️ No preset found for formation:', formation.name);
      console.log('Available formations:', Object.keys(presets));
    }
  }, [state, formations, history.saveSnapshot, setOffensePlayers, setDefensePlayers]);

  // Template handlers
  const handleApplyTemplate = useCallback((template: RouteTemplate, playerId: string) => {
    const player = state.offensePlayers.find(p => p.id === playerId);
    if (!player) return;

    history.saveSnapshot();
    const absolutePoints = template.points.map(point => ({
      x: player.x + point.x,
      y: player.y + point.y
    }));

    const newRoute: DiagramRoute = {
      playerId,
      points: absolutePoints
    };

    state.setRoutes(prev => {
      const filtered = prev.filter(r => r.playerId !== playerId);
      return [...filtered, newRoute];
    });

    state.setSelectedTemplatePlayer(null);
  }, [state, history]);

  // Route application from assignments
  const handleApplyRouteFromAssignment = useCallback((playerId: string, routePoints: { x: number; y: number }[]) => {
    const player = state.offensePlayers.find(p => p.id === playerId);
    if (!player) return;

    history.saveSnapshot();

    // Convert relative route points to absolute coordinates
    const absolutePoints = routePoints.map(point => ({
      x: player.x + point.x,
      y: player.y + point.y
    }));

    const newRoute: DiagramRoute = {
      playerId,
      points: absolutePoints
    };

    state.setRoutes(prev => {
      const filtered = prev.filter(r => r.playerId !== playerId);
      return [...filtered, newRoute];
    });
  }, [state, history]);

  // Player action handlers
  const handlePlayerMouseDown = useCallback((e: React.MouseEvent, playerId: string, side: 'offense' | 'defense') => {
    if (viewOnly) return;
    e.stopPropagation();

    const isShiftPressed = e.shiftKey;
    const isOffense = side === 'offense';
    const isPassMode = state.playMode === 'pass';

    // Drawing mode: offense in pass mode, not shift pressed, not touch move mode
    const shouldStartDrawing = isOffense && isPassMode && !isShiftPressed && (!touch.isTouchDevice || touch.touchMode === 'draw');

    // Dragging mode: shift pressed, or defense, or run mode, or touch move mode
    const shouldStartDragging = isShiftPressed || !isOffense || !isPassMode || (touch.isTouchDevice && touch.touchMode === 'move');

    if (shouldStartDrawing) {
      // Find the player's current position to start the route from their location
      const player = state.offensePlayers.find(p => p.id === playerId);
      if (player) {
        routeDrawing.startDrawing(playerId, { x: player.x, y: player.y });
      }
    } else if (shouldStartDragging) {
      playerDrag.startDrag(playerId, side);
    }
  }, [viewOnly, state.playMode, state.offensePlayers, touch.isTouchDevice, touch.touchMode, routeDrawing, playerDrag]);

  const handlePlayerDoubleClick = useCallback((e: React.MouseEvent, playerId: string, side: 'offense' | 'defense') => {
    if (viewOnly) return;
    e.stopPropagation(); // Prevent field double-click from firing
    state.setSelectedPlayer(playerId);
    state.setActivePanel('player-actions');
  }, [viewOnly, state]);

  const handleFieldMouseMove = useCallback((e: React.MouseEvent) => {
    // Enable debug logging when drawing routes
    const coords = getFieldCoordinates(
      e,
      fieldRef.current,
      viewport.zoom,
      viewport.panOffset,
      state.snapToGrid,
      showDebug && routeDrawing.isDrawingRoute // Debug only when drawing and debug is on
    );
    if (!coords) return;

    // Update debug mouse position
    if (showDebug) {
      setDebugMousePos(coords);
    }

    // Handle route drawing
    if (routeDrawing.isDrawingRoute) {
      routeDrawing.addPoint(coords);
    }

    // Handle player dragging
    if (playerDrag.isDraggingPlayer) {
      playerDrag.updateDrag(coords);
    }
  }, [viewport.zoom, viewport.panOffset, state.snapToGrid, routeDrawing, playerDrag, showDebug]);

  const handleFieldMouseUp = useCallback(() => {
    if (routeDrawing.isDrawingRoute && routeDrawing.selectedPlayer) {
      routeDrawing.finishDrawing(routeDrawing.selectedPlayer);
    }
    if (playerDrag.isDraggingPlayer) {
      playerDrag.endDrag();
    }
  }, [routeDrawing, playerDrag]);

  const handleFieldMouseDown = useCallback((e: React.MouseEvent) => {
    // Clicking empty field deselects player (unless drawing or dragging)
    if (!routeDrawing.isDrawingRoute && !playerDrag.isDraggingPlayer) {
      state.setSelectedPlayer(null);
    }
  }, [routeDrawing.isDrawingRoute, playerDrag.isDraggingPlayer, state]);

  const handleFieldDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only reset view if double-clicking the field itself, not other elements
    const target = e.target as SVGElement;
    if (target.tagName === 'svg' || target.tagName === 'rect') {
      viewport.resetView();
    }
  }, [viewport]);

  // Save handler
  const handleSave = useCallback(() => {
    const playData: BuiltPlayData = {
      mode: state.playMode,
      offensePlayers: state.offensePlayers,
      defensePlayers: state.defensePlayers,
      routes: state.routes,
      blocking: state.blocking,
      ballCarrierPath: state.ballCarrierPath,
      metadata: {
        name: state.playName,
        formation: state.formation,
        concept: state.concept,
        playType: state.playType,
        strength: state.strength,
        personnel: state.personnel
      }
    };

    // If structured data is provided, include it in metadata
    if (formations.length > 0) {
      const structuredMetadata: PlaybookMetadataInput = {
        sideOfBall: state.sideOfBall,
        playType: state.structuredPlayType as OffensivePlayType | DefensivePlayType,
        situationalTagIds: state.selectedSituationalTags,
        conceptTagIds: state.selectedConceptTags,
        formationId: state.selectedFormationId,
        installPhase: state.installPhase || undefined,
        defensiveLook: state.sideOfBall === 'offense' ? state.defensiveLook || undefined : undefined,
        offensiveLook: state.sideOfBall === 'defense' ? state.offensiveLook || undefined : undefined
      };
      onSave(playData, structuredMetadata);
    } else {
      onSave(playData);
    }
  }, [state, formations, onSave]);

  // Player note handler
  const handleUpdatePlayerNote = useCallback((playerId: string, note: string) => {
    state.setPlayerNotes(prev => ({
      ...prev,
      [playerId]: note
    }));
  }, [state]);

  // Metadata handlers
  const handleToggleSituationalTag = useCallback((tagId: string) => {
    state.setSelectedSituationalTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }, [state]);

  const handleToggleConceptTag = useCallback((tagId: string) => {
    state.setSelectedConceptTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }, [state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const canSave = useMemo(() => {
    return state.playName.trim() !== '';
  }, [state.playName]);

  const hasStructuredData = useMemo(() => {
    return formations.length > 0;
  }, [formations]);

  // Filter formations to only show those with matching presets
  const availableFormations = useMemo(() => {
    if (!hasStructuredData) return [];

    return formations.filter(formation => {
      const isOffense = formation.sideOfBall === 'offense';
      const presets = isOffense ? OFFENSIVE_FORMATIONS : DEFENSIVE_FORMATIONS;

      // Try exact match
      if (presets[formation.name]) return true;

      // Try normalized match
      const normalizedFormation = formation.name.toLowerCase().replace(/\s+/g, ' ').trim();
      const presetKeys = Object.keys(presets);

      for (const key of presetKeys) {
        const normalizedKey = key.toLowerCase().replace(/[-\s]+/g, ' ').trim();
        if (normalizedFormation.includes(normalizedKey)) {
          return true;
        }
      }

      return false;
    });
  }, [formations, hasStructuredData]);

  // Compute routeByPlayerId map for O(1) lookups
  const routeByPlayerId = useMemo(() => {
    return state.routes.reduce((acc, route) => {
      acc[route.playerId] = route;
      return acc;
    }, {} as Record<string, DiagramRoute>);
  }, [state.routes]);

  // Compute LOS Y coordinate
  const losY = useMemo(() => {
    return LOS_OPTIONS.find(opt => opt.value === state.lineOfScrimmage)?.y || 60;
  }, [state.lineOfScrimmage]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div ref={containerRef} className={`${embedded ? 'relative w-full h-full' : 'fixed inset-0 z-50'} bg-[#0A0A0A] flex flex-col overflow-hidden`}>
      {/* Header / Formation Bar */}
      <header className="border-b border-[#1B1E20] bg-[#0F0F0F] p-4 flex-shrink-0">
        <FormationBar
          sideOfBall={state.sideOfBall}
          selectedFormationId={state.selectedFormationId}
          offensiveFormation={state.offensiveFormation}
          defensiveFormation={state.defensiveFormation}
          playMode={state.playMode}
          structuredPlayType={state.structuredPlayType}
          lineOfScrimmage={state.lineOfScrimmage}
          formations={availableFormations}
          hasStructuredData={hasStructuredData}
          viewOnly={viewOnly}
          onSideOfBallChange={state.setSideOfBall}
          onFormationChange={handleFormationChange}
          onOffensiveFormationChange={handleOffensiveFormationChange}
          onDefensiveFormationChange={handleDefensiveFormationChange}
          onPlayModeChange={state.setPlayMode}
          onStructuredPlayTypeChange={state.setStructuredPlayType}
          onLineOfScrimmageChange={handleLineOfScrimmageChange}
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Field Canvas Container - handles wheel and touch events */}
        <div
          ref={viewport.containerRef}
          className="w-full h-full"
          onTouchStart={touch.handleTouchStart}
          onTouchMove={touch.handleTouchMove}
          onTouchEnd={touch.handleTouchEnd}
        >
          <FieldCanvas
            offensePlayers={state.offensePlayers}
            defensePlayers={state.defensePlayers}
            routes={state.routes}
            routeByPlayerId={routeByPlayerId}
            lineOfScrimmage={state.lineOfScrimmage}
            losY={losY}
            zoom={viewport.zoom}
            panOffset={viewport.panOffset}
            playMode={state.playMode}
            viewOnly={viewOnly}
            isDrawingRoute={routeDrawing.isDrawingRoute}
            currentRoutePoints={routeDrawing.currentRoutePoints}
            selectedPlayer={routeDrawing.selectedPlayer}
            isDraggingPlayer={playerDrag.isDraggingPlayer}
            draggedPlayerId={playerDrag.draggedPlayerId}
            isTouchDevice={touch.isTouchDevice}
            touchMode={touch.touchMode}
            onPlayerMouseDown={handlePlayerMouseDown}
            onPlayerDoubleClick={handlePlayerDoubleClick}
            onFieldMouseDown={handleFieldMouseDown}
            onFieldMouseMove={handleFieldMouseMove}
            onFieldMouseUp={handleFieldMouseUp}
            onFieldDoubleClick={handleFieldDoubleClick}
            fieldRef={fieldRef}
          />
        </div>

        {/* Widget Bar (Right Side) */}
        <WidgetBar
          activePanel={state.activePanel}
          playMode={state.playMode}
          hasStructuredData={hasStructuredData}
          viewOnly={viewOnly}
          selectedPlayer={state.selectedPlayer}
          selectedPlayerLabel={
            state.selectedPlayer
              ? [...state.offensePlayers, ...state.defensePlayers].find(p => p.id === state.selectedPlayer)?.label
              : undefined
          }
          onPanelToggle={state.setActivePanel}
        />

        {/* Floating Panels */}
        {state.activePanel && (
          <FloatingPanelContainer
            activePanel={state.activePanel}
            onClose={() => state.setActivePanel(null)}
          >
            {state.activePanel === 'info' && (
              <PlayMetadataPanel
                playName={state.playName}
                formation={state.formation}
                concept={state.concept}
                playType={state.playType}
                strength={state.strength}
                personnel={state.personnel}
                situationalTags={situationalTags}
                selectedSituationalTags={state.selectedSituationalTags}
                conceptTags={conceptTags}
                selectedConceptTags={state.selectedConceptTags}
                sideOfBall={state.sideOfBall}
                hasStructuredData={hasStructuredData}
                installPhase={state.installPhase}
                defensiveLook={state.defensiveLook}
                offensiveLook={state.offensiveLook}
                viewOnly={viewOnly}
                onPlayNameChange={state.setPlayName}
                onFormationChange={state.setFormation}
                onConceptChange={state.setConcept}
                onPlayTypeChange={state.setPlayType}
                onStrengthChange={state.setStrength}
                onPersonnelChange={state.setPersonnel}
                onToggleSituationalTag={handleToggleSituationalTag}
                onToggleConceptTag={handleToggleConceptTag}
                onInstallPhaseChange={state.setInstallPhase}
                onDefensiveLookChange={state.setDefensiveLook}
                onOffensiveLookChange={state.setOffensiveLook}
              />
            )}

            {state.activePanel === 'routes' && (
              <RouteManagementPanel
                offensePlayers={state.offensePlayers}
                routes={state.routes}
                isDrawingRoute={routeDrawing.isDrawingRoute}
                selectedPlayer={routeDrawing.selectedPlayer}
                copiedRoute={routeDrawing.copiedRoute}
                onCopyRoute={routeDrawing.copyRoute}
                onPasteRoute={routeDrawing.pasteRoute}
                onDeleteRoute={routeDrawing.deleteRoute}
              />
            )}

            {state.activePanel === 'templates' && (
              <RouteTemplatesPanel
                offensePlayers={state.offensePlayers}
                selectedTemplatePlayer={state.selectedTemplatePlayer}
                onSelectTemplatePlayer={state.setSelectedTemplatePlayer}
                onApplyTemplate={handleApplyTemplate}
              />
            )}

            {state.activePanel === 'controls' && (
              <FieldControlsPanel
                zoom={viewport.zoom}
                snapToGrid={state.snapToGrid}
                isTouchDevice={touch.isTouchDevice}
                onZoomIn={() => viewport.setZoom(prev => Math.min(3, prev + 0.1))}
                onZoomOut={() => viewport.setZoom(prev => Math.max(0.5, prev - 0.1))}
                onToggleSnapToGrid={() => state.setSnapToGrid(prev => !prev)}
                onResetView={viewport.resetView}
              />
            )}

            {state.activePanel === 'export' && (
              <ExportPanel
                onExportPNG={() => console.log('Export PNG')}
                onExportSVG={() => console.log('Export SVG')}
                onCopyToClipboard={() => console.log('Copy to clipboard')}
              />
            )}

            {state.activePanel === 'player-actions' && (
              <PlayerActionsPanel
                selectedPlayer={state.selectedPlayer}
                offensePlayers={state.offensePlayers}
                defensePlayers={state.defensePlayers}
                routes={state.routes}
                playMode={state.playMode}
                copiedRoute={routeDrawing.copiedRoute}
                playerNotes={state.playerNotes}
                onCopyRoute={routeDrawing.copyRoute}
                onPasteRoute={routeDrawing.pasteRoute}
                onDeleteRoute={routeDrawing.deleteRoute}
                onUpdatePlayerNote={handleUpdatePlayerNote}
                onClose={() => state.setActivePanel(null)}
              />
            )}

            {state.activePanel === 'responsibilities' && (
              <PlayerResponsibilitiesPanel
                offensePlayers={state.offensePlayers}
                defensePlayers={state.defensePlayers}
                playerNotes={state.playerNotes}
                selectedPlayer={state.selectedPlayer}
                onUpdatePlayerNote={handleUpdatePlayerNote}
              />
            )}

            {state.activePanel === 'assignments' && (
              <AssignmentPanel
                selectedPlayer={
                  state.selectedPlayer
                    ? [...state.offensePlayers, ...state.defensePlayers].find(p => p.id === state.selectedPlayer) || null
                    : null
                }
                allPlayers={[...state.offensePlayers, ...state.defensePlayers]}
                onAssignmentChange={(playerId, assignment) => {
                  console.log('Assignment changed for', playerId, assignment);
                  // TODO: Handle assignment changes
                }}
                onApplyRoute={handleApplyRouteFromAssignment}
              />
            )}

            {state.activePanel === 'guide' && (
              <QuickGuidePanel isTouchDevice={touch.isTouchDevice} />
            )}
          </FloatingPanelContainer>
        )}

        {/* Touch Mode Toggle (Bottom Left) - iPad only */}
        {touch.isTouchDevice && !viewOnly && (
          <div className="absolute bottom-24 left-4 z-20">
            <div className="bg-[#0F0F0F]/95 backdrop-blur-sm rounded-lg border border-[#1B1E20] p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => touch.setTouchMode('draw')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    touch.touchMode === 'draw'
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  ✏️ Draw
                </button>
                <button
                  onClick={() => touch.setTouchMode('move')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    touch.touchMode === 'move'
                      ? 'bg-[#00F6E5]/20 text-[#00F6E5] ring-1 ring-[#00F6E5]'
                      : 'bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]'
                  }`}
                >
                  ✋ Move
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Controls (Save, Back, Undo/Redo) */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 bg-[#0F0F0F]/95 backdrop-blur-sm rounded-lg border border-[#1B1E20] px-4 py-3">
            {/* Undo/Redo */}
            {!viewOnly && (
              <div className="flex items-center gap-2 pr-3 border-r border-[#1B1E20]">
                <button
                  onClick={history.undo}
                  disabled={!history.canUndo}
                  className="p-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Undo (Cmd+Z)"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                  </svg>
                </button>
                <button
                  onClick={history.redo}
                  disabled={!history.canRedo}
                  className="p-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Redo (Cmd+Shift+Z)"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Back button */}
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-[#1B1E20]/50 text-white hover:bg-[#1B1E20] transition font-semibold"
            >
              Back
            </button>

            {/* Save button */}
            {!viewOnly && (
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="px-6 py-2 rounded-lg bg-[#00F6E5] text-[#0A0A0A] hover:bg-[#00F6E5]/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                Save Play
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Debug Overlay - Toggle with Shift+D */}
      {showDebug && (
        <DebugOverlay
          zoom={viewport.zoom}
          panOffset={viewport.panOffset}
          isDrawingRoute={routeDrawing.isDrawingRoute}
          isDraggingPlayer={playerDrag.isDraggingPlayer}
          selectedPlayer={state.selectedPlayer}
          routeCount={state.routes.length}
          mousePos={debugMousePos}
        />
      )}
    </div>
  );
}
