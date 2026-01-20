// ═══════════════════════════════════════════════════════════════════════════
// QUIZ QUESTION GENERATOR — Convert GPT-analyzed plays to quiz questions
// Takes play data from GPT Vision API and generates assignment tracker questions
// ═══════════════════════════════════════════════════════════════════════════

import type { PlayDefinition, PositionAssignment, AssignmentQuestion, SkillPosition, AssignmentCategory } from '@/types/football';

// GPT Vision API returns position data in this format
interface GPTPositionData {
  alignment: string;
  landmark: string;
  assignment: string;
  read: string;
  adjustments: {
    vsMan: string;
    vsZone: string;
    vsBlitz?: string;
  };
  routeId?: string;
  depth?: number;
  motion?: string;
}

// GPT Vision API response format for plays
export interface GPTPlayAnalysis {
  name: string;
  shortName: string;
  formation: string;
  playType: 'pass' | 'run' | 'rpo' | 'screen';
  concept: string;
  description: string;
  keyPoints: string[];
  bestAgainst: string[];
  positions: {
    [key: string]: GPTPositionData;
  };
  fileName?: string;
  imageUrl?: string;
  analyzedAt?: string;
  contentType?: 'play' | 'coverage' | 'formation' | 'notes';
}

// Formation analysis response
export interface GPTFormationAnalysis {
  name?: string;
  title?: string;
  personnel?: string;
  alignment?: string;
  description?: string;
  keyFeatures?: string[];
  commonPlays?: string[];
  formations?: Array<{
    name: string;
    personnel?: string;
    alignment?: string;
    keyFeatures?: string[];
    commonPlays?: string[];
    positions?: {
      [key: string]: { alignment: string };
    };
  }>;
  positions?: {
    [key: string]: { alignment: string };
  };
  notes?: string;
  fileName?: string;
  imageUrl?: string;
  analyzedAt?: string;
  contentType: 'formation';
}

// Coverage analysis response
export interface GPTCoverageAnalysis {
  name: string;
  shortName: string;
  coverageType: string;
  coverageFamily: string;
  front: string;
  description: string;
  keyPoints: string[];
  strengths: string[];
  weaknesses: string[];
  positions: {
    [key: string]: {
      alignment: string;
      landmark: string;
      assignment: string;
      read: string;
      adjustments?: {
        vsTrips?: string;
        vs2x2?: string;
        vsEmpty?: string;
        vsMotion?: string;
      };
    };
  };
  fileName?: string;
  imageUrl?: string;
  analyzedAt?: string;
  contentType: 'coverage';
}

// Notes/reference material analysis response
export interface GPTNotesAnalysis {
  title: string;
  contentType: 'legend' | 'index' | 'coaching_points' | 'technique' | 'terminology' | 'reference' | 'other';
  description: string;
  sections?: Array<{
    heading: string;
    content: string;
    keyPoints: string[];
  }>;
  terminology?: Array<{
    term: string;
    definition: string;
  }>;
  diagrams?: Array<{
    description: string;
    keyPoints: string[];
  }>;
  coachingPoints?: string[];
  notes?: string;
  fileName?: string;
  imageUrl?: string;
  analyzedAt?: string;
}

// Union type for all analysis types
export type GPTAnalysis = GPTPlayAnalysis | GPTFormationAnalysis | GPTCoverageAnalysis | GPTNotesAnalysis;

/**
 * Detect content type from GPT analysis response
 */
function detectContentType(analysis: any): 'play' | 'coverage' | 'formation' | 'notes' {
  // Check explicit contentType field
  if (analysis.contentType) {
    return analysis.contentType as 'play' | 'coverage' | 'formation' | 'notes';
  }

  // Detect based on response structure
  if (analysis.coverageType || analysis.coverageFamily) {
    return 'coverage';
  }

  if (analysis.formations || (analysis.title && analysis.personnel)) {
    return 'formation';
  }

  if (analysis.sections || analysis.terminology || analysis.diagrams) {
    return 'notes';
  }

  // Default to play
  return 'play';
}

/**
 * Convert GPT-analyzed play data to PlayDefinition format
 * Includes defensive checks for incomplete API responses
 */
export function convertGPTPlayToDefinition(
  gptPlay: GPTPlayAnalysis,
  playId?: string
): PlayDefinition {
  // Defensive check: ensure positions object exists
  const positions = gptPlay?.positions || {};

  // Convert positions object to assignments array
  const assignments: PositionAssignment[] = Object.entries(positions).map(
    ([position, data]) => ({
      position: position as SkillPosition,
      alignment: data?.alignment || 'Unknown',
      landmark: data?.landmark || 'Unknown',
      assignment: data?.assignment || 'Unknown',
      read: data?.read || 'Unknown',
      adjustments: {
        vsMan: data?.adjustments?.vsMan || 'No adjustment',
        vsZone: data?.adjustments?.vsZone || 'No adjustment',
        vsBlitz: data?.adjustments?.vsBlitz,
      },
      routeId: data?.routeId as any,
      depth: data?.depth,
      motion: data?.motion,
    })
  );

  return {
    id: playId || gptPlay?.fileName?.replace(/\.[^/.]+$/, '') || `play-${Date.now()}`,
    name: gptPlay?.name || 'Unnamed Play',
    shortName: gptPlay?.shortName || 'Unknown',
    formation: (gptPlay?.formation || 'Unknown') as any,
    playType: gptPlay?.playType || 'pass',
    concept: gptPlay?.concept || 'Unknown Concept',
    assignments,
    description: gptPlay?.description || 'No description available',
    keyPoints: gptPlay?.keyPoints || [],
    bestAgainst: gptPlay?.bestAgainst || [],
    diagramType: gptPlay?.playType === 'run' ? 'run' : 'pass',
  };
}

/**
 * Convert GPT-analyzed coverage data to a format suitable for assignments
 */
export function convertGPTCoverageToDefinition(
  gptCoverage: GPTCoverageAnalysis,
  playId?: string
): any {
  const positions = gptCoverage?.positions || {};

  const assignments: PositionAssignment[] = Object.entries(positions).map(
    ([position, data]) => ({
      position: position as SkillPosition,
      alignment: data?.alignment || 'Unknown',
      landmark: data?.landmark || 'Unknown',
      assignment: data?.assignment || 'Unknown',
      read: data?.read || 'Unknown',
      adjustments: {
        vsMan: data?.adjustments?.vsTrips || 'No adjustment',
        vsZone: data?.adjustments?.vs2x2 || 'No adjustment',
        vsBlitz: data?.adjustments?.vsEmpty,
      },
    })
  );

  return {
    id: playId || gptCoverage?.fileName?.replace(/\.[^/.]+$/, '') || `coverage-${Date.now()}`,
    name: gptCoverage?.name || 'Unnamed Coverage',
    shortName: gptCoverage?.shortName || 'Unknown',
    formation: gptCoverage?.front || 'Unknown',
    playType: 'defense' as any,
    concept: gptCoverage?.coverageType || 'Unknown Coverage',
    assignments,
    description: gptCoverage?.description || 'No description available',
    keyPoints: gptCoverage?.keyPoints || [],
    bestAgainst: gptCoverage?.strengths || [],
    weaknesses: gptCoverage?.weaknesses || [],
    diagramType: 'defense' as any,
    contentType: 'coverage' as const,
  };
}

/**
 * Convert GPT-analyzed formation data to a format suitable for reference
 */
export function convertGPTFormationToDefinition(
  gptFormation: GPTFormationAnalysis,
  playId?: string
): any {
  // Handle multi-formation sheets
  if (gptFormation.formations && gptFormation.formations.length > 0) {
    return {
      id: playId || gptFormation?.fileName?.replace(/\.[^/.]+$/, '') || `formations-${Date.now()}`,
      name: gptFormation?.title || 'Formation Sheet',
      shortName: gptFormation?.title?.substring(0, 20) || 'Formations',
      description: gptFormation?.description || 'No description available',
      formations: gptFormation.formations,
      notes: gptFormation.notes,
      contentType: 'formation' as const,
      isMultiFormation: true,
    };
  }

  // Handle single formation
  return {
    id: playId || gptFormation?.fileName?.replace(/\.[^/.]+$/, '') || `formation-${Date.now()}`,
    name: gptFormation?.name || 'Unnamed Formation',
    shortName: gptFormation?.name?.substring(0, 20) || 'Formation',
    personnel: gptFormation?.personnel,
    alignment: gptFormation?.alignment,
    description: gptFormation?.description || 'No description available',
    keyFeatures: gptFormation?.keyFeatures || [],
    commonPlays: gptFormation?.commonPlays || [],
    positions: gptFormation?.positions || {},
    notes: gptFormation?.notes,
    contentType: 'formation' as const,
    isMultiFormation: false,
  };
}

/**
 * Convert GPT-analyzed notes/reference material to a format suitable for study
 */
export function convertGPTNotesToDefinition(
  gptNotes: GPTNotesAnalysis,
  playId?: string
): any {
  return {
    id: playId || gptNotes?.fileName?.replace(/\.[^/.]+$/, '') || `notes-${Date.now()}`,
    name: gptNotes?.title || 'Reference Material',
    shortName: gptNotes?.title?.substring(0, 20) || 'Reference',
    description: gptNotes?.description || 'No description available',
    sections: gptNotes?.sections || [],
    terminology: gptNotes?.terminology || [],
    diagrams: gptNotes?.diagrams || [],
    coachingPoints: gptNotes?.coachingPoints || [],
    notes: gptNotes?.notes,
    contentType: 'notes' as const,
    noteType: gptNotes?.contentType || 'reference',
  };
}

/**
 * Universal converter that detects content type and routes to appropriate converter
 */
export function convertGPTAnalysisToDefinition(
  analysis: GPTAnalysis,
  playId?: string
): any {
  const contentType = detectContentType(analysis);

  switch (contentType) {
    case 'coverage':
      return convertGPTCoverageToDefinition(analysis as GPTCoverageAnalysis, playId);
    case 'formation':
      return convertGPTFormationToDefinition(analysis as GPTFormationAnalysis, playId);
    case 'notes':
      return convertGPTNotesToDefinition(analysis as GPTNotesAnalysis, playId);
    case 'play':
    default:
      return convertGPTPlayToDefinition(analysis as GPTPlayAnalysis, playId);
  }
}

/**
 * Generate all quiz questions for a specific position on a play
 */
export function generateQuestionsForPosition(
  play: PlayDefinition,
  position: SkillPosition
): AssignmentQuestion[] {
  const assignment = play.assignments.find(a => a.position === position);
  if (!assignment) return [];

  const questions: AssignmentQuestion[] = [];

  // Alignment question
  questions.push({
    playId: play.id,
    position,
    category: 'alignment',
    question: `Where do you align on ${play.name}?`,
    correctAnswer: assignment.alignment,
    options: generateAlignmentOptions(assignment.alignment, play.assignments),
    hint: `Think about your position relative to the formation`,
  });

  // Landmark question
  questions.push({
    playId: play.id,
    position,
    category: 'landmark',
    question: `What's your landmark/aiming point on ${play.name}?`,
    correctAnswer: assignment.landmark,
    options: generateLandmarkOptions(assignment.landmark, play.assignments),
  });

  // Assignment question
  questions.push({
    playId: play.id,
    position,
    category: 'assignment',
    question: `What's your assignment on ${play.name}?`,
    correctAnswer: assignment.assignment,
    options: generateAssignmentOptions(assignment.assignment, play.playType, play.assignments),
  });

  // Read question
  questions.push({
    playId: play.id,
    position,
    category: 'read',
    question: `What's your key read on ${play.name}?`,
    correctAnswer: assignment.read,
    options: generateReadOptions(assignment.read, play.assignments),
  });

  // Adjustment question (vs Man)
  questions.push({
    playId: play.id,
    position,
    category: 'adjustment',
    question: `How do you adjust vs Man coverage on ${play.name}?`,
    correctAnswer: assignment.adjustments.vsMan,
    options: generateAdjustmentOptions(assignment.adjustments.vsMan, play.assignments),
  });

  // Adjustment question (vs Zone)
  questions.push({
    playId: play.id,
    position,
    category: 'adjustment',
    question: `How do you adjust vs Zone coverage on ${play.name}?`,
    correctAnswer: assignment.adjustments.vsZone,
    options: generateAdjustmentOptions(assignment.adjustments.vsZone, play.assignments),
  });

  return questions;
}

/**
 * Generate all quiz questions for an entire play
 */
export function generateQuestionsForPlay(play: PlayDefinition): AssignmentQuestion[] {
  const allQuestions: AssignmentQuestion[] = [];

  for (const assignment of play.assignments) {
    const positionQuestions = generateQuestionsForPosition(play, assignment.position);
    allQuestions.push(...positionQuestions);
  }

  return allQuestions;
}

/**
 * Generate quiz questions directly from GPT analysis
 */
export function generateQuestionsFromGPTAnalysis(
  gptPlay: GPTPlayAnalysis
): AssignmentQuestion[] {
  const playDef = convertGPTPlayToDefinition(gptPlay);
  return generateQuestionsForPlay(playDef);
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION GENERATORS — Create wrong answers for multiple choice
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate alignment options using data from the current play plus fallbacks
 */
function generateAlignmentOptions(
  correct: string,
  assignments: PositionAssignment[]
): string[] {
  // Use alignments from the play itself as wrong answers
  const playAlignments = assignments.map(a => a.alignment);

  // Add common fallback alignments
  const fallbackAlignments = [
    'Shotgun, 5 yards deep',
    'Shotgun, 4 yards deep',
    'Split left, on numbers',
    'Split right, on numbers',
    'Left slot, 1 yard off ball',
    'Right slot, 1 yard off ball',
    'Inline, tight',
    'Offset left, 1 yard behind QB',
    'Beside QB',
    'Under center',
  ];

  const allOptions = [...playAlignments, ...fallbackAlignments];
  return shuffleAndPick(allOptions, correct, 4);
}

/**
 * Generate landmark options
 */
function generateLandmarkOptions(
  correct: string,
  assignments: PositionAssignment[]
): string[] {
  const playLandmarks = assignments.map(a => a.landmark);

  const fallbackLandmarks = [
    'Back pylon',
    'Corner of end zone',
    'Goalpost',
    'Opposite hash',
    'Far hash',
    'Inside hip of Mike',
    'Eyes on Mike LB',
    'Sideline at LOS',
    'Numbers at LOS',
    'Playside A-gap',
    'Inside shoulder of corner',
  ];

  const allOptions = [...playLandmarks, ...fallbackLandmarks];
  return shuffleAndPick(allOptions, correct, 4);
}

/**
 * Generate assignment options
 */
function generateAssignmentOptions(
  correct: string,
  playType: string,
  assignments: PositionAssignment[]
): string[] {
  const playAssignments = assignments.map(a => a.assignment);

  const passAssignments = [
    'Corner route at 12-15 yards',
    'Go route - win outside',
    'Shallow cross at 6 yards',
    'Check release to flat',
    'Seam route between numbers and hash',
    'Slant at 5-6 yards',
    'Arrow/Flat route',
    'Dig route at 12 yards',
    'Out route at 10-12 yards',
    'Post route at 15 yards',
  ];

  const runAssignments = [
    'Zone track - read first DL to playside',
    'Block perimeter - stalk corner',
    'Zone combo - double team to LB',
    'Arc block or crack',
    'Kick out the end man on LOS',
    'Down block, seal inside',
    'Block safety or crack on LB',
    'Lead through hole',
  ];

  const fallbackOptions = playType === 'run' ? runAssignments : passAssignments;
  const allOptions = [...playAssignments, ...fallbackOptions];
  return shuffleAndPick(allOptions, correct, 4);
}

/**
 * Generate read options
 */
function generateReadOptions(
  correct: string,
  assignments: PositionAssignment[]
): string[] {
  const playReads = assignments.map(a => a.read);

  const fallbackReads = [
    'Mike LB movement',
    'Safety leverage',
    'Corner technique',
    'Find window in zone',
    'If free, release to flat',
    'Single high safety',
    'Flat defender',
    'First down lineman',
    'Block most dangerous defender',
  ];

  const allOptions = [...playReads, ...fallbackReads];
  return shuffleAndPick(allOptions, correct, 4);
}

/**
 * Generate adjustment options
 */
function generateAdjustmentOptions(
  correct: string,
  assignments: PositionAssignment[]
): string[] {
  const playAdjustments = assignments.flatMap(a => [
    a.adjustments.vsMan,
    a.adjustments.vsZone,
    a.adjustments.vsBlitz,
  ]).filter(Boolean) as string[];

  const fallbackAdjustments = [
    'Stack and separate at break',
    'Win at line, stack defender',
    'Win matchup vs LB',
    'Speed release, stack corner',
    'Find soft spot',
    'Press hole, one cut, go',
    'Stalk block, cut off pursuit',
    'Follow blocks, be patient',
  ];

  const allOptions = [...playAdjustments, ...fallbackAdjustments];
  return shuffleAndPick(allOptions, correct, 4);
}

/**
 * Utility: shuffle array and pick N options including the correct one
 */
function shuffleAndPick(options: string[], correct: string, count: number): string[] {
  // Remove duplicates and the correct answer
  const uniqueOptions = Array.from(new Set(options));
  const filtered = uniqueOptions.filter(o => o !== correct);

  // Shuffle and pick wrong answers
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  const wrongAnswers = shuffled.slice(0, count - 1);

  // Combine with correct answer and shuffle again
  const result = [...wrongAnswers, correct];
  return result.sort(() => Math.random() - 0.5);
}

/**
 * Get all available positions from a play
 */
export function getPositionsForPlay(play: PlayDefinition): SkillPosition[] {
  return play.assignments.map(a => a.position);
}
