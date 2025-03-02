import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createXai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

interface ModelResponse {
  content: string;
  error?: string;
  stream?: ReadableStream<string>;
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

// OpenAI API handler
export const callOpenAI = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('OpenAI API Key:', apiKey ? 'Key exists' : 'No key found');
  try {
    const openai = createOpenAI({ apiKey, compatibility: 'strict' });
    return callModel(openai, model, prompt);
  } catch (error) {
    console.error('OpenAI Error:', error);
    return { content: '', error: 'Failed to call OpenAI API' };
  }
};

// Anthropic API handler
export const callAnthropic = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('Anthropic API Key:', apiKey ? 'Key exists' : 'No key found');
  try {
    const anthropic = createAnthropic({ apiKey });
    return callModel(anthropic, model, prompt);
  } catch (error) {
    console.error('Anthropic Error:', error);
    return { content: '', error: 'Failed to call Anthropic API' };
  }
};

// Google API handler
export const callGoogle = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('google');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('Google API Key:', apiKey ? 'Key exists' : 'No key found');
  try {
    // Note: google is imported directly, not created with a factory
    return callModel(google, model, prompt);
  } catch (error) {
    console.error('Google Error:', error);
    return { content: '', error: 'Failed to call Google API' };
  }
};

// xAI API handler
export const callXAI = async ({ prompt, model }: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('xai');
  if (!apiKey) return { content: '', error: 'No API key found' };

  console.log('xAI API Key:', apiKey ? 'Key exists' : 'No key found');
  try {
    const xai = createXai({ apiKey });
    return callModel(xai, model, prompt);
  } catch (error) {
    console.error('xAI Error:', error);
    return { content: '', error: 'Failed to call xAI API' };
  }
};

// Unified model calling function
export const callModel = (providerObject: any, modelName: string, prompt: string): ModelResponse => {
  try {
    const result = streamText({
      model: providerObject(modelName),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. You aim to provide accurate, relevant, and well-reasoned responses while being direct and concise. You will maintain a professional and friendly tone throughout our conversation.',
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return { 
      content: '', 
      stream: result.textStream
    };
  } catch (error) {
    console.error(`Streaming Error:`, error);
    return { 
      content: '', 
      error: `Failed to stream: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};