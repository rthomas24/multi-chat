import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

export async function POST(req: Request) {
  let data;
  try {
    data = await req.json();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request format',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const { messages, model } = data;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid or empty messages array' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }
  
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Anthropic API key not found in request' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    // Log request without exposing API key
    console.log('Processing Anthropic request');
    
    const anthropic = createAnthropic({ apiKey });
    const result = streamText({
      model: anthropic(model || 'claude-3-5-sonnet-20240620'),
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant. You aim to provide accurate, relevant, and well-reasoned responses while being direct and concise. You will maintain a professional and friendly tone throughout our conversation.',
        },
        ...messages,
      ],
      onError: ({ error }) => {
        // Server-side logging: Log errors from onError callback
        console.error('[Anthropic API] Error in streamText onError:', error);
      },
    });
    return result.toTextStreamResponse();
  } catch (error) {
    
    return new Response(
      JSON.stringify({
        error: 'Failed to call Anthropic API',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}