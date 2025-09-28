import { NextRequest, NextResponse } from 'next/server'
import { SolanaService } from '@/lib/services/solana'
import { OpenAIService } from '@/lib/services/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, address, signature } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const solanaService = new SolanaService(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    let data: any = {}

    // Parse the query to determine what data to fetch
    const queryLower = query.toLowerCase()

    if (address) {
      // Address-specific queries
      if (queryLower.includes('balance')) {
        data.balance = await solanaService.getWalletBalance(address)
        data.tokenBalances = await solanaService.getTokenBalances(address)
      }
      
      if (queryLower.includes('transaction') || queryLower.includes('history')) {
        data.transactions = await solanaService.getDetailedTransactionHistory(address, 10)
      }
      
      if (queryLower.includes('recent') || queryLower.includes('last')) {
        const limit = extractNumber(query) || 5
        data.recentTransactions = await solanaService.getDetailedTransactionHistory(address, limit)
      }
    }

    if (signature) {
      // Transaction-specific queries
      if (queryLower.includes('from') || queryLower.includes('to') || queryLower.includes('flow')) {
        data.transactionFlow = await solanaService.analyzeTransactionFlow(signature)
      }
      
      data.transactionDetails = await solanaService.getTransaction(signature)
    }

    // Generate AI response with the fetched data
    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '')
    
    let response = ''
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
User Query: ${query}
${address ? `Address: ${address}` : ''}
${signature ? `Transaction: ${signature}` : ''}

Data Retrieved:
${JSON.stringify(data, null, 2)}

Please provide a clear, informative answer to the user's query based on the data above. 
Be specific with numbers, addresses, and transaction details when available.
If the data shows any security concerns, mention them.
Format the response in a user-friendly way.
`

        response = await openaiService.answerSecurityQuestion(prompt, data)
      } catch (error) {
        console.error('Error generating AI response:', error)
        response = generateFallbackResponse(query, data, address, signature)
      }
    } else {
      response = generateFallbackResponse(query, data, address, signature)
    }

    return NextResponse.json({
      query,
      response,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process query', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function extractNumber(text: string): number | null {
  const match = text.match(/\d+/)
  return match ? parseInt(match[0]) : null
}

function generateFallbackResponse(query: string, data: any, address?: string, signature?: string): string {
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('balance') && data.balance !== undefined) {
    let response = `The wallet balance is ${data.balance.toFixed(4)} SOL.`
    if (data.tokenBalances && data.tokenBalances.length > 0) {
      response += ` This wallet also holds ${data.tokenBalances.length} different tokens.`
    }
    return response
  }
  
  if (queryLower.includes('transaction') && data.transactions) {
    return `Found ${data.transactions.length} recent transactions for this address. The most recent transaction had ${data.transactions[0]?.instructions || 0} instructions and ${data.transactions[0]?.status === 'success' ? 'succeeded' : 'failed'}.`
  }
  
  if (queryLower.includes('flow') && data.transactionFlow) {
    const flow = data.transactionFlow
    if (flow.sender && flow.receivers.length > 0) {
      return `This transaction sent ${flow.sender.amount.toFixed(4)} SOL from ${flow.sender.address.slice(0, 8)}... to ${flow.receivers.length} recipient(s). Transaction fee was ${flow.fee.toFixed(6)} SOL.`
    }
  }
  
  return `I found some data related to your query, but I need more specific information to provide a detailed answer. Please try rephrasing your question or provide more context.`
}

export async function GET() {
  return NextResponse.json({
    message: 'Qognita Blockchain Query API',
    description: 'Natural language queries for blockchain data',
    usage: {
      method: 'POST',
      body: {
        query: 'What are the last 5 transactions for this wallet?',
        address: 'Optional wallet address',
        signature: 'Optional transaction signature'
      }
    },
    examples: [
      'What is the balance of this wallet?',
      'Show me the last 10 transactions',
      'Who sent this transaction and to whom?',
      'What tokens does this wallet hold?'
    ]
  })
}
