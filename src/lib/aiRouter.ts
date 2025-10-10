import { openai } from '@/lib/openai'
import { KnowledgeService } from '@/services/knowledgeService'
import { processOnChainQuery } from '@/lib/services/onChainQueryService'

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
 * Handle live blockchain data queries using direct service call
 */
async function handleOnChainQuery(
    query: string,
    address?: string | null,
    chatHistory?: any[]
): Promise<AIRouterResponse> {

    console.log('📊 Handling on-chain query...')

    try {
        // Call the on-chain query service directly (no HTTP fetch)
        const result = await processOnChainQuery(query, address, chatHistory)

        return {
            response: result.response || 'Unable to fetch live blockchain data at this time.',
            intent: 'on_chain_query',
            sources: {
                type: 'live_data',
                blockchain_data: result.toolResults
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

      Format the answer as high-quality markdown with this structure:
      ### Short answer
      - 1-3 concise bullet points with the direct outcome.

      ### Details
      - Clear explanation with brief definitions where needed
      - Use bullet lists for steps and key takeaways
      - Use tables for parameter or field breakdowns when appropriate
      - Use inline code for identifiers and programs; code blocks for examples

      ### Sources
      - List each cited doc with a markdown link [Title](URL)

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

        I have gathered both documentation and live blockchain data. Provide a comprehensive response that blends both.

        Documentation Response (verbatim):
        ${docResult.response}

        Live Data Response (verbatim):
        ${liveResult.response}

        Format the final answer as markdown with this structure:
        ### Short answer
        - 1-3 bullets summarizing the outcome.

        ### Explanation
        - Explain the concept based on docs; define terms briefly.

        ### Live data insights
        - Present key numbers/findings as bullets or a small table.

        ### Next steps
        - Actionable follow-ups or checks.

        ### Sources
        - Cite docs and indicate live data sources.
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
    You are Qognita, an expert AI assistant for Solana. The user said: "${query}"

    Provide a helpful, friendly response. If it's a greeting, briefly introduce capabilities. If unclear, guide them toward concrete question types.

    Format using markdown:
    ### How I can help
    - Live blockchain analysis (balances, transactions, holders)
    - Documentation explanations (concepts, troubleshooting)
    - Security analysis (honeypot checks, risks)
    - Development help (Anchor, program basics)

    ### Suggested prompts
    - Provide 3-5 concise suggestions tailored to the user's input when unclear.
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
