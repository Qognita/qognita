import { openai } from '@/lib/openai'
import { KnowledgeService } from '@/services/knowledgeService'

export interface AIRouterResponse {
    response: string
    intent: 'on_chain_query' | 'doc_query' | 'hybrid_query' | 'general'
    sources?: {
        type: 'documentation' | 'live_data' | 'hybrid'
        docs?: Array<{
            content: string
            source_url: string
            source_title: string
            similarity: number
        }>
        blockchain_data?: any
    }
}

/**
 * The main AI Router - the "brain" that decides how to handle each query
 */
export async function routeQuery(
    query: string,
    address?: string | null,
    chatHistory?: any[]
): Promise<AIRouterResponse> {

    console.log(`🧠 AI Router processing: "${query}"`)

    // === STEP 1: Intent Classification ===
    const intentPrompt = `
    Analyze the following user query and classify its intent.
    Respond with ONLY one of the following JSON objects:
    {"intent": "on_chain_query"} - if asking for live blockchain data (balances, transactions, risk scores, wallet analysis)
    {"intent": "doc_query"} - if asking "what is", "how to", "explain" questions about Solana concepts
    {"intent": "hybrid_query"} - if asking for explanation that requires both documentation and live data
    {"intent": "general"} - if it's a general greeting or unclear request

    Examples:
    - "What tokens does wallet ABC123 hold?" → {"intent": "on_chain_query"}
    - "What is a Program Derived Address?" → {"intent": "doc_query"}
    - "My PDA transaction failed with error 0x1771, why?" → {"intent": "hybrid_query"}
    - "Hello, what can you do?" → {"intent": "general"}

    User Query: "${query}"
  `

    try {
        const intentResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: 'user', content: intentPrompt }],
            response_format: { type: "json_object" },
            temperature: 0,
            max_tokens: 50
        })

        const intentResult = JSON.parse(intentResponse.choices[0].message.content || '{"intent": "general"}')
        const intent = intentResult.intent

        console.log(`🎯 Intent classified as: ${intent}`)

        // === STEP 2: Route to Appropriate Handler ===
        switch (intent) {
            case 'on_chain_query':
                return await handleOnChainQuery(query, address, chatHistory)

            case 'doc_query':
                return await handleDocQuery(query)

            case 'hybrid_query':
                return await handleHybridQuery(query, address, chatHistory)

            case 'general':
            default:
                return await handleGeneralQuery(query)
        }

    } catch (error) {
        console.error('Intent classification failed:', error)
        // Fallback to general handling
        return await handleGeneralQuery(query)
    }
}

/**
 * Handle live blockchain data queries using existing function calling tools
 */
async function handleOnChainQuery(
    query: string,
    address?: string | null,
    chatHistory?: any[]
): Promise<AIRouterResponse> {

    console.log('📊 Handling on-chain query...')

    try {
        // Call existing chat-enhanced API for function calling
        const baseUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://qognita.vercel.app'

        const response = await fetch(`${baseUrl}/api/chat-enhanced`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                address: address || 'N/A', // Provide a default if no address
                chatHistory: chatHistory || []
            }),
        })

        const data = await response.json()

        return {
            response: data.response || 'Unable to fetch live blockchain data at this time.',
            intent: 'on_chain_query',
            sources: {
                type: 'live_data',
                blockchain_data: data.toolResults
            }
        }

    } catch (error) {
        console.error('On-chain query failed:', error)
        return {
            response: 'I encountered an error fetching live blockchain data. Please try again or rephrase your question.',
            intent: 'on_chain_query'
        }
    }
}

/**
 * Handle documentation queries using RAG system
 */
async function handleDocQuery(query: string): Promise<AIRouterResponse> {

    console.log('📚 Handling documentation query...')

    try {
        // Search the knowledge base for relevant documents
        const matches = await KnowledgeService.searchKnowledgeBase(query, 5, 0.2)

        if (!matches || matches.length === 0) {
            return {
                response: "I don't have specific documentation about that topic in my knowledge base yet. Could you try rephrasing your question or ask about core Solana concepts like accounts, transactions, programs, or PDAs?",
                intent: 'doc_query'
            }
        }

        // Prepare context from matched documents
        const context = matches
            .map(match => `**Source: ${match.source_title}**\n${match.content}`)
            .join('\n\n---\n\n')

        // Create comprehensive prompt with retrieved context
        const finalPrompt = `
      You are Qognita, an expert Solana AI assistant. Based ONLY on the following official Solana documentation, provide a clear, accurate, and helpful answer to the user's question.

      If the documentation doesn't fully answer the question, acknowledge this and provide what information you can from the available context.

      Documentation Context:
      """
      ${context}
      """
      
      User Question: ${query}

      Instructions:
      - Provide a comprehensive but concise answer
      - Use the documentation as your primary source
      - Include relevant technical details and examples when appropriate
      - Format your response with proper markdown for readability
      - If you reference specific concepts, explain them briefly
      
      Answer:
    `

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: 'user', content: finalPrompt }],
            temperature: 0.3,
            max_tokens: 1000
        })

        return {
            response: completion.choices[0].message.content || 'I apologize, but I encountered an error generating a response.',
            intent: 'doc_query',
            sources: {
                type: 'documentation',
                docs: matches.map(match => ({
                    content: match.content,
                    source_url: match.source_url,
                    source_title: match.source_title,
                    similarity: match.similarity
                }))
            }
        }

    } catch (error) {
        console.error('Documentation query failed:', error)
        return {
            response: 'I encountered an error while searching the documentation. Please try again.',
            intent: 'doc_query'
        }
    }
}

/**
 * Handle hybrid queries that need both documentation and live data
 */
async function handleHybridQuery(
    query: string,
    address?: string | null,
    chatHistory?: any[]
): Promise<AIRouterResponse> {

    console.log('🔄 Handling hybrid query...')

    try {
        // For MVP, start with documentation search and enhance with live data if needed
        const docResult = await handleDocQuery(query)

        // If we have an address or the query suggests live data is needed, also fetch that
        const needsLiveData = address ||
            query.toLowerCase().includes('transaction') ||
            query.toLowerCase().includes('failed') ||
            query.toLowerCase().includes('error')

        if (needsLiveData) {
            const liveResult = await handleOnChainQuery(query, address, chatHistory)

            // Combine both responses intelligently
            const combinedPrompt = `
        You are Qognita, a Solana AI assistant. The user asked: "${query}"

        I have gathered both documentation and live blockchain data. Please provide a comprehensive response that combines both sources appropriately.

        Documentation Response:
        ${docResult.response}

        Live Data Response:
        ${liveResult.response}

        Please create a unified, coherent response that leverages both the documentation context and the live data to fully answer the user's question. Focus on explaining the concept first, then showing how it applies to the specific live data.
      `

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: 'user', content: combinedPrompt }],
                temperature: 0.3,
                max_tokens: 1200
            })

            return {
                response: completion.choices[0].message.content || 'I apologize, but I encountered an error generating a response.',
                intent: 'hybrid_query',
                sources: {
                    type: 'hybrid',
                    docs: docResult.sources?.docs,
                    blockchain_data: liveResult.sources?.blockchain_data
                }
            }
        }

        // If no live data needed, return documentation result
        return {
            ...docResult,
            intent: 'hybrid_query'
        }

    } catch (error) {
        console.error('Hybrid query failed:', error)
        return {
            response: 'I encountered an error while processing your request. Please try again or break your question into smaller parts.',
            intent: 'hybrid_query'
        }
    }
}

/**
 * Handle general queries and greetings
 */
async function handleGeneralQuery(query: string): Promise<AIRouterResponse> {

    console.log('💬 Handling general query...')

    const generalPrompt = `
    You are Qognita, an expert AI assistant for everything Solana blockchain. The user said: "${query}"

    Provide a helpful, friendly response. If it's a greeting, introduce your capabilities. If it's unclear what they want, guide them toward the types of questions you can answer.

    You can help with:
    🔍 Live blockchain analysis (wallet balances, token analysis, transaction history)
    📚 Solana documentation (concepts, development guides, troubleshooting)
    🛡️ Security analysis (token safety, smart contract risks)
    🔧 Development help (Anchor, Rust, program development)

    Keep your response concise and encouraging.
  `

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: 'user', content: generalPrompt }],
            temperature: 0.4,
            max_tokens: 400
        })

        return {
            response: completion.choices[0].message.content || 'Hello! I\'m Qognita, your Solana AI assistant. How can I help you today?',
            intent: 'general'
        }

    } catch (error) {
        console.error('General query failed:', error)
        return {
            response: 'Hello! I\'m Qognita, your AI assistant for everything Solana. I can help you with live blockchain data, documentation, security analysis, and development questions. What would you like to know?',
            intent: 'general'
        }
    }
}
