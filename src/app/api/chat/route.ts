import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/services/openai'
import { ChatRequest } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, context } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        { 
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          }
        }
      )
    }

    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY)
    
    // For streaming responses, we need to handle this differently
    const lastMessage = messages[messages.length - 1]
    
    if (lastMessage.role === 'user') {
      // Detect if this is a blockchain-specific query
      const detectBlockchainQuery = (query: string) => {
        const queryLower = query.toLowerCase()
        const blockchainKeywords = ['token', 'holders', 'transactions', 'buy', 'sell', 'balance', 'supply', 'mint', 'freeze']
        return blockchainKeywords.some(keyword => queryLower.includes(keyword))
      }

      const isBlockchainQuery = detectBlockchainQuery(lastMessage.content)
      
      // Create enhanced context with blockchain data
      let enhancedContext = context
      if (isBlockchainQuery && context) {
        // Add more detailed context for blockchain queries
        enhancedContext = {
          ...context,
          blockchainQuery: true,
          queryType: 'address_analysis',
          tokenInfo: context.tokenInfo || null,
          recentTransactions: context.recentTransactions || [],
          parsedData: context.parsedData || null
        }
      }

      // If there's context (like analysis data), use the question-answering method
      if (enhancedContext) {
        const answer = await openaiService.answerSecurityQuestion(lastMessage.content, enhancedContext)
        return new Response(answer, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          }
        })
      } else {
        // For general chat, use streaming
        const stream = await openaiService.streamChatResponse(messages, context)
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          }
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid message format' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Chat error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Chat service unavailable'
    
    return new Response(errorMessage, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Solana Security Chat API',
    description: 'Natural language interface for security queries',
    usage: {
      method: 'POST',
      body: {
        messages: [
          {
            role: 'user',
            content: 'Is this token safe: ABC123...?'
          }
        ],
        context: 'Optional context object with analysis data'
      }
    }
  })
}
