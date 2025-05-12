import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

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
      JSON.stringify({ error: 'Google API key not found in request' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    // Remove API key logging, just log that a request was received
    console.log('Processing Google AI request');
    
    // Set API key in process.env for the google SDK to use
    process.env.GOOGLE_API_KEY = apiKey;
    
    const result = streamText({
      model: google(model || 'gemini-pro'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. You aim to provide accurate, relevant, and well-reasoned responses while being direct and concise. You will maintain a professional and friendly tone throughout our conversation.',
        },
        ...messages
      ],
      onError: ({ error }) => {
        // Server-side logging: Log errors from onError callback
        console.error('[Google API] Error in streamText onError:', error);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    // Improve error logging without exposing sensitive information
    console.error('Error calling Google API:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        error: 'Failed to call Google API',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 