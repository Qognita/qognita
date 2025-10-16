import OpenAI from 'openai';

// Lazy initialization - only throw error when actually used, not at import time
let _openai: OpenAI | null = null;
let _morpheus: OpenAI | null = null;

export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!_openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
      }
      _openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return (_openai as any)[prop];
  },
});

// Morpheus API client (OpenAI-compatible)
export const morpheus = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!_morpheus) {
      _morpheus = new OpenAI({
        apiKey: process.env.MORPHEUS_API_KEY || 'dummy',
        baseURL: process.env.MORPHEUS_API_URL || 'https://api.mor.org/api/v1',
      });
    }
    return (_morpheus as any)[prop];
  },
});

export default openai;
