// Content-type specific question templates for assignment flashcards
export const FLASHCARD_QUESTION_TEMPLATES: Record<string, {
  alignment?: (position: string) => string;
  assignment?: (position: string) => string;
  key_read?: (position: string) => string;
}> = {
  play: {
    alignment: (pos) => `Where do you line up as the ${pos}?`,
    assignment: (pos) => `What is your assignment as the ${pos}?`,
    key_read: (pos) => `What is your key read as the ${pos}?`,
  },
  coverage: {
    alignment: (pos) => `What is your alignment as the ${pos} in this coverage?`,
    assignment: (pos) => `What is your coverage responsibility as the ${pos}?`,
    key_read: (pos) => `What are you reading as the ${pos} in this coverage?`,
  },
  formation: {
    alignment: (pos) => `Where should you align as the ${pos} in this formation?`,
    assignment: (pos) => `What is your base assignment as the ${pos} in this formation?`,
    key_read: (pos) => `What should you be reading as the ${pos} from this formation?`,
  },
  legend: {
    alignment: (pos) => `According to the legend, where does the ${pos} align?`,
    assignment: (pos) => `What does the symbol indicate for the ${pos}'s assignment?`,
    key_read: (pos) => `What should the ${pos} key on based on the diagram notation?`,
  },
  index: {
    alignment: (pos) => `In this play package, where does the ${pos} typically align?`,
    assignment: (pos) => `What is the ${pos}'s role in this play concept?`,
    key_read: (pos) => `What is the ${pos}''s primary read in this play family?`,
  },
  reference: {
    alignment: (pos) => `Based on the reference material, where should the ${pos} align?`,
    assignment: (pos) => `What does this reference show as the ${pos}'s responsibility?`,
    key_read: (pos) => `What key is emphasized for the ${pos} in this material?`,
  },
  other: {
    alignment: (pos) => `Where do you line up as the ${pos}?`,
    assignment: (pos) => `What is your assignment as the ${pos}?`,
    key_read: (pos) => `What is your key read as the ${pos}?`,
  },
};

export async function generateAssignmentFlashcards(
  playAnalysis: any,
  assignments: any[],
  playId: string,
  metadata: any,
  shuffleArray: <T>(array: T[]) => T[]
): Promise<any[]> {
  const flashcards: any[] = [];

  const contentType = (metadata?.content_type as string) || 'play';
  const templates = FLASHCARD_QUESTION_TEMPLATES[contentType] || FLASHCARD_QUESTION_TEMPLATES.other;

  console.log(`[Flashcards] Generating assignment flashcards for content type: ${contentType}`);

  const positionData = assignments.reduce((acc: any, assignment: any) => {
    if (!acc[assignment.position]) {
      acc[assignment.position] = assignment;
    }
    return acc;
  }, {});

  for (const [position, data] of Object.entries(positionData) as [string, any][]) {
    const otherPositions = Object.entries(positionData).filter(([pos]) => pos !== position);

    if (templates.alignment) {
      const alignmentOptions = [
        data.alignment,
        ...otherPositions.slice(0, 3).map(([_, d]: [string, any]) => d.alignment),
      ].filter((v, i, a) => v && a.indexOf(v) === i);

      if (alignmentOptions.length >= 2) {
        flashcards.push({
          play_id: playId,
          assignment_id: data.id,
          position: position,
          card_type: 'assignment',
          category: 'alignment',
          question_prompt: templates.alignment(position),
          correct_answer: data.alignment,
          hints: shuffleArray(alignmentOptions),
          difficulty: 'beginner',
          is_auto_generated: true,
          is_active: true,
        });
      }
    }

    if (templates.assignment) {
      const assignmentOptions = [
        data.assignment,
        ...otherPositions.slice(0, 3).map(([_, d]: [string, any]) => d.assignment),
      ].filter((v, i, a) => v && a.indexOf(v) === i);

      if (assignmentOptions.length >= 2) {
        flashcards.push({
          play_id: playId,
          assignment_id: data.id,
          position: position,
          card_type: 'assignment',
          category: 'assignment',
          question_prompt: templates.assignment(position),
          correct_answer: data.assignment,
          hints: shuffleArray(assignmentOptions),
          difficulty: 'intermediate',
          is_auto_generated: true,
          is_active: true,
        });
      }
    }

    if (templates.key_read) {
      const readOptions = [
        data.key_read,
        ...otherPositions.slice(0, 3).map(([_, d]: [string, any]) => d.key_read),
      ].filter((v, i, a) => v && a.indexOf(v) === i);

      if (readOptions.length >= 2) {
        flashcards.push({
          play_id: playId,
          assignment_id: data.id,
          position: position,
          card_type: 'assignment',
          category: 'read',
          question_prompt: templates.key_read(position),
          correct_answer: data.key_read,
          hints: shuffleArray(readOptions),
          difficulty: 'intermediate',
          is_auto_generated: true,
          is_active: true,
        });
      }
    }
  }

  console.log(`[Flashcards] Generated ${flashcards.length} assignment flashcards`);
  return flashcards;
}
