interface ModelResponse {
  content: string;
  error?: string;
}

interface ModelRequest {
  prompt: string;
  model: string;
  webSearch?: boolean;
}

// Helper to get API key
const getApiKey = (provider: string): string | null => {
  return localStorage.getItem(`${provider.toLowerCase()}_api_key`);
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// OpenAI API handler
export const callOpenAI = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('OpenAI API Key:', apiKey);
  try {
    const response = await callModel('OpenAI', { prompt, model });
    console.log('OpenAI Response:', response);
    return response;
  } catch (error) {
    console.error('OpenAI Error:', error);
    return { content: '', error: 'Failed to call OpenAI API' };
  }
};

// Anthropic API handler
export const callAnthropic = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('Anthropic API Key:', apiKey);
  try {
    const response = await callModel('Anthropic', { prompt, model });
    console.log('Anthropic Response:', response);
    return response;
  } catch (error) {
    console.error('Anthropic Error:', error);
    return { content: '', error: 'Failed to call Anthropic API' };
  }
};

// Google API handler
export const callGoogle = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('google');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('Google API Key:', apiKey);
  try {
    const response = await callModel('Google', { prompt, model });
    console.log('Google Response:', response);
    return response;
  } catch (error) {
    console.error('Google Error:', error);
    return { content: '', error: 'Failed to call Google API' };
  }
};

// xAI API handler
export const callXAI = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('xai');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('xAI API Key:', apiKey);
  try {
    const response = await callModel('xAI', { prompt, model });
    console.log('xAI Response:', response);
    return response;
  } catch (error) {
    console.error('xAI Error:', error);
    return { content: '', error: 'Failed to call xAI API' };
  }
};

// Main function to route to correct provider
export const callModel = async (provider: string, request: ModelRequest): Promise<ModelResponse> => {
  if (!API_URL) {
    return { content: '', error: 'API URL not configured' };
  }

  const apiKey = localStorage.getItem(`${provider.toLowerCase()}_api_key`);
  
  console.log(`Calling ${provider} with API key:`, apiKey ? 'Key exists' : 'No key found');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || '', // This will be used by the cloud function
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model,
        provider: provider,
        webSearch: request.webSearch || false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`${provider} API Error:`, error);
    return { 
      content: '', 
      error: `Failed to call ${provider} API: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}; 