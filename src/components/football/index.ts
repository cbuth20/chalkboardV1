// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL DIAGRAM COMPONENTS — Code-drawn football visualizations
// Uses NFL-style coordinate system for realistic playbook diagrams
// ═══════════════════════════════════════════════════════════════════════════

export { FieldCanvas } from "./FieldCanvas";
export { GameDiagramWrapper, type GameDiagramWrapperProps } from "./GameDiagramWrapper";
export { FormationDiagram } from "./FormationDiagram";
export { CoverageDiagram } from "./CoverageDiagram";
export { RouteDiagram } from "./RouteDiagram";
export { 
  BlitzDiagram, 
  getBlitzScenarioForPrompt,
  BLITZ_SCENARIOS,
  type BlitzScenario 
} from "./BlitzDiagram";

// Field coordinate system utilities
export { 
  FIELD, 
  OFFENSE, 
  DEFENSE,
  convertDefensiveCoords,
  convertOffensiveCoords,
  get2x2Formation,
  getTripsFormation,
  getSingleHighDefense,
  getTwoHighDefense,
  getCover0Defense,
  type PositionedPlayer,
} from "./fieldCoordinates";

