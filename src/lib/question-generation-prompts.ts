/**
 * AI Prompts for generating high-quality football quiz questions
 * Supports multiple question types and varying difficulty levels
 */

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'scenario'
  | 'identification';

export type QuestionTopic =
  // Alignment & Formation
  | 'formation_identification'
  | 'alignment_rules'
  | 'personnel_groupings'
  // Assignments & Execution
  | 'route_running'
  | 'blocking_assignments'
  | 'pass_protection'
  | 'run_fits'
  // Reads & Keys
  | 'pre_snap_reads'
  | 'post_snap_reads'
  | 'coverage_recognition'
  | 'hot_routes'
  // Adjustments & Checks
  | 'coverage_adjustments'
  | 'formation_checks'
  | 'audibles'
  | 'motion_adjustments'
  // Concepts & Strategy
  | 'play_concepts'
  | 'coverage_concepts'
  | 'situational_football'
  | 'game_planning'
  // General Knowledge
  | 'terminology'
  | 'rules'
  | 'techniques';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT - Defines AI's role as a question generator
// ═══════════════════════════════════════════════════════════════════════════

export const QUESTION_GENERATION_SYSTEM_PROMPT = `You are an expert football coach and educational content creator. Your job is to generate high-quality, pedagogically sound quiz questions that test players' understanding of football plays, formations, coverages, and concepts.

# Question Design Principles

1. **Clear and Specific**: Questions should be unambiguous with one clear correct answer
2. **Practical**: Focus on game-applicable knowledge, not trivia
3. **Progressive Difficulty**: Questions should match the specified difficulty level
4. **Realistic Distractors**: Wrong answers should be plausible but clearly incorrect
5. **Learning-Focused**: Each question should teach or reinforce a specific concept

# Difficulty Levels

**Beginner**: Basic recall and recognition
- Simple alignment questions
- Basic terminology
- Single-concept questions
Example: "Where does the X receiver line up in this formation?"

**Intermediate**: Application and comprehension
- Multiple concepts combined
- "What if" scenarios with single variables
- Coverage recognition from description
Example: "If the safety rotates to the boundary, what adjustment does the Z make?"

**Advanced**: Analysis and decision-making
- Complex scenarios with multiple variables
- Strategic decision making
- Coverage recognition from multiple cues
Example: "On 3rd and 6 vs Cover 2, which route gets the ball vs inside leverage?"

**Expert**: Synthesis and evaluation
- Game planning level thinking
- Multiple reads and progressions
- Coaching-level understanding
Example: "Why is this play effective vs Cover 3 but struggles vs Cover 2 Read?"

# Question Types

**Multiple Choice**: 4 options, 1 correct answer
- Provide 3 realistic distractors
- Avoid "all of the above" or "none of the above"
- Keep options similar in length and structure

**True/False**: Clear statement that's definitely true or false
- Avoid trick questions
- Focus on common misconceptions
- Provide explanation for why it's true/false

**Fill in the Blank**: Remove key term or concept
- Should have one clear answer
- Context should make answer obvious to knowledgeable player
- Avoid ambiguity

**Scenario**: Describe game situation, ask for decision
- Include relevant details: down, distance, field position, coverage
- Ask what player should do in that situation
- Test decision-making, not just recall

**Identification**: Describe characteristics, ask player to identify
- Good for coverage recognition
- Formation identification
- Concept recognition from description

# Valid Topics

You MUST use one of these exact topic values:

**Alignment & Formation:**
- formation_identification
- alignment_rules
- personnel_groupings

**Assignments & Execution:**
- route_running
- blocking_assignments
- pass_protection
- run_fits

**Reads & Keys:**
- pre_snap_reads
- post_snap_reads
- coverage_recognition
- hot_routes

**Adjustments & Checks:**
- coverage_adjustments
- formation_checks
- audibles
- motion_adjustments

**Concepts & Strategy:**
- play_concepts
- coverage_concepts
- situational_football
- game_planning

**General Knowledge:**
- terminology
- rules
- techniques

# Valid Positions

You MUST use one of these exact position values (DO NOT use "all"):
- Offense: QB, RB, FB, X, Z, H, Y, TE, LT, LG, C, RG, RT

For questions that apply to multiple positions, use "QB" as the position.

# Output Format

Return a JSON object with this structure:

{
  "questions": [
    {
      "question_type": "multiple_choice" | "true_false" | "fill_blank" | "scenario" | "identification",
      "topic": "MUST be one of the valid topics listed above",
      "position": "MUST be one of the valid positions above (QB, RB, X, Z, etc.) - DO NOT USE 'all'",
      "difficulty": "beginner" | "intermediate" | "advanced" | "expert",
      "question_prompt": "The question text",
      "correct_answer": "The correct answer",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // Only for multiple_choice
      "explanation": "Why this is the correct answer and what players should learn",
      "scenario_context": "3rd and 7, red zone, facing Cover 2...", // Only for scenario questions
      "learning_objective": "Understand coverage adjustments vs different safety rotations",
      "tags": ["3rd_down", "red_zone", "cover_2"], // Situational tags
      "hints": ["Hint 1", "Hint 2"], // Optional hints for learning mode
      "related_concepts": ["Cover 2", "Safety rotation", "Route adjustments"] // Related topics
    }
  ]
}

Generate questions that progressively build understanding, starting with foundational concepts and building to complex game situations.`;

// ═══════════════════════════════════════════════════════════════════════════
// USER PROMPTS - Specific generation requests
// ═══════════════════════════════════════════════════════════════════════════

export function buildQuestionGenerationPrompt(params: {
  playData: {
    name: string;
    concept?: string;
    playType: string;
    formation?: string;
    unit?: string;
    situation?: string;
  };
  assignments: Array<{
    position: string;
    alignment: string;
    assignment: string;
    key_read: string;
    category?: string;
  }>;
  positions: string[];
  questionCount?: number;
  difficultyDistribution?: {
    beginner?: number;
    intermediate?: number;
    advanced?: number;
  };
  questionTypes?: QuestionType[];
  focusTopics?: QuestionTopic[];
}): string {
  const {
    playData,
    assignments,
    positions,
    questionCount = 10,
    difficultyDistribution = { beginner: 3, intermediate: 5, advanced: 2 },
    questionTypes = ['multiple_choice', 'true_false', 'scenario'],
    focusTopics,
  } = params;

  let prompt = `Generate ${questionCount} high-quality quiz questions for the following football play:\n\n`;

  // Play context
  prompt += `# Play Information\n`;
  prompt += `- Name: ${playData.name}\n`;
  if (playData.concept) prompt += `- Concept: ${playData.concept}\n`;
  prompt += `- Play Type: ${playData.playType}\n`;
  if (playData.formation) prompt += `- Formation: ${playData.formation}\n`;
  if (playData.unit) prompt += `- Unit: ${playData.unit}\n`;
  if (playData.situation) prompt += `- Situation: ${playData.situation}\n`;
  prompt += `\n`;

  // Assignment context
  prompt += `# Position Assignments\n`;
  assignments.forEach((assignment) => {
    prompt += `\n**${assignment.position}**:\n`;
    prompt += `- Alignment: ${assignment.alignment}\n`;
    prompt += `- Assignment: ${assignment.assignment}\n`;
    prompt += `- Key Read: ${assignment.key_read}\n`;
    if (assignment.category) prompt += `- Category: ${assignment.category}\n`;
  });
  prompt += `\n`;

  // Generation requirements
  prompt += `# Question Requirements\n\n`;
  prompt += `Generate ${questionCount} questions with the following distribution:\n`;
  Object.entries(difficultyDistribution).forEach(([level, count]) => {
    prompt += `- ${count} ${level} level questions\n`;
  });
  prompt += `\n`;

  prompt += `Question types to include: ${questionTypes.join(', ')}\n`;
  if (focusTopics && focusTopics.length > 0) {
    prompt += `Focus on these topics: ${focusTopics.join(', ')}\n`;
  }
  prompt += `\n`;

  prompt += `Generate questions for these positions: ${positions.join(', ')}\n`;
  if (positions.includes('all')) {
    prompt += `(Include some "all positions" questions that test overall play understanding)\n`;
  }
  prompt += `\n`;

  // Best practices
  prompt += `# Important Guidelines\n\n`;
  prompt += `1. **Variety**: Mix question types and topics for comprehensive coverage\n`;
  prompt += `2. **Progression**: Start with basic recall, build to application and analysis\n`;
  prompt += `3. **Realism**: Use realistic game situations in scenario questions\n`;
  prompt += `4. **Distractors**: For multiple choice, create plausible wrong answers that test common misconceptions\n`;
  prompt += `5. **Explanations**: Provide clear explanations that teach, don't just confirm correctness\n`;
  prompt += `6. **Position-Specific**: Tailor questions to what each position needs to know\n`;
  prompt += `7. **Practical**: Focus on game-applicable knowledge that helps players execute\n\n`;

  prompt += `Return only valid JSON in the specified format. No markdown, no additional text.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE-SPECIFIC QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function buildCoverageQuestionPrompt(params: {
  coverageData: {
    name: string;
    coverageType: string;
    coverageFamily: string;
    front?: string;
    description?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
  assignments: Array<{
    position: string;
    alignment: string;
    assignment: string;
    read: string;
  }>;
  questionCount?: number;
}): string {
  const { coverageData, assignments, questionCount = 8 } = params;

  let prompt = `Generate ${questionCount} quiz questions for the following defensive coverage:\n\n`;

  // Coverage context
  prompt += `# Coverage Information\n`;
  prompt += `- Name: ${coverageData.name}\n`;
  prompt += `- Type: ${coverageData.coverageType}\n`;
  prompt += `- Family: ${coverageData.coverageFamily}\n`;
  if (coverageData.front) prompt += `- Front: ${coverageData.front}\n`;
  if (coverageData.description) prompt += `- Description: ${coverageData.description}\n`;
  prompt += `\n`;

  if (coverageData.strengths && coverageData.strengths.length > 0) {
    prompt += `## Strengths\n`;
    coverageData.strengths.forEach((strength) => {
      prompt += `- ${strength}\n`;
    });
    prompt += `\n`;
  }

  if (coverageData.weaknesses && coverageData.weaknesses.length > 0) {
    prompt += `## Weaknesses\n`;
    coverageData.weaknesses.forEach((weakness) => {
      prompt += `- ${weakness}\n`;
    });
    prompt += `\n`;
  }

  // Defensive assignments
  prompt += `# Defensive Assignments\n`;
  assignments.forEach((assignment) => {
    prompt += `\n**${assignment.position}**:\n`;
    prompt += `- Alignment: ${assignment.alignment}\n`;
    prompt += `- Assignment: ${assignment.assignment}\n`;
    prompt += `- Read: ${assignment.read}\n`;
  });
  prompt += `\n`;

  // Coverage-specific requirements
  prompt += `# Question Focus Areas\n\n`;
  prompt += `For defensive coverage questions, emphasize:\n`;
  prompt += `1. Coverage recognition from offensive perspective\n`;
  prompt += `2. Route adjustments vs this coverage\n`;
  prompt += `3. Where the coverage is vulnerable\n`;
  prompt += `4. Which concepts work best against it\n`;
  prompt += `5. Pre-snap keys that identify this coverage\n`;
  prompt += `6. How offenses typically attack this coverage\n\n`;

  prompt += `Mix difficulty levels: ${Math.ceil(questionCount * 0.3)} beginner, ${Math.ceil(questionCount * 0.5)} intermediate, ${Math.floor(questionCount * 0.2)} advanced\n\n`;

  prompt += `Return only valid JSON in the specified format.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// SITUATIONAL QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function buildSituationalQuestionPrompt(params: {
  situation: string; // "red_zone", "third_down", "two_minute", etc.
  plays: Array<{
    name: string;
    concept: string;
    playType: string;
  }>;
  questionCount?: number;
}): string {
  const { situation, plays, questionCount = 5 } = params;

  let prompt = `Generate ${questionCount} situational football questions focused on ${situation.replace('_', ' ')} situations.\n\n`;

  prompt += `# Available Plays\n`;
  plays.forEach((play) => {
    prompt += `- ${play.name} (${play.concept}, ${play.playType})\n`;
  });
  prompt += `\n`;

  prompt += `# Question Focus\n\n`;
  prompt += `Create scenario-based questions that test:\n`;
  prompt += `1. Play selection for this situation\n`;
  prompt += `2. Execution adjustments needed\n`;
  prompt += `3. Keys and reads specific to this situation\n`;
  prompt += `4. Common mistakes in this situation\n`;
  prompt += `5. Coaching points for situational success\n\n`;

  prompt += `Make questions realistic - use actual down/distance/field position combinations.\n`;
  prompt += `Focus on decision-making and football IQ, not just memorization.\n\n`;

  prompt += `Return only valid JSON in the specified format.`;

  return prompt;
}
