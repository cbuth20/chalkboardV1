// // ═══════════════════════════════════════════════════════════════════════════
// // COVERAGE QUESTIONS — Question data for Coverage ID game
// // Uses shared football domain models
// // ═══════════════════════════════════════════════════════════════════════════

// import {
//   type LegacyCoverageId,
//   type CoverageShell,
//   getCoverageByLegacyId,
//   getCoverageLabelFromLegacyId,
// } from "@/types/football";

// // Re-export types for backward compatibility
// export type { LegacyCoverageId as CoverageId } from "@/types/football";

// /**
//  * Coverage question definition
//  */
// export interface CoverageQuestion {
//   id: string;
//   coverageShellId?: string; // Reference to CoverageShell.id or variation id
//   diagramSrc: string;
//   description: string;
//   correctAnswer: LegacyCoverageId;
//   choices: LegacyCoverageId[];
//   coachNote: string;
// }

// /**
//  * Standard choices for all questions (using legacy IDs for display)
//  */
// export const COVERAGE_CHOICES: LegacyCoverageId[] = [
//   "C0",
//   "C1",
//   "C2",
//   "C3",
//   "C4",
//   "C6",
//   "QUARTERS",
//   "MATCH",
// ];

// /**
//  * Coverage questions with references to shared coverage shells
//  */
// export const COVERAGE_QUESTIONS: CoverageQuestion[] = [
//   // ─────────────────────────────────────────────────────────────────────────
//   // COVER 0 Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-c0-1",
//     coverageShellId: "cover-0",
//     diagramSrc: "/coverage-diagrams/c0-blitz.svg",
//     description:
//       "Pre-snap: No deep safeties. All DBs in press man alignment. Both safeties walked up showing A-gap blitz.",
//     correctAnswer: "C0",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 0 = No safety help deep. All-out pressure. Hot routes and quick game are the answer.",
//   },
//   {
//     id: "q-c0-2",
//     coverageShellId: "cover-0",
//     diagramSrc: "/coverage-diagrams/c0-pressure.svg",
//     description:
//       "Pre-snap: Corners in tight press, eyes locked on receivers. No one deeper than 8 yards. 7 defenders near the box.",
//     correctAnswer: "C0",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "When you see zero deep help, expect pressure. Win with timing routes and protection adjustments.",
//   },

//   // ─────────────────────────────────────────────────────────────────────────
//   // COVER 1 Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-c1-1",
//     coverageShellId: "cover-1",
//     diagramSrc: "/coverage-diagrams/c1-man.svg",
//     description:
//       "Pre-snap: Single high safety at 12 yards. Corners in press with inside leverage. DBs tracking receivers pre-snap.",
//     correctAnswer: "C1",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 1 = Man coverage with single high help. Attack with rubs, picks, and crossing routes.",
//   },
//   {
//     id: "q-c1-2",
//     coverageShellId: "cover-1",
//     diagramSrc: "/coverage-diagrams/c1-robber.svg",
//     description:
//       "Pre-snap: FS centered at 14 yards. SS lurking at 8 yards, reading QB eyes. Corners in man alignment.",
//     correctAnswer: "C1",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 1 Robber uses the SS as a middle-field rat. Avoid throwing to the middle of the field early.",
//   },
//   {
//     id: "q-c1-3",
//     coverageShellId: "cover-1",
//     diagramSrc: "/coverage-diagrams/c1-hole.svg",
//     description:
//       "Pre-snap: Single safety deep center field. LBs in man assignments on backs. Corners in off-man technique.",
//     correctAnswer: "C1",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 1 Hole puts LBs in man on RBs. Check releases and wheel routes can exploit this.",
//   },

//   // ─────────────────────────────────────────────────────────────────────────
//   // COVER 2 Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-c2-1",
//     coverageShellId: "cover-2",
//     diagramSrc: "/coverage-diagrams/c2-shell.svg",
//     description:
//       "Pre-snap: Two safeties splitting the field at 12-14 yards. Corners squatting at 5 yards with outside leverage.",
//     correctAnswer: "C2",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 2 = Two deep halves. Attack the hole between corner and safety with corner routes and smash concepts.",
//   },
//   {
//     id: "q-c2-2",
//     coverageShellId: "cover-2",
//     diagramSrc: "/coverage-diagrams/c2-tampa.svg",
//     description:
//       "Pre-snap: Two high safeties. Mike LB dropping straight back at snap. Corners sinking to flat zones.",
//     correctAnswer: "C2",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Tampa 2 uses the Mike as a deep middle dropper. Attack the seams before he gets depth.",
//   },
//   {
//     id: "q-c2-3",
//     coverageShellId: "cover-2",
//     diagramSrc: "/coverage-diagrams/c2-man.svg",
//     description:
//       "Pre-snap: Two deep safeties. All underneath defenders showing man technique, shadowing receivers.",
//     correctAnswer: "C2",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "2-Man Under = Man coverage with 2 deep. Use bunch and stack formations to create natural picks.",
//   },

//   // ─────────────────────────────────────────────────────────────────────────
//   // COVER 3 Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-c3-1",
//     coverageShellId: "cover-3",
//     diagramSrc: "/coverage-diagrams/c3-sky.svg",
//     description:
//       "Pre-snap: Single high safety centered. Corners at 7-8 yards with outside leverage. SS rotating down.",
//     correctAnswer: "C3",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 3 Sky = Safety comes down to play force. Attack the flat-to-corner window with flood concepts.",
//   },
//   {
//     id: "q-c3-2",
//     coverageShellId: "cover-3",
//     diagramSrc: "/coverage-diagrams/c3-cloud.svg",
//     description:
//       "Pre-snap: Single high FS. Corner at 5 yards bailing at snap. Safety staying deep on the boundary.",
//     correctAnswer: "C3",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 3 Cloud = Corner drops to flat, safety takes deep third. Speed outs and quick game work here.",
//   },
//   {
//     id: "q-c3-3",
//     coverageShellId: "cover-3",
//     diagramSrc: "/coverage-diagrams/c3-buzz.svg",
//     description:
//       "Pre-snap: Single high safety. OLBs showing zone drops. Corners playing soft with inside leverage.",
//     correctAnswer: "C3",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 3 Buzz drops OLBs into the flats. Four verticals and seam routes stress the deep thirds.",
//   },

//   // ─────────────────────────────────────────────────────────────────────────
//   // COVER 4 / QUARTERS Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-c4-1",
//     coverageShellId: "quarters",
//     diagramSrc: "/coverage-diagrams/c4-quarters.svg",
//     description:
//       "Pre-snap: Two high safeties at 10-12 yards. Corners at 7 yards with inside leverage, keying #2.",
//     correctAnswer: "QUARTERS",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Quarters = 4 deep defenders each with a quarter of the field. Underneath crossers and digs work well.",
//   },
//   {
//     id: "q-c4-2",
//     coverageShellId: "quarters",
//     diagramSrc: "/coverage-diagrams/c4-poach.svg",
//     description:
//       "Pre-snap: Two high shell. Safeties reading #2 receivers. Corners playing off, reading through #2 to #1.",
//     correctAnswer: "QUARTERS",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Quarters keys on #2. If #2 goes vertical, safety carries. If not, safety reads to #1 or helps inside.",
//   },
//   {
//     id: "q-c4-3",
//     coverageShellId: "quarters",
//     diagramSrc: "/coverage-diagrams/c4-solo.svg",
//     description:
//       "Pre-snap: Safeties at 12 yards, splitting #2 receivers. Corners in bail technique at 8 yards.",
//     correctAnswer: "QUARTERS",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Quarters solo = Each DB has their quarter regardless of routes. Post-dig combos attack this.",
//   },

//   // ─────────────────────────────────────────────────────────────────────────
//   // COVER 6 Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-c6-1",
//     coverageShellId: "cover-6",
//     diagramSrc: "/coverage-diagrams/c6-field.svg",
//     description:
//       "Pre-snap: SS rolled down to field side. FS playing deep half to boundary. Field corner at 7 yards off.",
//     correctAnswer: "C6",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 6 = Quarters to the field, Cover 2 to the boundary. Attack the boundary corner route.",
//   },
//   {
//     id: "q-c6-2",
//     coverageShellId: "cover-6",
//     diagramSrc: "/coverage-diagrams/c6-boundary.svg",
//     description:
//       "Pre-snap: Boundary safety deep at 14 yards. Field safety at 10 yards, inside leverage on #2. Asymmetric shell.",
//     correctAnswer: "C6",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Cover 6 is a split-field coverage. Identify which side has quarters vs. halves and attack accordingly.",
//   },

//   // ─────────────────────────────────────────────────────────────────────────
//   // MATCH Coverage Questions
//   // ─────────────────────────────────────────────────────────────────────────
//   {
//     id: "q-match-1",
//     coverageShellId: "match",
//     diagramSrc: "/coverage-diagrams/match-quarters.svg",
//     description:
//       "Pre-snap: Two high shell. Post-snap: DBs passing off routes through zones, matching receivers based on their release.",
//     correctAnswer: "MATCH",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Match coverage adapts to route combinations. Levels and option routes can create confusion.",
//   },
//   {
//     id: "q-match-2",
//     coverageShellId: "match",
//     diagramSrc: "/coverage-diagrams/match-mable.svg",
//     description:
//       "Pre-snap: Two high safeties. Corners play man on #1 unless #2 goes vertical, then they match #2.",
//     correctAnswer: "MATCH",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "MABLE (Man-Bracket-Lock-Expand) is a pattern match that adjusts to #2's route. Use double moves.",
//   },
//   {
//     id: "q-match-3",
//     coverageShellId: "match",
//     diagramSrc: "/coverage-diagrams/match-solo.svg",
//     description:
//       "Pre-snap: Nickel package, two high. Post-snap: DBs reading route stems and matching accordingly.",
//     correctAnswer: "MATCH",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Pattern match can look like zone or man. The key is it adapts to offensive route combos.",
//   },
//   {
//     id: "q-match-4",
//     coverageShellId: "match",
//     diagramSrc: "/coverage-diagrams/match-special.svg",
//     description:
//       "Pre-snap: Two high. LBs showing zone. Post-snap: DBs carry vertical routes, pass off horizontal routes.",
//     correctAnswer: "MATCH",
//     choices: COVERAGE_CHOICES,
//     coachNote:
//       "Match coverages use rules to determine who covers whom based on offensive releases.",
//   },
// ];

// // ═══════════════════════════════════════════════════════════════════════════
// // HELPER FUNCTIONS
// // ═══════════════════════════════════════════════════════════════════════════

// /**
//  * Get a random subset of questions
//  */
// export function getRandomQuestions(count: number): CoverageQuestion[] {
//   const shuffled = [...COVERAGE_QUESTIONS].sort(() => Math.random() - 0.5);
//   return shuffled.slice(0, Math.min(count, shuffled.length));
// }

// /**
//  * Get coverage label for display (using shared model)
//  */
// export function getCoverageLabel(coverage: LegacyCoverageId): string {
//   return getCoverageLabelFromLegacyId(coverage);
// }

// /**
//  * Get the full coverage shell data for a question
//  */
// export function getCoverageShellForQuestion(
//   question: CoverageQuestion
// ): CoverageShell | undefined {
//   return getCoverageByLegacyId(question.correctAnswer);
// }

// /**
//  * Get questions for a specific coverage type
//  */
// export function getQuestionsForCoverage(
//   coverageId: LegacyCoverageId
// ): CoverageQuestion[] {
//   return COVERAGE_QUESTIONS.filter((q) => q.correctAnswer === coverageId);
// }

// /**
//  * Get coaching points from the shared coverage shell
//  */
// export function getCoachingPointsForCoverage(
//   coverageId: LegacyCoverageId
// ): string[] {
//   const shell = getCoverageByLegacyId(coverageId);
//   return shell?.coachingPoints ?? [];
// }

// /**
//  * Get vulnerabilities for a coverage (what beats it)
//  */
// export function getVulnerabilitiesForCoverage(
//   coverageId: LegacyCoverageId
// ): string[] {
//   const shell = getCoverageByLegacyId(coverageId);
//   return shell?.vulnerabilities ?? [];
// }
