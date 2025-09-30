import OpenAI from 'openai'
import { availableTools, SOLANA_ANALYST_SYSTEM_PROMPT } from '@/lib/ai-tools'
import {
  getTransactionHistory,
  getSolBalance,
  getTokenHoldings,
  getLastTransaction,
  getAccountInfo,
  countTransactionsByDateRange,
  getDetailedTransactions,
  analyzeTransactionSignature,
  getTokenHolders,
  getTokenInfo
} from '@/services/solana-tools'
import { generateTokenomics, analyzeTokenomics } from '@/services/tokenomics-tools'
import { checkForHoneypotPatterns, quickSecurityCheck } from '@/services/security-tools'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface OnChainQueryResult {
  response: string
  toolsUsed?: string[]
  toolResults?: any
}

/**
 * Process on-chain queries using AI function calling
 * This is the core logic extracted from /api/chat-enhanced
 */
export async function processOnChainQuery(
  query: string,
  address?: string | null,
  chatHistory?: any[]
): Promise<OnChainQueryResult> {
  
  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // Extract transaction hash from query if no address provided
  let targetAddress = address
  if (!targetAddress || targetAddress === 'N/A') {
    const txHashMatch = query.match(/[A-Za-z0-9]{44}/g)
    if (txHashMatch) {
      targetAddress = txHashMatch[0]
    } else {
      targetAddress = 'N/A'
    }
  }

  // Build messages array with conversation history
  const aiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: SOLANA_ANALYST_SYSTEM_PROMPT
    }
  ]
  
  // Add conversation history if provided
  if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
    for (const msg of chatHistory) {
      aiMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })
    }
  }
  
  // Add current user message with address context if available
  const currentUserContent = targetAddress && targetAddress !== 'N/A' 
    ? `User query about Solana address ${targetAddress}: ${query}`
    : query
    
  aiMessages.push({
    role: "user",
    content: currentUserContent
  })

  // Get initial AI response with tool selection
  const initialResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: aiMessages,
    tools: availableTools,
    tool_choice: "auto",
    temperature: 0.1,
  })
  
  const responseMessage = initialResponse.choices[0].message
  const toolCalls = responseMessage.tool_calls

  // Execute tool calls if AI requested them
  if (toolCalls && toolCalls.length > 0) {
    // Add the assistant's message with tool calls first
    aiMessages.push(responseMessage)

    const toolResults: any = {}

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      let functionResponse: any

      try {
        // Execute the appropriate function based on AI's request
        switch (functionName) {
          case "getTransactionHistory":
            functionResponse = await getTransactionHistory(
              functionArgs.address || targetAddress,
              functionArgs.limit || 1000
            )
            break

          case "countTransactionsByDateRange":
            functionResponse = await countTransactionsByDateRange(
              functionArgs.address || targetAddress,
              functionArgs.startDate,
              functionArgs.endDate
            )
            break

          case "getDetailedTransactions":
            functionResponse = await getDetailedTransactions(
              functionArgs.address || targetAddress,
              functionArgs.startDate,
              functionArgs.endDate,
              functionArgs.page || 1,
              functionArgs.limit || 5
            )
            break

          case "getSolBalance":
            functionResponse = await getSolBalance(functionArgs.address || targetAddress)
            break

          case "getTokenHoldings":
            functionResponse = await getTokenHoldings(functionArgs.address || targetAddress)
            break

          case "getLastTransaction":
            functionResponse = await getLastTransaction(functionArgs.address || targetAddress)
            break

          case "getAccountInfo":
            functionResponse = await getAccountInfo(functionArgs.address || targetAddress)
            break

          case "analyzeTransactionSignature":
            functionResponse = await analyzeTransactionSignature(functionArgs.signature || targetAddress)
            break

          case "getTokenHolders":
            functionResponse = await getTokenHolders(
              functionArgs.mintAddress || targetAddress,
              functionArgs.limit || 50
            )
            break

          case "getTokenInfo":
            functionResponse = await getTokenInfo(functionArgs.mintAddress || targetAddress)
            break

          case "generateTokenomics":
            functionResponse = await generateTokenomics({
              name: functionArgs.name,
              description: functionArgs.description,
              useCase: functionArgs.useCase,
              targetMarket: functionArgs.targetMarket,
              totalSupply: functionArgs.totalSupply
            })
            break

          case "analyzeTokenomics":
            functionResponse = await analyzeTokenomics(functionArgs.tokenAddress)
            break

          case "checkForHoneypotPatterns":
            functionResponse = await checkForHoneypotPatterns(functionArgs.address || targetAddress)
            break

          case "quickSecurityCheck":
            functionResponse = await quickSecurityCheck(functionArgs.address || targetAddress)
            break

          default:
            throw new Error(`Unknown function: ${functionName}`)
        }

        // Store tool results
        toolResults[functionName] = functionResponse

        // Send the raw result back to AI
        aiMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify(functionResponse),
        })

      } catch (error) {
        // Send error back to AI so it can handle gracefully
        aiMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        })
      }
    }

    // Get final AI response with tool results
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: aiMessages,
      temperature: 0.1
    })

    const finalAnswer = finalResponse.choices[0].message.content

    return {
      response: finalAnswer || 'Unable to generate response',
      toolsUsed: toolCalls.map(tc => tc.function.name),
      toolResults
    }
  } else {
    // AI can answer without tools
    return {
      response: responseMessage.content || 'Unable to generate response',
      toolsUsed: []
    }
  }
}
