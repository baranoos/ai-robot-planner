import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model to use for text generation
export const DEFAULT_MODEL = 'gpt-4-turbo';

// Default model to use for image generation
export const IMAGE_MODEL = 'gpt-image-1';
