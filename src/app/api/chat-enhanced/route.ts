import { NextRequest, NextResponse } from 'next/server';
import { processOnChainQuery } from '@/lib/services/onChainQueryService';

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Chat API called');
    const body = await request.json();
    console.log('📝 Request body:', body);

    const { query, address, message, messages, chatHistory } = body;

    // Support both old format (single query) and new format (full conversation)
    let conversationMessages: any[] = [];

    if (messages && Array.isArray(messages)) {
      // New format: full conversation history
      conversationMessages = messages;
    } else if (chatHistory && Array.isArray(chatHistory)) {
      // Alternative format: chatHistory array
      conversationMessages = chatHistory;
    } else {
      // Old format: single query/message (backward compatibility)
      const userQuery = query || message;
      if (!userQuery) {
        console.log('❌ Missing query, message, or messages array');
        return NextResponse.json(
          { error: 'Query, message, or messages array is required' },
          { status: 400 }
        );
      }
      conversationMessages = [{ role: 'user', content: userQuery }];
    }

    // Get the latest user message for processing
    const latestMessage = conversationMessages[conversationMessages.length - 1];
    const userQuery = latestMessage?.content || query || message;

    console.log(`🤖 Processing query: "${userQuery}" for address: ${address}`);

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI not configured');
      return NextResponse.json(
        {
          response:
            'OpenAI is not configured. Please set up the OPENAI_API_KEY environment variable to enable intelligent chat analysis.',
          error: 'OpenAI API key not configured',
        },
        { status: 500 }
      );
    }

    // Use the shared on-chain query service
    const result = await processOnChainQuery(userQuery, address, conversationMessages);

    console.log('✅ AI analysis complete');
    return NextResponse.json({
      response: result.response,
      toolsUsed: result.toolsUsed || [],
      toolResults: result.toolResults,
    });
  } catch (error) {
    console.error('❌ Chat enhanced error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
