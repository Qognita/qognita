import { NextRequest, NextResponse } from 'next/server';
import { routeQuery } from '@/lib/aiRouter';

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, address, chatHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log(`🤖 RAG Chat Request from user ${userId}: "${message}"`);

    // Route the query through our robust AI router
    const result = await routeQuery(message, address, chatHistory);

    console.log(`✅ RAG Response generated (intent: ${result.intent})`);

    return NextResponse.json({
      response: result.response,
      intent: result.intent,
      sources: result.sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('RAG Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        response: 'Sorry, I encountered an error processing your request. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Qognita RAG Chat API',
    version: '2.0.0',
    capabilities: [
      'Intelligent intent classification',
      'Live blockchain data queries via function calling',
      'Solana documentation search via RAG',
      'Hybrid analysis (docs + live data)',
      'Tokenomics generation and analysis',
      'Source attribution and citations',
      'Context-aware responses',
    ],
    intents: [
      'on_chain_query - Live blockchain data analysis',
      'doc_query - Documentation and concept explanations',
      'hybrid_query - Combined documentation and live data',
      'tokenomics_query - Tokenomics generation and analysis',
      'general - Greetings and general assistance',
    ],
  });
}
