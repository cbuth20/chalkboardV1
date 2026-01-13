import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
});

const COACH_SYSTEM_PROMPT = `You are "Chalk Talk", an expert football coach and teacher built into the Chalkboard platform. Your role is to help players learn football concepts, understand plays, analyze coverage, and improve their game IQ.

Key traits:
- Direct, clear, and practical coaching style
- Break down complex concepts into digestible pieces
- Use football terminology appropriately for the skill level
- Encourage players and build confidence
- Reference real game situations when helpful
- Keep responses concise but thorough (2-4 paragraphs max unless asked for more detail)

When players ask questions:
- If they want explanations: teach the concept clearly with examples
- If they mention diagrams/drawing: describe what should be drawn or reference visual learning
- If they want quizzes: provide a question and wait for their answer
- If they need help with coverage: walk through keys and techniques
- If they ask about routes: explain the technique, release, and when to use it

Stay encouraging and focused on improvement. You're here to make them better players.`;

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const {
      message,
      conversationHistory = [],
      mode = 'teach',
      context: userContext
    } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Build the messages array for OpenAI
    const messages: any[] = [
      { role: 'system', content: COACH_SYSTEM_PROMPT }
    ];

    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add the current user message
    messages.push({ role: 'user', content: message });

    // Add context hints if provided
    if (userContext) {
      const contextHint = `[Context: User is in ${userContext.module || 'general'} section, difficulty level: ${userContext.difficultyLevel || 'intermediate'}]`;
      messages.push({ role: 'system', content: contextHint });
    }

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const assistantMessage = response.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: assistantMessage,
        mode: mode,
        usage: response.usage,
      }),
    };
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error.message
      }),
    };
  }
};
