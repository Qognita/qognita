// scripts/get-vector.ts
import 'dotenv/config';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getQueryVector(query: string) {
    console.log(`Generating embedding for: "${query}"`);
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const vector = response.data[0].embedding;
    console.log("\nCOPY THE VECTOR BELOW:\n");
    console.log(JSON.stringify(vector));
}

// Enter your test query here
getQueryVector("What is a Program Derived Address?");