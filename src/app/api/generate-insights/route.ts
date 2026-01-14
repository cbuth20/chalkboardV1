import { NextRequest, NextResponse } from 'next/server';

// POST - Generate AI insights from play metadata
export async function POST(request: NextRequest) {
  try {
    const { metadata } = await request.json();

    if (!metadata) {
      return NextResponse.json(
        { error: 'metadata is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: 'Failed to generate insights',
          message: errorData.error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
