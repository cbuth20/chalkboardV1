// ═══════════════════════════════════════════════════════════════════════════
// CHALK TALK SERVICE — Core logic functions for Chalk Talk
// This service powers Chalk Talk across all platform modules
// ═══════════════════════════════════════════════════════════════════════════

import {
  COVERAGE_SHELLS,
  getCoverageById,
  getCoveragesBySafetyAlignment,
  type CoverageShell,
  type CoverageId,
} from "@/domain/football/coverageShells";

import {
  FORMATIONS,
  getFormationById,
  type Formation,
  type FormationId,
} from "@/domain/football/formations";

import {
  ROUTES,
  ROUTE_CONCEPTS,
  PROTECTIONS,
  getRouteById,
  getConceptById,
  getProtectionById,
  getConceptsAgainstCoverage,
  type Route,
  type RouteId,
  type RouteConcept,
  type ConceptId,
  type Protection,
  type ProtectionId,
} from "@/domain/football/playConcepts";

// NFL/NCAA Terminology imports
import {
  FOOTBALL_TERMS,
  getTermById,
  searchTerms,
  getTermsByCategory,
  getRelatedTerms,
  type FootballTerm,
  type TermCategory,
} from "@/domain/football/terminology";

import {
  COACHING_SYSTEMS,
  getSystemById,
  translateConcept,
  getConceptAcrossSystems,
  findSystemsWithTerm,
  type SystemId,
  type CoachingSystem,
} from "@/domain/football/coachingSystems";

import {
  POSITION_GROUPS,
  getPositionGroupById,
  getTermsForPosition,
  searchPositionTerms,
  type PositionGroupId,
  type PositionTerm,
} from "@/domain/football/positionTerms";

import {
  PLAY_CALL_STRUCTURES,
  PERSONNEL_PACKAGES,
  NUMBERING_SYSTEMS,
  getPlayCallStructure,
  breakdownRouteCall,
  getHoleExplanation,
  getRouteFromNumber,
} from "@/domain/football/playCalls";

import type {
  CoachMessage,
  MessageContent,
  DiagramData,
  FlashcardData,
  QuizData,
  PlayBreakdown,
  GradedResponse,
  SuggestedAction,
  ExplainConceptParams,
  DrawPlayParams,
  AnalyzeCoverageParams,
  RouteTeachParams,
  GameAssistParams,
  InstallTeachParams,
  UserResponse,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// CORE CHALK TALK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ExplainConcept — Break down football concepts in simple → advanced format
 * Returns multi-level explanations with optional visuals
 */
export function explainConcept(params: ExplainConceptParams): MessageContent[] {
  const { concept, depth, includeVisual, relatedTo } = params;
  const contents: MessageContent[] = [];
  
  // Check if it's a coverage concept
  const coverage = COVERAGE_SHELLS.find(
    c => c.name.toLowerCase().includes(concept.toLowerCase()) ||
         c.shortName.toLowerCase() === concept.toLowerCase()
  );
  
  if (coverage) {
    return explainCoverage(coverage, depth, includeVisual);
  }
  
  // Check if it's a route concept
  const route = ROUTES.find(
    r => r.name.toLowerCase().includes(concept.toLowerCase())
  );
  
  if (route) {
    return explainRoute(route, depth, includeVisual);
  }
  
  // Check if it's a play concept
  const playConcept = ROUTE_CONCEPTS.find(
    c => c.name.toLowerCase().includes(concept.toLowerCase())
  );
  
  if (playConcept) {
    return explainPlayConcept(playConcept, depth, includeVisual);
  }
  
  // Check if it's a formation
  const formation = FORMATIONS.find(
    f => f.name.toLowerCase().includes(concept.toLowerCase())
  );
  
  if (formation) {
    return explainFormation(formation, depth, includeVisual);
  }
  
  // Check if it's a protection
  const protection = PROTECTIONS.find(
    p => p.name.toLowerCase().includes(concept.toLowerCase())
  );
  
  if (protection) {
    return explainProtection(protection, depth);
  }
  
  // Generic concept explanation
  contents.push({
    type: "text",
    text: `Let me break down "${concept}" for you. This is a fundamental football concept that every player needs to understand.`,
  });
  
  return contents;
}

/**
 * Helper: Explain coverage concepts
 */
function explainCoverage(coverage: CoverageShell, depth: string, includeVisual?: boolean): MessageContent[] {
  const contents: MessageContent[] = [];
  
  // Main explanation based on depth
  if (depth === "simple") {
    contents.push({
      type: "text",
      text: `**${coverage.name}** — ${coverage.description}\n\n` +
        `**Key Tell:** ${coverage.keyIndicators[0]}\n\n` +
        `Think of it like this: ${getSimpleAnalogy(coverage.id)}`,
    });
  } else if (depth === "standard") {
    contents.push({
      type: "text",
      text: `**${coverage.name}**\n\n` +
        `${coverage.description}\n\n` +
        `**Pre-Snap Keys:**\n${coverage.keyIndicators.map(k => `• ${k}`).join('\n')}\n\n` +
        `**What it's weak against:**\n${coverage.vulnerabilities.map(v => `• ${v}`).join('\n')}\n\n` +
        `**Coaching Points:**\n${coverage.coachingPoints.map(p => `• ${p}`).join('\n')}`,
    });
  } else {
    // Advanced
    contents.push({
      type: "text",
      text: `**${coverage.name} (${coverage.shortName})**\n\n` +
        `${coverage.description}\n\n` +
        `**Safety Alignment:** ${coverage.safetyAlignment.replace('-', ' ')} (${coverage.safetyCount} deep)\n\n` +
        `**Pre-Snap Keys:**\n${coverage.keyIndicators.map(k => `• ${k}`).join('\n')}\n\n` +
        `**Vulnerabilities:**\n${coverage.vulnerabilities.map(v => `• ${v}`).join('\n')}\n\n` +
        `**Variations:**\n${coverage.commonVariations.map(v => `• **${v.name}**: ${v.description}`).join('\n')}\n\n` +
        `**Coaching Points:**\n${coverage.coachingPoints.map(p => `• ${p}`).join('\n')}`,
    });
  }
  
  // Add diagram if requested
  if (includeVisual) {
    contents.push({
      type: "diagram",
      diagram: {
        type: "coverage",
        coverageId: coverage.id,
      },
    });
  }
  
  return contents;
}

/**
 * Helper: Explain route concepts
 */
function explainRoute(route: Route, depth: string, includeVisual?: boolean): MessageContent[] {
  const contents: MessageContent[] = [];
  
  if (depth === "simple") {
    contents.push({
      type: "text",
      text: `**${route.name}** — ${route.description}\n\n` +
        `**Depth:** ${route.depth}\n` +
        `**Best Against:** ${route.bestAgainst.map(c => getCoverageById(c)?.shortName || c).join(', ')}`,
    });
  } else {
    contents.push({
      type: "text",
      text: `**${route.name}**\n\n` +
        `${route.description}\n\n` +
        `**Route Details:**\n` +
        `• Stem: ${route.path.stemYards} yards vertical\n` +
        `• Break: ${route.path.breakAngle}° ${route.breakDirection}\n` +
        `• Depth: ${route.depth} (${getDepthRange(route.depth)})\n\n` +
        `**Best Against:**\n${route.bestAgainst.map(c => `• ${getCoverageById(c)?.name || c}`).join('\n')}\n\n` +
        `**Key Reads:**\n${route.keyReads.map(k => `• ${k}`).join('\n')}`,
    });
  }
  
  if (includeVisual) {
    contents.push({
      type: "diagram",
      diagram: {
        type: "route",
        routes: [route.id],
      },
    });
  }
  
  return contents;
}

/**
 * Helper: Explain play concepts
 */
function explainPlayConcept(concept: RouteConcept, depth: string, includeVisual?: boolean): MessageContent[] {
  const contents: MessageContent[] = [];
  
  contents.push({
    type: "text",
    text: `**${concept.name}**\n\n` +
      `${concept.description}\n\n` +
      `**Routes in this concept:**\n${concept.routes.map(r => 
        `• ${r.receiver.toUpperCase()}: ${getRouteById(r.routeId)?.name || r.routeId}${r.isPrimary ? ' (Primary)' : ''}`
      ).join('\n')}\n\n` +
      `**Best Against:**\n${concept.bestAgainst.map(c => `• ${getCoverageById(c)?.name || c}`).join('\n')}\n\n` +
      `**Avoid Against:**\n${concept.poorAgainst.map(c => `• ${getCoverageById(c)?.name || c}`).join('\n')}\n\n` +
      `**Key Reads:**\n${concept.keyReads.map(k => `• ${k}`).join('\n')}\n\n` +
      `**Coaching Points:**\n${concept.coachingPoints.map(p => `• ${p}`).join('\n')}`,
  });
  
  if (includeVisual) {
    contents.push({
      type: "diagram",
      diagram: {
        type: "full-play",
        concept: concept.id,
      },
    });
  }
  
  return contents;
}

/**
 * Helper: Explain formations
 */
function explainFormation(formation: Formation, depth: string, includeVisual?: boolean): MessageContent[] {
  const contents: MessageContent[] = [];
  
  contents.push({
    type: "text",
    text: `**${formation.name}** (${formation.personnel} personnel)\n\n` +
      `${formation.description}\n\n` +
      `**Personnel:** ${formation.personnelLabel}\n\n` +
      `**Key Features:**\n${formation.keyFeatures.map(f => `• ${f}`).join('\n')}\n\n` +
      (formation.commonPlays ? `**Common Plays:**\n${formation.commonPlays.map(p => `• ${p}`).join('\n')}\n\n` : '') +
      (formation.bestAgainst ? `**Best Against:**\n${formation.bestAgainst.map(b => `• ${b}`).join('\n')}` : ''),
  });
  
  if (includeVisual) {
    contents.push({
      type: "diagram",
      diagram: {
        type: "formation",
        formationId: formation.id,
      },
    });
  }
  
  return contents;
}

/**
 * Helper: Explain protections
 */
function explainProtection(protection: Protection, depth: string): MessageContent[] {
  return [{
    type: "text",
    text: `**${protection.name}** (${protection.shortName})\n\n` +
      `${protection.description}\n\n` +
      `**Details:**\n` +
      `• Blockers: ${protection.blockerCount}\n` +
      `• Direction: ${protection.direction}\n` +
      `• RB Role: ${protection.rbRole}\n\n` +
      `**Used Against:**\n${protection.usedAgainst.map(u => `• ${u}`).join('\n')}\n\n` +
      `**Key Indicators:**\n${protection.keyIndicators.map(k => `• ${k}`).join('\n')}\n\n` +
      `**Coaching Points:**\n${protection.coachingPoints.map(p => `• ${p}`).join('\n')}`,
  }];
}

/**
 * DrawPlay — Produce a full diagram using code
 */
export function drawPlay(params: DrawPlayParams): DiagramData {
  const { formation, coverage, concept, routes, protection, annotations } = params;
  
  // Determine diagram type based on provided params
  let type: DiagramData["type"] = "full-play";
  
  if (coverage && !formation && !concept) {
    type = "coverage";
  } else if (formation && !coverage && !concept) {
    type = "formation";
  } else if (routes && routes.length > 0 && !coverage) {
    type = "route";
  }
  
  return {
    type,
    formationId: formation,
    coverageId: coverage,
    routes: routes,
    concept: concept,
    protection: protection,
    annotations: annotations,
  };
}

/**
 * AnalyzeCoverage — Analyze defensive look and return coverage identification
 */
export function analyzeCoverage(params: AnalyzeCoverageParams): PlayBreakdown & { coverageGuess: CoverageShell } {
  const { presnap } = params;
  
  let coverageGuess: CoverageShell;
  const coachingNotes: string[] = [];
  const presnapNotes: string[] = [];
  
  if (!presnap) {
    // Default analysis when no presnap info provided
    coverageGuess = getCoverageById("cover-3") as CoverageShell;
    coachingNotes.push("Without visual confirmation, I'll need more information to identify the coverage.");
  } else {
    // Analyze based on presnap indicators
    const { safetyAlignment, cornerTechnique, linebackerDepth } = presnap;
    
    if (safetyAlignment === "zero-high") {
      coverageGuess = getCoverageById("cover-0") as CoverageShell;
      presnapNotes.push("No deep safety - expect pressure");
      coachingNotes.push("With zero deep help, this is likely Cover 0 or man-free with a robber");
    } else if (safetyAlignment === "single-high") {
      if (cornerTechnique === "press") {
        coverageGuess = getCoverageById("cover-1") as CoverageShell;
        presnapNotes.push("Single high safety with press corners indicates Cover 1");
      } else {
        coverageGuess = getCoverageById("cover-3") as CoverageShell;
        presnapNotes.push("Single high safety with off corners indicates Cover 3");
      }
      coachingNotes.push("Single high safety - read the corners for Cover 1 vs Cover 3");
    } else {
      // Two-high
      if (linebackerDepth === "deep") {
        coverageGuess = getCoverageById("cover-2") as CoverageShell;
        presnapNotes.push("Two high safeties with deep LBs indicates Tampa 2");
        coachingNotes.push("Look for the hole shot between corner and safety");
      } else {
        coverageGuess = getCoverageById("cover-4") as CoverageShell;
        presnapNotes.push("Two high shell could be Cover 4/Quarters");
        coachingNotes.push("Keys will read to #2 receiver - pattern match rules apply");
      }
    }
  }
  
  return {
    coverage: coverageGuess.id,
    formation: "shotgun-spread",
    presnap: presnapNotes,
    postsnap: [],
    coachingNotes,
    coverageGuess,
  };
}

/**
 * StudyFlashcards — Generate and manage flashcard study sessions
 */
export function generateFlashcards(category: string, count: number = 10): FlashcardData[] {
  const cards: FlashcardData[] = [];
  
  if (category === "coverage" || category === "all") {
    COVERAGE_SHELLS.slice(0, Math.min(count, COVERAGE_SHELLS.length)).forEach((coverage, i) => {
      cards.push({
        id: `coverage-${coverage.id}`,
        front: `What coverage has ${coverage.safetyAlignment.replace('-', ' ')} safety alignment and ${coverage.keyIndicators[0].toLowerCase()}?`,
        back: `**${coverage.name}**\n\n${coverage.description}`,
        category: "coverage",
        difficulty: i < 3 ? "beginner" : i < 6 ? "intermediate" : "advanced",
        hint: coverage.keyIndicators[1] || undefined,
      });
    });
  }
  
  if (category === "route" || category === "all") {
    ROUTES.slice(0, Math.min(count, ROUTES.length)).forEach((route, i) => {
      cards.push({
        id: `route-${route.id}`,
        front: `Describe the ${route.name} route: depth, break direction, and when to run it.`,
        back: `**${route.name}**\n\nDepth: ${route.depth} (${route.path.stemYards} yards)\nBreak: ${route.breakDirection} at ${route.path.breakAngle}°\n\nBest against: ${route.bestAgainst.join(', ')}`,
        category: "route",
        difficulty: i < 4 ? "beginner" : i < 8 ? "intermediate" : "advanced",
        hint: route.keyReads[0],
      });
    });
  }
  
  if (category === "formation" || category === "all") {
    FORMATIONS.slice(0, Math.min(count, FORMATIONS.length)).forEach((formation, i) => {
      cards.push({
        id: `formation-${formation.id}`,
        front: `What formation is this? ${formation.keyFeatures[0]}`,
        back: `**${formation.name}**\n\n${formation.description}\n\nPersonnel: ${formation.personnelLabel}`,
        category: "formation",
        difficulty: i < 4 ? "beginner" : i < 8 ? "intermediate" : "advanced",
      });
    });
  }
  
  // Shuffle cards
  return cards.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * GradeUserResponse — Score and evaluate user answers with coaching feedback
 */
export function gradeUserResponse(response: UserResponse, correctAnswer: string | number, questionType: string): GradedResponse {
  const isCorrect = response.answer === correctAnswer || 
    (typeof response.answer === 'string' && 
     typeof correctAnswer === 'string' && 
     response.answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim());
  
  const score = isCorrect ? 100 : 0;
  const timeBonus = response.timeSpent < 10 ? " Great reaction time!" : "";
  
  let feedback: string;
  let correction: string | undefined;
  let coachingNote: string | undefined;
  
  if (isCorrect) {
    feedback = getPositiveFeedback() + timeBonus;
    coachingNote = "Keep building on this knowledge. Repetition is key.";
  } else {
    feedback = getCorrectiveFeedback();
    correction = `The correct answer was: ${correctAnswer}`;
    coachingNote = getCorrectionCoachingNote(questionType);
  }
  
  // Adjust coaching based on attempt number
  if (response.attemptNumber > 1 && !isCorrect) {
    feedback = "Let's slow down and think through this one. " + feedback;
    coachingNote = "Take your time. Understanding is more important than speed.";
  }
  
  const nextSteps: SuggestedAction[] = isCorrect
    ? [
        { id: "next", label: "Next Question", action: "next" },
        { id: "explain", label: "Deep Dive", action: "ask", payload: "Explain this in more detail" },
      ]
    : [
        { id: "explain", label: "Explain This", action: "ask", payload: "Why is this the answer?" },
        { id: "diagram", label: "Show Diagram", action: "diagram" },
        { id: "retry", label: "Try Similar", action: "quiz" },
      ];
  
  return {
    isCorrect,
    score,
    maxScore: 100,
    feedback,
    correction,
    coachingNote,
    nextSteps,
  };
}

/**
 * RouteTeach — Comprehensive route teaching with variations and techniques
 */
export function routeTeach(params: RouteTeachParams): MessageContent[] {
  const { routeId, includeVariations, position, vsDefender } = params;
  const route = getRouteById(routeId);
  
  if (!route) {
    return [{
      type: "text",
      text: `I couldn't find a route called "${routeId}". Let me know which route you'd like to learn about.`,
    }];
  }
  
  const contents: MessageContent[] = [];
  
  // Main route breakdown
  contents.push({
    type: "text",
    text: `# ${route.name} Route\n\n` +
      `## Overview\n${route.description}\n\n` +
      `## Route Mechanics\n` +
      `• **Stem:** ${route.path.stemYards} yards vertical\n` +
      `• **Break:** ${route.breakDirection} at ${route.path.breakAngle}°\n` +
      `• **Depth:** ${route.depth} (${getDepthRange(route.depth)})\n\n` +
      `## Release Techniques\n` +
      getReleaseTechniques(route, position) +
      `\n## Stem Technique\n` +
      getStemTechnique(route) +
      `\n## Break Technique\n` +
      getBreakTechnique(route) +
      `\n## Leverage Cues\n` +
      getLeverageCues(route, vsDefender),
  });
  
  // Add diagram
  contents.push({
    type: "diagram",
    diagram: {
      type: "route",
      routes: [routeId],
    },
  });
  
  // Variations if requested
  if (includeVariations) {
    contents.push({
      type: "text",
      text: `## Variations\n${getRouteVariations(route)}`,
      isExpandable: true,
    });
  }
  
  return contents;
}

/**
 * GameAssist — Help during study games with hints and explanations
 */
export function gameAssist(params: GameAssistParams): MessageContent[] {
  const { gameName, currentQuestion, needsHint, needsExplanation } = params;
  const contents: MessageContent[] = [];
  
  // Base response varies by game type
  switch (gameName.toLowerCase()) {
    case "coverage-id":
    case "coverage id":
      if (needsHint) {
        contents.push({
          type: "text",
          text: "🎯 **Hint:** Look at the safeties first.\n\n" +
            "• Single high safety = Cover 1 or Cover 3\n" +
            "• Two high safeties = Cover 2 or Cover 4\n" +
            "• No deep safety = Cover 0\n\n" +
            "Then check the corners — are they press or off? Inside or outside leverage?",
        });
      }
      if (needsExplanation) {
        contents.push({
          type: "text",
          text: "**Reading Coverage Pre-Snap:**\n\n" +
            "1. Count the safeties and note their depth\n" +
            "2. Check corner alignment and leverage\n" +
            "3. Look for any rotating defenders\n" +
            "4. Watch for last-second movement\n\n" +
            "The safety structure is your first key. Everything else confirms or adjusts your read.",
        });
      }
      break;
      
    case "blitz-id":
    case "blitz id":
      if (needsHint) {
        contents.push({
          type: "text",
          text: "🎯 **Hint:** Count the defenders in the box.\n\n" +
            "• 6 or fewer = standard protection\n" +
            "• 7+ in the box = overload coming\n\n" +
            "Watch for: LBs walking up, safeties creeping, corners on the edge.",
        });
      }
      break;
      
    case "route-tag":
    case "route tag":
      if (needsHint) {
        contents.push({
          type: "text",
          text: "🎯 **Hint:** Focus on the depth and break direction.\n\n" +
            "• Short routes: 0-7 yards (flats, slants, hitches)\n" +
            "• Intermediate: 8-15 yards (outs, curls, digs)\n" +
            "• Deep: 16+ yards (posts, corners, goes)",
        });
      }
      break;
      
    case "formation":
      if (needsHint) {
        contents.push({
          type: "text",
          text: "🎯 **Hint:** Count the players:\n\n" +
            "• How many receivers are split out?\n" +
            "• Where is the RB aligned?\n" +
            "• Is the QB under center or in gun?\n" +
            "• Any TEs attached to the line?",
        });
      }
      break;
      
    default:
      contents.push({
        type: "text",
        text: "I'm here to help! Let me know what you're stuck on and I'll guide you through it.",
      });
  }
  
  return contents;
}

/**
 * InstallTeaching — Teach installs the way real coaches do
 */
export function installTeaching(params: InstallTeachParams): MessageContent[] {
  const { installSection, position, weekNumber, includeReps } = params;
  const contents: MessageContent[] = [];
  
  contents.push({
    type: "text",
    text: `# Week ${weekNumber || 1} Install: ${installSection}\n\n` +
      `## Your Role (${position.toUpperCase()})\n\n` +
      `Let's walk through this install step by step, just like we would in a meeting room.\n\n` +
      `### Key Points for ${position.toUpperCase()}:\n` +
      `1. Know your alignment first\n` +
      `2. Understand your assignment vs different looks\n` +
      `3. Communicate with players around you\n` +
      `4. Know your adjustment rules\n\n` +
      `I'll show you each scenario and quiz you on your responsibilities.`,
  });
  
  if (includeReps) {
    contents.push({
      type: "text",
      text: `### Mental Reps\n\n` +
        `Let's get some mental reps in. I'll give you different looks and you tell me your assignment.`,
    });
    
    // Generate a quiz for this install
    contents.push({
      type: "quiz",
      quiz: {
        id: `install-${installSection}-1`,
        question: `You're the ${position}. The defense shows Cover 3 with the SS coming down. What's your assignment?`,
        options: [
          "Block the SS",
          "Release into my route",
          "Check for blitz, then release",
          "Chip the DE and release",
        ],
        correctAnswer: 2,
        explanation: "When you see the SS coming down, check protection first. If we're sliding away, he's the RB's assignment. You release after confirming the protection handles him.",
        category: "install",
        difficulty: "intermediate",
      },
    });
  }
  
  return contents;
}

/**
 * BreakDownFilm — Analyze film clips with coverage, front, and assignment tags
 */
export function breakDownFilm(clipUrl: string, timestamp?: number): MessageContent[] {
  // In a real implementation, this would integrate with video analysis
  // For now, we'll provide a structured template response
  
  return [{
    type: "play-breakdown",
    playBreakdown: {
      coverage: "cover-3",
      formation: "shotgun-spread",
      concept: "mesh",
      protection: "slide-right",
      presnap: [
        "Defense in 4-3 over front",
        "Single high safety at 15 yards",
        "Corners at 7 yards, outside leverage",
        "SS walked down to strong side",
      ],
      postsnap: [
        "Cover 3 Sky — SS comes down for force",
        "LBs dropping to hook zones",
        "Mesh crossing underneath creates natural rub",
        "Outside receiver has 1-on-1 vs corner in deep third",
      ],
      coachingNotes: [
        "Pre-snap: Single high safety with SS walked down = Cover 3 Sky indicator",
        "The mesh concept is designed to beat this man/zone coverage underneath",
        "QB should read the crossers first, then work to the backside dig",
      ],
    },
    filmTimestamp: {
      videoId: clipUrl,
      startTime: timestamp || 0,
      label: "Play Breakdown",
      tags: ["cover-3", "mesh", "shotgun"],
    },
  }];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getSimpleAnalogy(coverageId: CoverageId): string {
  const analogies: Record<CoverageId, string> = {
    "cover-0": "Think of it as 'no help' — everyone has a man, no one's free to help if you get beat deep.",
    "cover-1": "One deep safety watching over everything like a center fielder in baseball.",
    "cover-2": "Two safeties splitting the field in half, like goalkeepers protecting their halves.",
    "cover-3": "Three deep defenders each taking a third of the field — divide and conquer.",
    "cover-4": "Four defenders each taking a quarter — maximum deep protection.",
    "cover-6": "Split personality — one side plays Cover 4, the other plays Cover 2.",
    "quarters": "Same as Cover 4 — four quarters of protection.",
    "match": "Hybrid coverage — starts zone, becomes man based on where receivers go.",
  };
  return analogies[coverageId] || "A fundamental coverage scheme every player needs to recognize.";
}

function getDepthRange(depth: string): string {
  switch (depth) {
    case "short": return "0-7 yards";
    case "intermediate": return "8-15 yards";
    case "deep": return "16+ yards";
    default: return depth;
  }
}

function getPositiveFeedback(): string {
  const feedbacks = [
    "That's it! Great recognition.",
    "Perfect. You nailed it.",
    "Correct! You're seeing it like a pro.",
    "Right on. That's how you read it.",
    "Got it! Your film study is paying off.",
    "Exactly right. Keep that focus.",
    "Yes sir! That's the correct read.",
    "Money. You're locked in.",
  ];
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

function getCorrectiveFeedback(): string {
  const feedbacks = [
    "Not quite. Let me show you what to look for.",
    "Close, but let's break this down again.",
    "I see where you went, but here's the key...",
    "Good effort, but let's refine that read.",
    "Not this time. Here's what you missed...",
    "Almost. Let me point out the difference.",
  ];
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

function getCorrectionCoachingNote(questionType: string): string {
  const notes: Record<string, string> = {
    coverage: "Focus on the safety structure first, then confirm with the corners.",
    route: "Remember the depth and break angle — those are your tells.",
    formation: "Count the skill players and their alignment.",
    protection: "Look at the box numbers and where the pressure is coming from.",
    default: "Review the fundamentals and you'll get the next one.",
  };
  return notes[questionType] || notes.default;
}

function getReleaseTechniques(route: Route, position?: string): string {
  const techniques = {
    inside: "Speed release inside, stack the defender",
    outside: "Outside release, threaten vertical first",
    vertical: "Push vertical hard, sell the go route",
  };
  
  return `• **Inside Release:** Attack the defender's inside shoulder, accelerate through contact\n` +
    `• **Outside Release:** Stem outside, use a two-way go\n` +
    `• **Vertical Stem:** Push to 12 yards before any break\n`;
}

function getStemTechnique(route: Route): string {
  return `Push vertical for ${route.path.stemYards} yards. Keep shoulders square to the goal line. ` +
    `Maintain full speed through the stem — the break only works if the defender respects your vertical threat.`;
}

function getBreakTechnique(route: Route): string {
  const breakTypes: Record<string, string> = {
    inside: "Plant hard on the outside foot, drive inside at 45°. Accelerate out of the break.",
    outside: "Plant on the inside foot, burst toward the sideline. Keep separation.",
    vertical: "No break — maintain full speed vertical. Stack the defender.",
    back: "Throttle down, plant both feet, work back to the QB. Create a target.",
    option: "Read the defender. Break opposite his leverage.",
  };
  
  return breakTypes[route.breakDirection] || "Execute a crisp break at the designated depth.";
}

function getLeverageCues(route: Route, vsDefender?: string): string {
  let cues = "**Read the defender:**\n";
  
  if (route.breakDirection === "inside") {
    cues += "• If he's inside leverage, take him vertical first, then cut under\n";
    cues += "• If he's outside leverage, attack inside immediately\n";
  } else if (route.breakDirection === "outside") {
    cues += "• If he's inside leverage, push vertical and break out\n";
    cues += "• If he's outside leverage, threaten inside, then break out\n";
  }
  
  if (vsDefender === "press") {
    cues += "\n**Vs Press:** Win at the line with a quick release. Don't let him jam you.";
  } else if (vsDefender === "off") {
    cues += "\n**Vs Off:** Attack his cushion. Eat up space before your break.";
  }
  
  return cues;
}

function getRouteVariations(route: Route): string {
  const variations: Record<string, string[]> = {
    slant: ["Bubble slant (shorter)", "Speed slant (burst inside)", "Option slant (read LB)"],
    out: ["Speed out (5 yards)", "Comeback out (sit in zone)", "Pivot out (option vs coverage)"],
    curl: ["Sit curl (zone)", "Shake curl (man)", "Speed curl (quick game)"],
    post: ["Skinny post (tighter angle)", "Bang post (quick hitting)", "Deep post (18+ yards)"],
    go: ["Fade (back shoulder)", "9 route (inside release)", "Streak (outside release)"],
  };
  
  return (variations[route.id] || ["Standard technique"]).map(v => `• ${v}`).join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TERMINOLOGY FUNCTIONS — NFL/NCAA Knowledge Base
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Define a football term with full explanation
 */
export function defineTerm(termQuery: string): MessageContent[] {
  const contents: MessageContent[] = [];
  
  // Search for the term
  const matches = searchTerms(termQuery);
  
  if (matches.length === 0) {
    contents.push({
      type: "text",
      text: `I couldn't find a definition for "${termQuery}". Try asking about common football terms like "audible", "hot route", "zone coverage", or "RPO".`,
    });
    return contents;
  }
  
  // Get the best match (first result)
  const term = matches[0];
  
  // Build the definition response
  let response = `# ${term.term}\n\n`;
  
  // Add aliases if present
  if (term.aliases.length > 0) {
    response += `*Also known as: ${term.aliases.join(", ")}*\n\n`;
  }
  
  // Main definition
  response += `**Definition:**\n${term.definition}\n\n`;
  
  // Examples
  if (term.examples.length > 0) {
    response += `**Usage Examples:**\n${term.examples.map(e => `• "${e}"`).join("\n")}\n\n`;
  }
  
  // Coaching points
  if (term.coachingPoints.length > 0) {
    response += `**Coaching Points:**\n${term.coachingPoints.map(p => `• ${p}`).join("\n")}\n\n`;
  }
  
  // Related terms
  if (term.relatedTerms.length > 0) {
    const relatedDefs = term.relatedTerms
      .map(id => getTermById(id))
      .filter((t): t is FootballTerm => t !== undefined);
    
    if (relatedDefs.length > 0) {
      response += `**Related Terms:** ${relatedDefs.map(t => t.term).join(", ")}`;
    }
  }
  
  contents.push({ type: "text", text: response });
  
  return contents;
}

/**
 * Get terminology for a specific position
 */
export function getPositionTerminology(position: string): MessageContent[] {
  const contents: MessageContent[] = [];
  
  const terms = getTermsForPosition(position);
  
  if (terms.length === 0) {
    contents.push({
      type: "text",
      text: `I don't have specific terminology for "${position}". Try: QB, RB, WR, TE, OL, DL, LB, or DB.`,
    });
    return contents;
  }
  
  const group = POSITION_GROUPS.find(
    g => g.id === position.toLowerCase() ||
         g.positions.some(p => p.toLowerCase() === position.toLowerCase())
  );
  
  let response = `# ${group?.name || position.toUpperCase()} Terminology\n\n`;
  
  // Key skills
  if (group?.keySkills) {
    response += `**Key Skills:**\n${group.keySkills.map(s => `• ${s}`).join("\n")}\n\n`;
  }
  
  response += `**Essential Terms:**\n\n`;
  
  // List first 5-6 important terms
  const displayTerms = terms.slice(0, 6);
  for (const term of displayTerms) {
    response += `**${term.term}** — ${term.definition.split(".")[0]}.\n\n`;
  }
  
  if (terms.length > 6) {
    response += `*...and ${terms.length - 6} more terms. Ask me about any specific term!*`;
  }
  
  contents.push({ type: "text", text: response });
  
  return contents;
}

/**
 * Explain a play call in any system
 */
export function explainPlayCall(playCall: string): MessageContent[] {
  const contents: MessageContent[] = [];
  
  // Check if it contains route numbers (Coryell style)
  const routeNumberMatch = playCall.match(/\d{2,3}/);
  if (routeNumberMatch) {
    const breakdown = breakdownRouteCall(routeNumberMatch[0]);
    if (breakdown && breakdown.length > 0) {
      let response = `# Play Call Analysis: "${playCall}"\n\n`;
      response += `**Route Breakdown (${routeNumberMatch[0]}):**\n\n`;
      
      for (const route of breakdown) {
        response += `• **${route.position}**: ${route.number} route = ${route.route}\n`;
      }
      
      response += `\n**Route Tree Reference:**\n`;
      response += `0=Hitch, 1=Quick Out, 2=Slant, 3=Deep Out, 4=Dig, 5=Speed Out, 6=Curl, 7=Corner, 8=Post, 9=Go`;
      
      contents.push({ type: "text", text: response });
      return contents;
    }
  }
  
  // Check for run play numbers
  const runNumberMatch = playCall.match(/(\d)(\d)\s*(power|zone|dive|iso|trap|toss|sweep)?/i);
  if (runNumberMatch) {
    const backNumber = parseInt(runNumberMatch[1], 10);
    const holeNumber = parseInt(runNumberMatch[2], 10);
    const holeInfo = getHoleExplanation(holeNumber);
    
    if (holeInfo) {
      let response = `# Run Play Breakdown: "${playCall}"\n\n`;
      response += `**${backNumber}-back** through the **${holeNumber} hole**\n\n`;
      response += `• Side: ${holeInfo.side.charAt(0).toUpperCase() + holeInfo.side.slice(1)}\n`;
      response += `• Gap: ${holeInfo.description}\n\n`;
      response += `**Numbering System:**\n`;
      response += `Odd holes (1,3,5,7,9) = Left side\n`;
      response += `Even holes (2,4,6,8) = Right side\n`;
      response += `A-gap=1/2, B-gap=3/4, C-gap=5/6, Outside=7/8`;
      
      contents.push({ type: "text", text: response });
      return contents;
    }
  }
  
  // Generic play call explanation
  let response = `# Play Call: "${playCall}"\n\n`;
  response += `**Breaking it down:**\n\n`;
  response += `NFL play calls typically follow this structure:\n`;
  response += `• **Formation** — Where players line up\n`;
  response += `• **Motion** — Pre-snap movement (if any)\n`;
  response += `• **Protection** — Blocking scheme\n`;
  response += `• **Concept** — The actual play/routes\n\n`;
  response += `Ask me to explain a specific system (West Coast, Air Raid, Erhardt-Perkins) for more details!`;
  
  contents.push({ type: "text", text: response });
  return contents;
}

/**
 * Translate a concept between offensive systems
 */
export function translatePlayBetweenSystems(
  concept: string,
  fromSystem?: SystemId,
  toSystem?: SystemId
): MessageContent[] {
  const contents: MessageContent[] = [];
  
  // Get concept across all systems
  const conceptLower = concept.toLowerCase();
  
  // Try to find matching concept ID
  const matchingConcept = ROUTE_CONCEPTS.find(
    c => c.name.toLowerCase().includes(conceptLower) ||
         c.id.toLowerCase().includes(conceptLower)
  );
  
  if (matchingConcept) {
    const translations = getConceptAcrossSystems(matchingConcept.id);
    
    if (translations.length > 0) {
      let response = `# "${matchingConcept.name}" Across Systems\n\n`;
      response += `${matchingConcept.description}\n\n`;
      response += `**System Terminology:**\n\n`;
      
      for (const trans of translations) {
        response += `• **${trans.system}:** "${trans.call}" — ${trans.explanation}\n`;
      }
      
      contents.push({ type: "text", text: response });
      return contents;
    }
  }
  
  // If no direct match, show available systems
  let response = `# Offensive Systems & Terminology\n\n`;
  response += `I couldn't find "${concept}" across systems. Here are the major offensive systems I can translate:\n\n`;
  
  for (const system of COACHING_SYSTEMS) {
    response += `**${system.name}** (${system.famousTeams.slice(0, 2).join(", ")})\n`;
    response += `Format: ${system.playCallFormat}\n`;
    response += `Example: "${system.passConcepts[0]?.systemCall || "N/A"}"\n\n`;
  }
  
  response += `*Ask about a specific concept like "mesh", "smash", or "four verticals"!*`;
  
  contents.push({ type: "text", text: response });
  return contents;
}

/**
 * Explain a coaching system
 */
export function explainCoachingSystem(systemName: string): MessageContent[] {
  const contents: MessageContent[] = [];
  
  // Find matching system
  const systemLower = systemName.toLowerCase();
  const system = COACHING_SYSTEMS.find(
    s => s.name.toLowerCase().includes(systemLower) ||
         s.shortName.toLowerCase().includes(systemLower) ||
         s.id.includes(systemLower)
  );
  
  if (!system) {
    contents.push({
      type: "text",
      text: `I don't have details on "${systemName}". Available systems:\n\n` +
            COACHING_SYSTEMS.map(s => `• ${s.name} (${s.shortName})`).join("\n"),
    });
    return contents;
  }
  
  let response = `# ${system.name}\n\n`;
  response += `*${system.origin}*\n\n`;
  response += `${system.description}\n\n`;
  
  response += `**Famous Teams:** ${system.famousTeams.join(", ")}\n`;
  response += `**Famous Coaches:** ${system.famousCoaches.join(", ")}\n\n`;
  
  response += `**Play Call Format:**\n\`${system.playCallFormat}\`\n\n`;
  response += `**Example:** "${system.playCallExample}"\n\n`;
  
  response += `**Philosophy:**\n${system.philosophy.map(p => `• ${p}`).join("\n")}\n\n`;
  
  response += `**Key Terminology:**\n`;
  for (const term of system.uniqueTerms.slice(0, 6)) {
    response += `• **${term.term}**: ${term.meaning}\n`;
  }
  
  contents.push({ type: "text", text: response });
  return contents;
}

/**
 * Get random terminology flashcards
 */
export function generateTerminologyFlashcards(count: number = 5): MessageContent[] {
  const contents: MessageContent[] = [];
  
  // Get random terms
  const shuffled = [...FOOTBALL_TERMS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  let response = `# Terminology Quiz\n\n`;
  response += `Test your knowledge on these ${count} terms:\n\n`;
  
  for (let i = 0; i < selected.length; i++) {
    const term = selected[i];
    response += `**${i + 1}. ${term.term}**\n`;
    response += `Category: ${term.category}\n`;
    response += `<spoiler>Definition: ${term.definition}</spoiler>\n\n`;
  }
  
  contents.push({ type: "text", text: response });
  
  // Add flashcards for interactive mode
  for (const term of selected.slice(0, 3)) {
    contents.push({
      type: "flashcard",
      flashcard: {
        id: `term-${term.id}`,
        front: `What is "${term.term}"?`,
        back: term.definition,
        category: term.category as "coverage" | "route" | "formation" | "protection" | "concept",
        difficulty: "intermediate",
        hint: term.examples[0],
      },
    });
  }
  
  return contents;
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a coach message with proper ID and timestamp
 */
export function createCoachMessage(
  content: MessageContent[],
  mode?: string,
  suggestedActions?: SuggestedAction[]
): CoachMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: "coach",
    content,
    timestamp: new Date(),
    mode: mode as CoachMessage["mode"],
    suggestedActions,
  };
}

/**
 * Generate a user message
 */
export function createUserMessage(text: string): CoachMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: "user",
    content: [{ type: "text", text }],
    timestamp: new Date(),
  };
}

/**
 * Generate welcome message based on context
 */
export function getWelcomeMessage(context: string): CoachMessage {
  const welcomes: Record<string, string> = {
    playbook: "Let's break down your playbook. What concept do you want to master today?",
    games: "Ready to test your knowledge? I'm here if you need a hint or explanation.",
    "film-room": "Film study is where games are won. What play do you want to analyze?",
    assignments: "Let's make sure you know your assignment inside and out. Pick a play.",
    installs: "Time to install. I'll walk you through each concept step by step.",
    terminology: "Football is a language. Ask me about any term, play call, or coaching system.",
    general: "What's on your mind? I can explain concepts, define terms, draw plays, or break down film.",
  };
  
  return createCoachMessage(
    [{
      type: "text",
      text: `👋 **Coach Mode Activated**\n\n${welcomes[context] || welcomes.general}`,
    }],
    "teach",
    [
      { id: "explain", label: "Explain a Concept", action: "ask" },
      { id: "define", label: "Define a Term", action: "ask", payload: "What does audible mean?" },
      { id: "diagram", label: "Draw a Play", action: "diagram" },
      { id: "quiz", label: "Quiz Me", action: "quiz" },
    ]
  );
}

