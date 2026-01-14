import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { metadata } = JSON.parse(event.body || '{}');

    if (!metadata) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'metadata is required' }),
      };
    }

    // Build context from metadata
    const context = [
      metadata.formation && `Formation: ${metadata.formation}`,
      metadata.concept && `Concept: ${metadata.concept}`,
      metadata.side_of_ball && `Side of Ball: ${metadata.side_of_ball}`,
      metadata.content_type && `Content Type: ${metadata.content_type}`,
      metadata.level && `Level: ${metadata.level}`,
      metadata.position_relevance && `Relevant Positions: ${metadata.position_relevance.join(', ')}`,
      metadata.custom_notes && `Notes: ${metadata.custom_notes}`,
    ].filter(Boolean).join('\n');

    const prompt = `You are a professional football coach analyzing play metadata. Based on the following play information, provide quick coaching insights in a concise, actionable format.

${context}

Provide insights in the following format:
- Play Type: [Brief description of what this play is]
- Common Uses: [When and why this play is used]
- Best Against: [What defensive schemes this works well against]
- Key Coaching Points: [2-3 critical execution points]
- Position Focus: [Key responsibilities for relevant positions]

Keep each section brief (1-2 sentences max). Be specific and actionable.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GPT_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert football coach providing concise, actionable play analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to generate insights',
          message: errorData.error?.message || 'Unknown error',
        }),
      };
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insights }),
    };
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate insights',
        message: error.message,
      }),
    };
  }
};
