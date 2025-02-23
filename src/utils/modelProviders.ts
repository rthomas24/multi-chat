interface ModelResponse {
  content: string;
  error?: string;
}

interface ModelRequest {
  prompt: string;
  model: string;
}

// Helper to get API key
const getApiKey = (provider: string): string | null => {
  return localStorage.getItem(`${provider.toLowerCase()}_api_key`);
};

const API_URLS = {
  'OpenAI': process.env.NEXT_PUBLIC_OPENAI_API_URL,
  'Anthropic': process.env.NEXT_PUBLIC_ANTHROPIC_API_URL,
  'Google': process.env.NEXT_PUBLIC_GOOGLE_API_URL
} as const;

// OpenAI API handler
export const callOpenAI = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) return { content: '', error: 'No API key found' };

  try {
    // Placeholder for OpenAI API call
    // TODO: Implement actual API call
    return { content: 'OpenAI response placeholder' };
  } catch (error) {
    return { content: '', error: 'Failed to call OpenAI API' };
  }
};

// Anthropic API handler
export const callAnthropic = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) return { content: '', error: 'No API key found' };

  try {
    // Placeholder for Anthropic API call
    // TODO: Implement actual API call
    return { content: 'Anthropic response placeholder' };
  } catch (error) {
    return { content: '', error: 'Failed to call Anthropic API' };
  }
};

// Google API handler
export const callGoogle = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('google');
  if (!apiKey) return { content: '', error: 'No API key found' };

  try {
    // Placeholder for Google API call
    // TODO: Implement actual API call
    return { content: 'Google response placeholder' };
  } catch (error) {
    return { content: '', error: 'Failed to call Google API' };
  }
};

// Main function to route to correct provider
export const callModel = async (provider: string, request: ModelRequest): Promise<ModelResponse> => {
  const apiUrl = API_URLS[provider as keyof typeof API_URLS];
  if (!apiUrl) {
    return { content: '', error: 'Unsupported provider' };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    return await response.json();
  } catch (error) {
    return { content: '', error: `Failed to call ${provider} API` };
  }
}; 