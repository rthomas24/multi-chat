import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

// IMPORTANT! Set the runtime to edge
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
  
  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid or empty messages array' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }
  
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'xAI API key not found in request' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    // Log request without exposing API key
    console.log('Processing xAI request');
    
    const xai = createXai({ apiKey });
    const result = streamText({
      model: xai(model || 'grok-2-1212'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. You aim to provide accurate, relevant, and well-reasoned responses while being direct and concise. You will maintain a professional and friendly tone throughout our conversation.',
        },
        ...messages,
      ],
    });
    return new Response(result.textStream);
  } catch (error) {
    // Improve error logging without exposing sensitive information
    console.error('Error calling xAI API:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        error: 'Failed to call xAI API',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 