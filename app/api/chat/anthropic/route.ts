import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
  console.log('Anthropic API route called');
  
  // Log headers for debugging
  console.log('Request headers:', Object.fromEntries([...req.headers.entries()]));
  
  try {
    const { messages, model } = await req.json();
    console.log('Request body parsed successfully:', { modelRequested: model, messageCount: messages.length });
    console.log('Messages received:', JSON.stringify(messages));

    // Get API key from request header instead of environment variable
    const apiKey = req.headers.get('X-API-Key');
    console.log('API Key from header:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      console.error('No API key found in request headers');
      return new Response(
        JSON.stringify({
          error: 'Anthropic API key not found in request'
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    try {
      console.log('Initializing Anthropic with provided API key');
      const anthropic = createAnthropic({ apiKey });
      console.log('Anthropic initialized, creating stream');
      
      // Use streaming response instead of test response
      const result = streamText({
        model: anthropic(model || 'claude-3-5-sonnet-20240620'),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. You aim to provide accurate, relevant, and well-reasoned responses while being direct and concise. You will maintain a professional and friendly tone throughout our conversation.',
          },
          ...messages
        ]
      });

      console.log('Stream created, returning response');
      
      // For debugging, let's return a simple response first to verify connectivity
      // Comment this out after confirming the route works
      /*
      return new Response(
        JSON.stringify({
          content: "This is a test response to check if the API route is working."
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
      */
      
      // Return the streaming response
      return new Response(result.textStream);
    } catch (error) {
      console.error('Anthropic API Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to call Anthropic API',
          details: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }
  } catch (parseError) {
    console.error('Error parsing request:', parseError);
    return new Response(
      JSON.stringify({
        error: 'Invalid request format',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }
} 