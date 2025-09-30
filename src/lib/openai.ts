import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Morpheus API client (OpenAI-compatible)
export const morpheus = new OpenAI({
    apiKey: process.env.MORPHEUS_API_KEY || 'dummy',
    baseURL: process.env.MORPHEUS_API_URL || 'https://api.mor.org/api/v1',
})

export default openai
