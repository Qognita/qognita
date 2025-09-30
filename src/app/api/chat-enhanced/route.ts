import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Chat API called')
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { query, address, message, messages, chatHistory } = body
    
    // Support both old format (single query) and new format (full conversation)
    let conversationMessages: any[] = []
    
    if (messages && Array.isArray(messages)) {
      // New format: full conversation history
      conversationMessages = messages
    } else if (chatHistory && Array.isArray(chatHistory)) {
      // Alternative format: chatHistory array
      conversationMessages = chatHistory
    } else {
      // Old format: single query/message (backward compatibility)
      const userQuery = query || message
      if (!userQuery) {
        console.log('❌ Missing query, message, or messages array')
        return NextResponse.json(
          { error: 'Query, message, or messages array is required' },
          { status: 400 }
        )
      }
      conversationMessages = [{ role: 'user', content: userQuery }]
    }
    
    // Get the latest user message for processing
    const latestMessage = conversationMessages[conversationMessages.length - 1]
    const userQuery = latestMessage?.content || query || message
    
    // For transaction analysis, extract transaction hash from query if no address provided
    let targetAddress = address
    if (!targetAddress || targetAddress === 'N/A') {
      // Try to extract transaction hash from query (44 character base58 string)
      const txHashMatch = userQuery.match(/[A-Za-z0-9]{44}/g)
      if (txHashMatch) {
        targetAddress = txHashMatch[0]
        console.log('🔍 Extracted transaction hash from query:', targetAddress)
      } else {
        targetAddress = 'N/A'
      }
    }

    console.log(`🤖 Processing query: "${userQuery}" for address: ${targetAddress}`)

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI not configured')
      return NextResponse.json({
        response: "OpenAI is not configured. Please set up the OPENAI_API_KEY environment variable to enable intelligent chat analysis.",
        error: "OpenAI API key not configured"
      }, { status: 500 })
    }

    // === AI-First Approach: Let GPT-4 decide what tools to use ===
    // Build messages array with conversation history
    const aiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: SOLANA_ANALYST_SYSTEM_PROMPT
      }
    ]
    
    // Add conversation history (maintaining context)
    if (conversationMessages.length > 1) {
      // Add previous conversation turns
      for (let i = 0; i < conversationMessages.length - 1; i++) {
        const msg = conversationMessages[i]
        aiMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })
      }
    }
    
    // Add current user message with address context if available
    const currentUserContent = targetAddress && targetAddress !== 'N/A' 
      ? `User query about Solana address ${targetAddress}: ${userQuery}`
      : userQuery
      
    aiMessages.push({
      role: "user",
      content: currentUserContent
    })

    console.log('🧠 Sending query to AI with available tools...')

    const initialResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: aiMessages,
      tools: availableTools,
      tool_choice: "auto",
      temperature: 0.1, // Low temperature for factual accuracy
    })
    const responseMessage = initialResponse.choices[0].message
    const toolCalls = responseMessage.tool_calls

    // === Execute tool calls if AI requested them ===
    if (toolCalls && toolCalls.length > 0) {
      console.log(`🔧 AI requested ${toolCalls.length} tool(s):`, toolCalls.map(tc => tc.function.name))

      // Add the assistant's message with tool calls first
      aiMessages.push(responseMessage)

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`🔧 Executing tool: ${functionName} with args:`, functionArgs)

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

          console.log(`✅ Tool ${functionName} executed successfully`)

          // Send the raw result back to AI
          aiMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(functionResponse),
          })

        } catch (error) {
          console.error(`❌ Tool ${functionName} failed:`, error)
          
          // Send error back to AI so it can handle gracefully
          aiMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
          })
        }
      }

      // === Get final AI response with tool results ===
      console.log('🔄 Getting final AI response with tool results...')

      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: aiMessages,
        temperature: 0.1
      })

      const finalAnswer = finalResponse.choices[0].message.content

      console.log('✅ AI analysis complete')
      return NextResponse.json({
        response: finalAnswer,
        toolsUsed: toolCalls.map(tc => tc.function.name)
      })
    } else {
      // AI can answer without tools
      console.log('💬 AI answered directly without tools')
      return NextResponse.json({
        response: responseMessage.content,
        toolsUsed: []
      })
    }

  } catch (error) {
    console.error('❌ Chat enhanced error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
