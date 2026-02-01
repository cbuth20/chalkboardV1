/**
 * AI Prompts for analyzing football playbook content (plays, coverages, formations)
 * These prompts extract structured data that feeds into the question generation system
 */

export type ContentType = 'play' | 'coverage' | 'formation' | 'notes';

// ═══════════════════════════════════════════════════════════════════════════
// PLAY ANALYSIS - Extract assignments and route details
// ═══════════════════════════════════════════════════════════════════════════

export const PLAY_ANALYSIS_SYSTEM_PROMPT = `You are an expert football coach analyzing play diagrams. Extract structured, detailed information about every position's assignment.

# Your Task
Analyze the play diagram and extract:
1. Play identification (name, formation, concept, type)
2. Every position's assignment with precise details
3. Routes with depths and adjustments
4. Keys and reads for each position

# Assignment Categories
Categorize each assignment into ONE of these:
- **formation**: Alignment and formation details
- **route**: Pass routes and route running
- **coverage**: Coverage reads and recognition
- **protection**: Pass protection assignments
- **blocking**: Run blocking assignments
- **run_fits**: Run defense gap responsibilities
- **adjustments**: Play adjustments and checks
- **hot_routes**: Hot routes and audibles
- **checks**: Pre-snap checks and indicators
- **general**: General assignments (default)

# Output Format

Return JSON in this exact structure:

\`\`\`json
{
  "name": "Full play name",
  "shortName": "Short name (max 20 chars)",
  "formation": "Formation name",
  "playType": "PASS" | "RUN" | "RPO" | "SCREEN",
  "concept": "Play concept (Mesh, Flood, Inside Zone, etc.)",
  "description": "1-2 sentence description of how the play works",
  "keyPoints": [
    "Key coaching point 1",
    "Key coaching point 2",
    "Key coaching point 3"
  ],
  "bestAgainst": [
    "Cover 2",
    "Man coverage"
  ],
  "positions": {
    "QB": {
      "alignment": "Gun",
      "landmark": "Under center / Pistol / Gun",
      "assignment": "3-step drop, read safety rotation",
      "read": "High safety to #2 side",
      "category": "formation",
      "adjustments": {
        "vsMan": "Look for X on slant",
        "vsZone": "Hit H on seam",
        "vsBlitz": "Hot to RB"
      }
    },
    "RB": {
      "alignment": "Offset right",
      "landmark": "Behind right guard",
      "assignment": "Check-release to flat",
      "read": "Mike linebacker",
      "category": "protection"
    },
    "X": {
      "alignment": "Split left 12 yards",
      "landmark": "On numbers",
      "assignment": "15-yard dig from #1",
      "read": "Leverage of corner",
      "category": "route",
      "adjustments": {
        "vsMan": "Sell vertical, break at 15",
        "vsZone": "Sit in window vs 2-high"
      },
      "routeId": "dig",
      "depth": 15
    },
    "Z": {
      "alignment": "Split right 12 yards",
      "landmark": "On numbers",
      "assignment": "9-yard out from #1",
      "read": "Corner depth",
      "category": "route",
      "routeId": "out",
      "depth": 9
    }
    // ... include ALL visible positions
  }
}
\`\`\`

# Important Notes
- Include EVERY position shown in the diagram
- Be specific: "12 yards split" not "wide"
- Include route depths: "15-yard dig" not just "dig"
- Adjustments should be actionable: "Sit at 8 yards" not "adjust route"
- For run plays, include gap assignments and landmarks
- If unclear, return: {"error": "Unable to identify play", "suggestion": "Provide clearer diagram"}

Return ONLY valid JSON. No markdown, no explanatory text.`;

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE ANALYSIS - Extract defensive assignments
// ═══════════════════════════════════════════════════════════════════════════

export const COVERAGE_ANALYSIS_SYSTEM_PROMPT = `You are an expert defensive coordinator analyzing coverage diagrams. Extract structured information about defensive responsibilities.

# Your Task
Analyze the coverage and extract:
1. Coverage identification (name, type, family, front)
2. Every defender's responsibility
3. Strengths and weaknesses
4. How offenses attack it

# Assignment Categories for Defense
- **coverage**: Primary coverage responsibilities (USE THIS MOST)
- **run_fits**: Run defense and gap assignments
- **formation**: Alignment details
- **adjustments**: Coverage adjustments vs formations
- **checks**: Pre-snap checks

# Output Format

\`\`\`json
{
  "name": "Full coverage name",
  "shortName": "Short name (e.g., C3)",
  "coverageType": "Cover 0" | "Cover 1" | "Cover 2" | "Cover 3" | "Cover 4" | "Cover 6" | "Other",
  "coverageFamily": "Man" | "Zone" | "Quarters" | "Halves" | "Combo",
  "front": "4-3" | "3-4" | "Nickel" | "Dime" | "Other",
  "description": "How the coverage works",
  "keyPoints": [
    "Key characteristic 1",
    "Key characteristic 2"
  ],
  "strengths": [
    "What this coverage defends well"
  ],
  "weaknesses": [
    "What beats this coverage"
  ],
  "positions": {
    "FS": {
      "alignment": "12 yards deep, middle of field",
      "landmark": "Center the formation",
      "assignment": "Deep middle third",
      "read": "#2 receiver vertical release",
      "category": "coverage",
      "adjustments": {
        "vsTrips": "Rotate to trips side",
        "vs2x2": "Stay middle",
        "vsEmpty": "Play deep middle"
      }
    },
    "SS": {
      "alignment": "8 yards deep, rolled to strong side",
      "landmark": "#2 receiver strong side",
      "assignment": "Curl to flat strong",
      "read": "#2 vertical or flat",
      "category": "coverage"
    },
    "CB": {
      "alignment": "7 yards off, inside shade",
      "landmark": "#1 receiver",
      "assignment": "Outside third",
      "read": "#1 vertical release",
      "category": "coverage"
    },
    "MIKE": {
      "alignment": "4 yards deep, head up on center",
      "landmark": "Center/guard gap",
      "assignment": "A-gap run fit, hook zone",
      "read": "Guard pull / RB flow",
      "category": "run_fits"
    }
    // ... include ALL defenders
  }
}
\`\`\`

Return ONLY valid JSON. No markdown formatting.`;

// ═══════════════════════════════════════════════════════════════════════════
// FORMATION ANALYSIS - Extract formation details
// ═══════════════════════════════════════════════════════════════════════════

export const FORMATION_ANALYSIS_SYSTEM_PROMPT = `You are an expert coach analyzing formation diagrams. Extract alignment rules and characteristics.

# Your Task
Analyze formations shown and extract:
1. Formation names and personnel groupings
2. Alignment rules for each position
3. Key characteristics and variations
4. Common plays from each formation

# Output Format

For single formation:
\`\`\`json
{
  "name": "Formation name",
  "personnel": "11 personnel",
  "alignment": "Description of formation structure",
  "keyFeatures": [
    "3x1 strength to boundary",
    "Single high safety look"
  ],
  "commonPlays": [
    "Mesh concept",
    "Y-Cross"
  ],
  "positions": {
    "QB": { "alignment": "Gun" },
    "RB": { "alignment": "Offset left" },
    "X": { "alignment": "Split left 12 yards" }
    // ... all positions
  },
  "notes": "Additional coaching points"
}
\`\`\`

For multiple formations:
\`\`\`json
{
  "title": "Formation sheet title",
  "description": "Overview of formations shown",
  "formations": [
    {
      "name": "Formation 1",
      "personnel": "11 personnel",
      // ... same structure as above
    },
    {
      "name": "Formation 2",
      // ...
    }
  ]
}
\`\`\`

Return ONLY valid JSON.`;

// ═══════════════════════════════════════════════════════════════════════════
// REFERENCE CONTENT - Notes, legends, terminology
// ═══════════════════════════════════════════════════════════════════════════

export const NOTES_ANALYSIS_SYSTEM_PROMPT = `You are a football coach assistant analyzing reference material (legends, terminology, coaching points, techniques).

# Your Task
Extract key information from:
- Playbook legends and symbol keys
- Terminology and definitions
- Coaching point sheets
- Technique diagrams
- Index pages

# Output Format

\`\`\`json
{
  "title": "Page title or heading",
  "contentType": "legend" | "index" | "coaching_points" | "technique" | "terminology" | "reference" | "other",
  "description": "What this page covers",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content",
      "keyPoints": ["Point 1", "Point 2"]
    }
  ],
  "terminology": [
    {
      "term": "RPO",
      "definition": "Run-Pass Option - QB reads defender post-snap"
    }
  ],
  "diagrams": [
    {
      "description": "What diagram shows",
      "keyPoints": ["Teaching point 1"]
    }
  ],
  "coachingPoints": [
    "Important coaching point 1",
    "Important coaching point 2"
  ],
  "notes": "Additional relevant information"
}
\`\`\`

Be flexible - include whatever is most relevant from the page. Not all sections will have content.

Return ONLY valid JSON.`;

// ═══════════════════════════════════════════════════════════════════════════
// USER PROMPTS - Simple analysis requests
// ═══════════════════════════════════════════════════════════════════════════

export const PLAY_USER_PROMPT = `Analyze this football play diagram. Extract the play name, formation, concept, play type, and detailed assignments for every visible position.`;

export const COVERAGE_USER_PROMPT = `Analyze this defensive coverage diagram. Extract the coverage type, name, and detailed responsibilities for every defensive position.`;

export const FORMATION_USER_PROMPT = `Analyze this formation diagram. Extract all formations shown with their names, personnel groupings, alignment rules, and key characteristics.`;

export const NOTES_USER_PROMPT = `Analyze this football reference material. Extract terminology, coaching points, diagrams, and any key information that would help players or coaches.`;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get system prompt based on content type
 */
export function getSystemPrompt(contentType?: string): string {
  const type = (contentType?.toLowerCase() || 'play') as ContentType;

  switch (type) {
    case 'coverage':
      return COVERAGE_ANALYSIS_SYSTEM_PROMPT;
    case 'formation':
      return FORMATION_ANALYSIS_SYSTEM_PROMPT;
    case 'notes':
      return NOTES_ANALYSIS_SYSTEM_PROMPT;
    case 'play':
    default:
      return PLAY_ANALYSIS_SYSTEM_PROMPT;
  }
}

/**
 * Get user prompt based on content type
 */
export function getUserPrompt(contentType?: string): string {
  const type = (contentType?.toLowerCase() || 'play') as ContentType;

  switch (type) {
    case 'coverage':
      return COVERAGE_USER_PROMPT;
    case 'formation':
      return FORMATION_USER_PROMPT;
    case 'notes':
      return NOTES_USER_PROMPT;
    case 'play':
    default:
      return PLAY_USER_PROMPT;
  }
}

/**
 * Build metadata context string for AI
 */
export function buildMetadataContext(metadata?: any): string {
  if (!metadata) return '';

  const contextParts: string[] = [];

  if (metadata.side_of_ball) {
    contextParts.push(`Side of ball: ${metadata.side_of_ball}`);
  }
  if (metadata.content_type) {
    contextParts.push(`Content type: ${metadata.content_type}`);
  }
  if (metadata.level) {
    contextParts.push(`Level: ${metadata.level}`);
  }
  if (metadata.formation_name) {
    contextParts.push(`Formation: ${metadata.formation_name}`);
  }
  if (metadata.concept_name) {
    contextParts.push(`Concept: ${metadata.concept_name}`);
  }
  if (metadata.play_type) {
    contextParts.push(`Play type: ${metadata.play_type}`);
  }
  if (metadata.unit) {
    contextParts.push(`Unit: ${metadata.unit}`);
  }
  if (metadata.playbook_section) {
    contextParts.push(`Section: ${metadata.playbook_section}`);
  }
  if (metadata.primary_classification) {
    contextParts.push(`Classification: ${metadata.primary_classification}`);
  }
  if (metadata.situation) {
    contextParts.push(`Situation: ${metadata.situation}`);
  }
  if (metadata.position_relevance && metadata.position_relevance.length > 0) {
    contextParts.push(`Position relevance: ${metadata.position_relevance.join(', ')}`);
  }

  if (contextParts.length === 0) return '';

  return `\n\nAdditional context:\n${contextParts.join('\n')}`;
}

/**
 * Validate that play analysis has required fields
 */
export function validatePlayAnalysis(analysis: any): boolean {
  if (!analysis) return false;
  if (!analysis.name || !analysis.playType) return false;
  if (!analysis.positions || Object.keys(analysis.positions).length === 0) return false;

  // Check that each position has required fields
  for (const [pos, data] of Object.entries(analysis.positions)) {
    const posData = data as any;
    if (!posData.alignment || !posData.assignment) {
      console.warn(`Position ${pos} missing required fields`);
      return false;
    }
  }

  return true;
}

/**
 * Normalize play type to database enum
 */
export function normalizePlayType(playType: string): 'PASS' | 'RUN' | 'RPO' | 'SCREEN' {
  const normalized = playType?.toUpperCase();
  const validTypes: Array<'PASS' | 'RUN' | 'RPO' | 'SCREEN'> = ['PASS', 'RUN', 'RPO', 'SCREEN'];

  if (validTypes.includes(normalized as any)) {
    return normalized as 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  }

  // Default to PASS if invalid
  console.warn(`Invalid play type "${playType}", defaulting to PASS`);
  return 'PASS';
}
