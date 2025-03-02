import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
      JSON.stringify({ error: 'OpenAI API key not found in request' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    console.log('OpenAI API Key:', apiKey ? 'Key exists' : 'No key found');
    const openai = createOpenAI({ apiKey, compatibility: 'strict' });
    
    const result = streamText({
      model: openai(model || 'gpt-4o'),
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
    console.error('Error calling OpenAI API:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to call OpenAI API',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 