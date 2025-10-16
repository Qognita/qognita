import * as cheerio from 'cheerio';
import { config } from 'dotenv';
import { resolve } from 'path';
import { KnowledgeService } from '../src/services/knowledgeService';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Verify environment variables are loaded
console.log('🔧 Environment check:');
console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log(
  '- Supabase Service Key:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ Missing'
);

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing from environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Documentation sources to scrape
const DOCUMENTATION_SOURCES = [
  {
    name: 'Solana Cookbook',
    baseUrl: 'https://solanacookbook.com',
    paths: [
      '/getting-started/installation.html',
      '/core-concepts/accounts.html',
      '/core-concepts/programs.html',
      '/core-concepts/transactions.html',
      '/core-concepts/pdas.html',
      '/core-concepts/cpi.html',
      '/guides/get-program-accounts.html',
      '/guides/serializing-data.html',
      '/references/local-development.html',
      '/references/keypairs-and-wallets.html',
      '/references/basic-transactions.html',
      '/references/token.html',
      '/references/nfts.html',
    ],
  },
  {
    name: 'Solana Documentation',
    baseUrl: 'https://solana.com/docs',
    paths: [
      '/intro/installation/dependencies',
      '/intro/installation',
      '/intro/quick-start',
      '/core',
      '/core/accounts',
      '/core/transactions',
      '/core/programs',
      '/core/fees',
      '/core/cpi',
      '/core/pda',
      '/tokens',
      '/tokens/basics',
      '/tokens/extensions',
    ],
  },
];

// Scrape content from a URL
async function scrapeUrl(url: string): Promise<string> {
  try {
    console.log(`Scraping: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return '';
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, header, footer, .sidebar, .navigation').remove();

    // Extract main content (try different selectors)
    let content = '';
    const selectors = [
      'main',
      'article',
      '.content',
      '.markdown-body',
      '#content',
      '.post-content',
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text();
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    return content;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return '';
  }
}

// Split text into chunks
function chunkText(text: string, maxChunkSize: number = 400): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence would exceed the limit, start a new chunk
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 50); // Filter out very short chunks
}

// Process a single documentation source
async function processSource(source: (typeof DOCUMENTATION_SOURCES)[0]) {
  console.log(`\n📚 Processing ${source.name}...`);

  for (const path of source.paths) {
    const fullUrl = `${source.baseUrl}${path}`;

    try {
      // Check if we already have this document
      const hasExisting = await KnowledgeService.hasDocuments(fullUrl);
      if (hasExisting) {
        console.log(`⏭️  Skipping ${fullUrl} (already exists)`);
        continue;
      }

      // Scrape the content
      const content = await scrapeUrl(fullUrl);
      if (!content || content.length < 100) {
        console.warn(`⚠️  Insufficient content from ${fullUrl}`);
        continue;
      }

      // Chunk the content
      const chunks = chunkText(content);
      console.log(`📄 Found ${chunks.length} chunks from ${fullUrl}`);

      // Store each chunk
      for (let i = 0; i < chunks.length; i++) {
        const success = await KnowledgeService.storeChunk(
          chunks[i],
          fullUrl,
          `${source.name} - ${path}`,
          i
        );

        if (success) {
          console.log(`✅ Stored chunk ${i + 1}/${chunks.length}`);
        } else {
          console.error(`❌ Failed to store chunk ${i + 1}/${chunks.length}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`✅ Completed ${fullUrl}`);
    } catch (error) {
      console.error(`❌ Error processing ${fullUrl}:`, error);
    }

    // Delay between URLs to be respectful
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Main ingestion function
async function main() {
  console.log('🚀 Starting documentation ingestion...');

  try {
    for (const source of DOCUMENTATION_SOURCES) {
      await processSource(source);
    }

    console.log('\n🎉 Documentation ingestion completed!');
  } catch (error) {
    console.error('💥 Ingestion failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
