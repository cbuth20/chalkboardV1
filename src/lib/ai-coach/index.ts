// ═══════════════════════════════════════════════════════════════════════════
// AI COACH — Main export file
// Re-exports all types and service functions
// ═══════════════════════════════════════════════════════════════════════════

// Export all types
export * from "./types";

// Export service functions
export {
  explainConcept,
  drawPlay,
  analyzeCoverage,
  generateFlashcards,
  gradeUserResponse,
  routeTeach,
  gameAssist,
  installTeaching,
  breakDownFilm,
  createCoachMessage,
  createUserMessage,
  getWelcomeMessage,
} from "./service";

