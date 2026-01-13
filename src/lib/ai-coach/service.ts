// ═══════════════════════════════════════════════════════════════════════════
// CHALK TALK SERVICE — Core logic functions for Chalk Talk
// NOTE: This service is currently disabled due to removal of static football data
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CoachMessage,
  MessageContent,
  DiagramData,
} from "./types";

// Stub exports - AI Coach functionality disabled
export function parseCoachMessage(message: string): CoachMessage {
  return {
    id: Date.now().toString(),
    type: "text",
    content: [{ type: "text", text: "AI Coach is currently disabled." }],
    timestamp: new Date(),
  };
}

export function generateResponse(message: string): CoachMessage {
  return {
    id: Date.now().toString(),
    type: "text",
    content: [{ type: "text", text: "AI Coach is currently disabled." }],
    timestamp: new Date(),
  };
}

export function getDiagramData(type: string): DiagramData | null {
  return null;
}

// Export empty arrays for data that no longer exists
export const ROUTES: any[] = [];
export const FORMATIONS: any[] = [];
export const COVERAGES: any[] = [];
export const PROTECTIONS: any[] = [];
