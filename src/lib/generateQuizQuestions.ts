// ═══════════════════════════════════════════════════════════════════════════
// QUIZ QUESTION GENERATOR — Convert GPT-analyzed plays to quiz questions
// Takes play data from GPT Vision API and generates assignment tracker questions
// ═══════════════════════════════════════════════════════════════════════════

import type { PlayDefinition, PositionAssignment, AssignmentQuestion, SkillPosition, AssignmentCategory } from '@/domain/football/playAssignments';

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

// GPT Vision API response format
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
}

/**
 * Convert GPT-analyzed play data to PlayDefinition format
 */
export function convertGPTPlayToDefinition(
  gptPlay: GPTPlayAnalysis,
  playId?: string
): PlayDefinition {
  // Convert positions object to assignments array
  const assignments: PositionAssignment[] = Object.entries(gptPlay.positions).map(
    ([position, data]) => ({
      position: position as SkillPosition,
      alignment: data.alignment,
      landmark: data.landmark,
      assignment: data.assignment,
      read: data.read,
      adjustments: {
        vsMan: data.adjustments.vsMan,
        vsZone: data.adjustments.vsZone,
        vsBlitz: data.adjustments.vsBlitz,
      },
      routeId: data.routeId as any,
      depth: data.depth,
      motion: data.motion,
    })
  );

  return {
    id: playId || gptPlay.fileName?.replace(/\.[^/.]+$/, '') || `play-${Date.now()}`,
    name: gptPlay.name,
    shortName: gptPlay.shortName,
    formation: gptPlay.formation as any,
    playType: gptPlay.playType,
    concept: gptPlay.concept,
    assignments,
    description: gptPlay.description,
    keyPoints: gptPlay.keyPoints,
    bestAgainst: gptPlay.bestAgainst,
    diagramType: gptPlay.playType === 'run' ? 'run' : 'pass',
  };
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
