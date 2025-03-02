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
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Google API key not found in request' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    console.log('Google API Key:', apiKey ? 'Key exists' : 'No key found');
    
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
      ]
    });

    return new Response(result.textStream);
  } catch (error) {
    console.error('Error calling Google API:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to call Google API',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 