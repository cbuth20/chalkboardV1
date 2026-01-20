/**
 * Content Generation Prompts
 *
 * Dynamic prompts for generating insights and knowledge cards based on content type.
 * This allows different types of football content to have tailored AI-generated content.
 */

export type ContentType = 'play' | 'coverage' | 'formation' | 'legend' | 'index' | 'coaching_points' | 'technique' | 'terminology' | 'reference' | 'other';

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHTS GENERATION PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

export interface InsightsPromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
}

export const INSIGHTS_PROMPTS: Record<ContentType, InsightsPromptConfig> = {
  // ─────────────────────────────────────────────────────────────────────────
  // PLAY - Offensive/Defensive Plays
  // ─────────────────────────────────────────────────────────────────────────
  play: {
    systemPrompt: 'You are an expert football coach providing concise, actionable play analysis for offensive and defensive plays.',
    userPromptTemplate: `You are a professional football coach analyzing play metadata. Based on the following play information, provide quick coaching insights in a concise, actionable format.

{{CONTEXT}}

Provide insights in the following format:
- Play Type: [Brief description of what this play is]
- Common Uses: [When and why this play is used]
- Best Against: [What defensive/offensive schemes this works well against]
- Key Coaching Points: [2-3 critical execution points]
- Position Focus: [Key responsibilities for relevant positions]
- Tempo/Situation: [Best game situations for this play]

Keep each section brief (1-2 sentences max). Be specific and actionable.`,
    maxTokens: 500,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COVERAGE - Defensive Coverage Schemes
  // ─────────────────────────────────────────────────────────────────────────
  coverage: {
    systemPrompt: 'You are an expert defensive coordinator providing analysis of coverage schemes and defensive concepts.',
    userPromptTemplate: `You are a professional defensive coordinator analyzing a coverage scheme. Based on the following information, provide coaching insights for teaching this coverage.

{{CONTEXT}}

Provide insights in the following format:
- Coverage Type: [Brief description of the coverage (man, zone, match, etc.)]
- Coverage Family: [What family it belongs to (Cover 2, Cover 3, etc.)]
- Primary Strength: [What offensive concepts this coverage defends well]
- Primary Weakness: [What offensive concepts can exploit this coverage]
- Key Coaching Points: [2-3 critical execution points for defenders]
- Pre-Snap Keys: [What to look for before the snap]
- Adjustment Triggers: [When and how to adjust the coverage]

Keep each section brief (1-2 sentences max). Focus on defensive execution and teaching points.`,
    maxTokens: 550,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORMATION - Formation Reference Sheets
  // ─────────────────────────────────────────────────────────────────────────
  formation: {
    systemPrompt: 'You are an expert football coach providing analysis of offensive and defensive formations.',
    userPromptTemplate: `You are a professional football coach analyzing a formation. Based on the following information, provide insights about this formation and how to use it.

{{CONTEXT}}

Provide insights in the following format:
- Formation Type: [Brief description of the formation structure]
- Personnel: [Typical personnel groupings used with this formation]
- Alignment Keys: [Key alignment points and spacing]
- Strategic Advantages: [What this formation does well]
- Common Play Concepts: [2-3 play types that work well from this formation]
- Teaching Points: [2-3 critical points for teaching proper alignment]
- Variations: [Common variations or adjustments]

Keep each section brief (1-2 sentences max). Focus on formation structure and usage.`,
    maxTokens: 550,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LEGEND - Symbol/Notation Legends
  // ─────────────────────────────────────────────────────────────────────────
  legend: {
    systemPrompt: 'You are an expert football coach helping players understand playbook symbols and notation.',
    userPromptTemplate: `You are a professional football coach explaining playbook symbols and notation. Based on the following legend information, provide helpful context.

{{CONTEXT}}

Provide insights in the following format:
- Purpose: [What this legend/notation system is used for]
- Key Symbols: [3-5 most important symbols and their meanings]
- Usage Context: [When players need to reference this]
- Study Tips: [How players should learn and memorize these symbols]
- Common Mistakes: [Typical misunderstandings to avoid]

Keep each section brief and focused on helping players understand and use the notation system.`,
    maxTokens: 450,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INDEX - Play Index/Menu Sheets
  // ─────────────────────────────────────────────────────────────────────────
  index: {
    systemPrompt: 'You are an expert football coach helping players navigate and understand play organization.',
    userPromptTemplate: `You are a professional football coach explaining how plays are organized. Based on the following index information, provide helpful navigation insights.

{{CONTEXT}}

Provide insights in the following format:
- Organization System: [How plays are categorized and organized]
- Quick Reference: [How to quickly find plays by situation]
- Naming Convention: [How play names are structured]
- Study Approach: [Best way to learn and memorize the play structure]
- Key Categories: [Most important play groupings to know]

Keep each section brief and focused on helping players navigate the playbook efficiently.`,
    maxTokens: 450,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COACHING POINTS - Coaching Point Reference
  // ─────────────────────────────────────────────────────────────────────────
  coaching_points: {
    systemPrompt: 'You are an expert football coach providing detailed coaching point analysis.',
    userPromptTemplate: `You are a professional football coach analyzing coaching points. Based on the following information, provide insights for teaching and executing these concepts.

{{CONTEXT}}

Provide insights in the following format:
- Core Principle: [The main teaching point or concept]
- Why It Matters: [Impact on execution and success]
- Teaching Progression: [How to build mastery of this concept]
- Common Errors: [What players typically do wrong]
- Correction Strategy: [How to fix and reinforce proper technique]
- Application: [When and where this applies in games]

Keep each section brief and actionable for coaches and players.`,
    maxTokens: 500,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TECHNIQUE - Technique Instruction
  // ─────────────────────────────────────────────────────────────────────────
  technique: {
    systemPrompt: 'You are an expert football position coach providing detailed technique instruction.',
    userPromptTemplate: `You are a professional position coach analyzing technique. Based on the following information, provide detailed teaching insights.

{{CONTEXT}}

Provide insights in the following format:
- Technique Name: [What technique is being taught]
- Key Steps: [3-4 critical steps in proper execution]
- Body Mechanics: [Proper stance, footwork, hand placement, etc.]
- Common Mistakes: [What players typically do wrong]
- Drills: [How to practice and develop this technique]
- Game Application: [When this technique is used in games]

Keep each section brief but comprehensive enough for teaching.`,
    maxTokens: 550,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TERMINOLOGY - Football Terminology Definitions
  // ─────────────────────────────────────────────────────────────────────────
  terminology: {
    systemPrompt: 'You are an expert football coach explaining terminology and football language.',
    userPromptTemplate: `You are a professional football coach explaining terminology. Based on the following information, provide clear definitions and usage context.

{{CONTEXT}}

Provide insights in the following format:
- Term Definition: [Clear, simple definition of the term]
- Context: [When and how this term is used]
- Related Terms: [Other terminology that connects to this]
- Usage Examples: [2-3 examples of proper usage]
- Why It Matters: [Why understanding this term is important]

Keep each section brief and focused on building football vocabulary.`,
    maxTokens: 450,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REFERENCE - General Reference Material
  // ─────────────────────────────────────────────────────────────────────────
  reference: {
    systemPrompt: 'You are an expert football coach providing analysis of reference material.',
    userPromptTemplate: `You are a professional football coach analyzing reference material. Based on the following information, provide helpful study insights.

{{CONTEXT}}

Provide insights in the following format:
- Content Purpose: [What this reference material is for]
- Key Takeaways: [3-4 most important points to understand]
- Study Priority: [What to focus on first]
- Application: [How to use this information]
- Connection to Game: [How this relates to on-field performance]

Keep each section brief and focused on practical application.`,
    maxTokens: 450,
    temperature: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OTHER - Default/Uncategorized Content
  // ─────────────────────────────────────────────────────────────────────────
  other: {
    systemPrompt: 'You are an expert football coach providing general analysis.',
    userPromptTemplate: `You are a professional football coach analyzing this content. Based on the following information, provide helpful insights.

{{CONTEXT}}

Provide insights in the following format:
- Content Type: [Brief description of what this is]
- Key Information: [3-4 most important points]
- Study Approach: [How to learn this material]
- Practical Application: [How to use this information]

Keep each section brief and actionable.`,
    maxTokens: 400,
    temperature: 0.7,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE CARDS GENERATION PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

export interface KnowledgeCardsPromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
  cardCount: number;
}

export const KNOWLEDGE_CARDS_PROMPTS: Record<ContentType, KnowledgeCardsPromptConfig> = {
  // ─────────────────────────────────────────────────────────────────────────
  // PLAY - Offensive/Defensive Plays
  // ─────────────────────────────────────────────────────────────────────────
  play: {
    systemPrompt: 'You are a football coach creating quiz cards to test play knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this football play, generate 4-5 general knowledge quiz cards that test understanding of the play.

Play Information:
- Name: {{NAME}}
- Formation: {{FORMATION}}
- Concept: {{CONCEPT}}
- Play Type: {{PLAY_TYPE}}
- Description: {{DESCRIPTION}}

Generate flashcards that test:
1. When to use this play (situational understanding)
2. What coverage/front it works best against
3. Key execution points
4. Formation identification
5. Concept understanding

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "play_concept" | "formation_key" | "coverage_read" | "execution_key" | "situational"
  }
]`,
    maxTokens: 800,
    temperature: 0.7,
    cardCount: 5,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COVERAGE - Defensive Coverage Schemes
  // ─────────────────────────────────────────────────────────────────────────
  coverage: {
    systemPrompt: 'You are a defensive coordinator creating quiz cards to test coverage knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this defensive coverage, generate 4-5 quiz cards that test understanding of the coverage scheme.

Coverage Information:
- Name: {{NAME}}
- Type: {{COVERAGE_TYPE}}
- Family: {{COVERAGE_FAMILY}}
- Front: {{FRONT}}
- Description: {{DESCRIPTION}}

Generate flashcards that test:
1. Coverage identification and recognition
2. Defender responsibilities by alignment
3. Adjustment rules (vs trips, 2x2, empty, motion)
4. Strengths and weaknesses
5. Pre-snap keys and post-snap reads

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "coverage_recognition" | "defender_responsibility" | "adjustment_rule" | "strength_weakness" | "keys_reads"
  }
]`,
    maxTokens: 850,
    temperature: 0.7,
    cardCount: 5,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORMATION - Formation Reference Sheets
  // ─────────────────────────────────────────────────────────────────────────
  formation: {
    systemPrompt: 'You are a football coach creating quiz cards to test formation knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this formation, generate 3-4 quiz cards that test understanding of the formation.

Formation Information:
- Name: {{NAME}}
- Personnel: {{PERSONNEL}}
- Alignment: {{ALIGNMENT}}
- Key Features: {{KEY_FEATURES}}
- Common Plays: {{COMMON_PLAYS}}

Generate flashcards that test:
1. Formation identification and naming
2. Personnel groupings
3. Alignment and spacing
4. Compatible play concepts

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "formation_identification" | "personnel" | "alignment" | "play_compatibility"
  }
]`,
    maxTokens: 700,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LEGEND - Symbol/Notation Legends
  // ─────────────────────────────────────────────────────────────────────────
  legend: {
    systemPrompt: 'You are a football coach creating quiz cards to test playbook symbol knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this legend/notation system, generate 3-4 quiz cards that test symbol recognition and usage.

Legend Information:
{{CONTEXT}}

Generate flashcards that test:
1. Symbol recognition and meaning
2. Proper usage context
3. Distinguishing between similar symbols
4. Application in play diagrams

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "symbol_recognition" | "symbol_meaning" | "usage_context" | "diagram_reading"
  }
]`,
    maxTokens: 650,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INDEX - Play Index/Menu Sheets
  // ─────────────────────────────────────────────────────────────────────────
  index: {
    systemPrompt: 'You are a football coach creating quiz cards to test playbook organization knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this play index, generate 3-4 quiz cards that test understanding of play organization.

Index Information:
{{CONTEXT}}

Generate flashcards that test:
1. Play categorization and grouping
2. Naming conventions
3. Navigating to find plays by situation
4. Understanding the organizational system

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "play_organization" | "naming_convention" | "navigation" | "categorization"
  }
]`,
    maxTokens: 650,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COACHING POINTS - Coaching Point Reference
  // ─────────────────────────────────────────────────────────────────────────
  coaching_points: {
    systemPrompt: 'You are a football coach creating quiz cards to test coaching point knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on these coaching points, generate 3-4 quiz cards that test understanding.

Coaching Points Information:
{{CONTEXT}}

Generate flashcards that test:
1. Understanding the core teaching points
2. Why these points matter for execution
3. How to apply these points
4. Common mistakes related to these points

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "teaching_point" | "application" | "common_mistake" | "execution"
  }
]`,
    maxTokens: 700,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TECHNIQUE - Technique Instruction
  // ─────────────────────────────────────────────────────────────────────────
  technique: {
    systemPrompt: 'You are a position coach creating quiz cards to test technique knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this technique instruction, generate 3-4 quiz cards that test understanding of proper technique.

Technique Information:
{{CONTEXT}}

Generate flashcards that test:
1. Proper execution steps
2. Body mechanics and fundamentals
3. Common errors to avoid
4. When to apply the technique

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "execution_steps" | "body_mechanics" | "common_errors" | "application"
  }
]`,
    maxTokens: 700,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TERMINOLOGY - Football Terminology Definitions
  // ─────────────────────────────────────────────────────────────────────────
  terminology: {
    systemPrompt: 'You are a football coach creating quiz cards to test terminology knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this terminology, generate 3-4 quiz cards that test vocabulary understanding.

Terminology Information:
{{CONTEXT}}

Generate flashcards that test:
1. Term definitions
2. Proper usage context
3. Related terminology
4. Application examples

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "definition" | "usage_context" | "related_terms" | "application"
  }
]`,
    maxTokens: 650,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REFERENCE - General Reference Material
  // ─────────────────────────────────────────────────────────────────────────
  reference: {
    systemPrompt: 'You are a football coach creating quiz cards to test reference material knowledge. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this reference material, generate 3-4 quiz cards that test understanding.

Reference Information:
{{CONTEXT}}

Generate flashcards that test:
1. Key concepts
2. Practical application
3. Understanding importance
4. Usage in games

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "key_concept" | "application" | "importance" | "game_usage"
  }
]`,
    maxTokens: 650,
    temperature: 0.7,
    cardCount: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OTHER - Default/Uncategorized Content
  // ─────────────────────────────────────────────────────────────────────────
  other: {
    systemPrompt: 'You are a football coach creating quiz cards. Return only valid JSON arrays, no markdown or extra text.',
    userPromptTemplate: `Based on this content, generate 3-4 quiz cards that test understanding.

Content Information:
{{CONTEXT}}

Generate flashcards that test key concepts and understanding.

Return ONLY a JSON array with this structure (no markdown, no extra text):
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "category": "general_knowledge"
  }
]`,
    maxTokens: 600,
    temperature: 0.7,
    cardCount: 4,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get insights prompt configuration for a specific content type
 */
export function getInsightsPrompt(contentType: ContentType): InsightsPromptConfig {
  return INSIGHTS_PROMPTS[contentType] || INSIGHTS_PROMPTS.other;
}

/**
 * Get knowledge cards prompt configuration for a specific content type
 */
export function getKnowledgeCardsPrompt(contentType: ContentType): KnowledgeCardsPromptConfig {
  return KNOWLEDGE_CARDS_PROMPTS[contentType] || KNOWLEDGE_CARDS_PROMPTS.other;
}

/**
 * Build context string from metadata for insights generation
 */
export function buildInsightsContext(metadata: any, playAnalysis: any): string {
  const context = [
    metadata.formation_name && `Formation: ${metadata.formation_name}`,
    metadata.concept_name && `Concept: ${metadata.concept_name}`,
    playAnalysis.name && `Play: ${playAnalysis.name}`,
    metadata.side_of_ball && `Side of Ball: ${metadata.side_of_ball}`,
    metadata.content_type && `Content Type: ${metadata.content_type}`,
    metadata.level && `Level: ${metadata.level}`,
    metadata.position_relevance && `Relevant Positions: ${metadata.position_relevance.join(', ')}`,
    metadata.custom_notes && `Notes: ${metadata.custom_notes}`,
    playAnalysis.description && `Description: ${playAnalysis.description}`,
    playAnalysis.keyPoints && `Key Points: ${playAnalysis.keyPoints.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  return context;
}

/**
 * Replace template variables in prompt
 */
export function fillPromptTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || 'N/A');
  }
  return result;
}
