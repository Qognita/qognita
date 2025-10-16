import { solanaKnowledgeBase, SearchResult } from './knowledgeBase';

export type QueryIntent = 'LIVE_DATA' | 'KNOWLEDGE' | 'HYBRID' | 'GENERAL';

export interface QueryClassification {
  intent: QueryIntent;
  confidence: number;
  reasoning: string;
  extractedEntities?: {
    addresses?: string[];
    tokens?: string[];
    programs?: string[];
    concepts?: string[];
    wallets?: string[];
    pdas?: string[];
    signatures?: string[];
    addressTypes?: string[];
  };
}

export interface AIResponse {
  response: string;
  sources?: {
    type: 'live_data' | 'documentation' | 'hybrid';
    data?: any;
    docs?: SearchResult[];
  };
  intent: QueryIntent;
}

export class AIRouter {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Classify user query to determine the appropriate response strategy
   */
  async classifyQuery(query: string): Promise<QueryClassification> {
    console.log(`🤔 Enhanced query classification: "${query}"`);

    const queryLower = query.toLowerCase();

    // Enhanced address/signature patterns with better detection
    const addressPattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    const signaturePattern = /[1-9A-HJ-NP-Za-km-z]{87,88}/g;
    const tokenMintPattern = /[1-9A-HJ-NP-Za-km-z]{43,44}/g; // More specific for token mints

    const addresses = query.match(addressPattern) || [];
    const signatures = query.match(signaturePattern) || [];
    const potentialTokens = query.match(tokenMintPattern) || [];

    // Use enhanced address classifier for better detection
    const addressTypes: string[] = [];
    if (addresses.length > 0) {
      const { AddressClassifier } = await import('@/lib/utils/addressClassifier');
      const classifier = new AddressClassifier();

      for (const address of addresses.slice(0, 3)) {
        // Limit to 3 addresses for performance
        try {
          const result = await classifier.classifyAddress(address);
          addressTypes.push(result.type);
          console.log(
            `📍 Detected ${result.type} with ${result.confidence} confidence: ${address}`
          );
        } catch (error) {
          console.warn(`Failed to classify address ${address}:`, error);
        }
      }
    }

    // Live data keywords
    const liveDataKeywords = [
      'balance',
      'tokens',
      'holders',
      'transactions',
      'last transfer',
      'recent activity',
      'current price',
      'volume',
      'liquidity',
      'what tokens does',
      'show me',
      'analyze',
      'check',
    ];

    // Knowledge keywords
    const knowledgeKeywords = [
      'how to',
      'what is',
      'explain',
      'how does',
      'what are',
      'tutorial',
      'guide',
      'documentation',
      'learn',
      'pda',
      'program derived address',
      'anchor',
      'rust',
      'account structure',
      'transaction lifecycle',
    ];

    // Error/debugging keywords
    const debugKeywords = [
      'error',
      'failed',
      'why',
      'fix',
      'debug',
      'problem',
      '0x',
      'transaction failed',
      'instruction failed',
    ];

    let liveDataScore = 0;
    let knowledgeScore = 0;
    let hybridScore = 0;

    // Enhanced scoring based on detected address types
    if (addresses.length > 0 || signatures.length > 0) {
      liveDataScore += 0.8;

      // Boost score based on specific address types detected
      for (const addressType of addressTypes) {
        switch (addressType) {
          case 'token':
          case 'nft':
            liveDataScore += 0.3;
            break;
          case 'wallet':
            liveDataScore += 0.4;
            break;
          case 'transaction':
            liveDataScore += 0.5;
            break;
          case 'program':
            // Programs might need both docs and live data
            hybridScore += 0.3;
            break;
          case 'pda':
            hybridScore += 0.4; // PDAs often need explanation + live data
            break;
        }
      }
    }

    // Score based on keywords
    for (const keyword of liveDataKeywords) {
      if (queryLower.includes(keyword)) {
        liveDataScore += 0.3;
      }
    }

    for (const keyword of knowledgeKeywords) {
      if (queryLower.includes(keyword)) {
        knowledgeScore += 0.4;
      }
    }

    for (const keyword of debugKeywords) {
      if (queryLower.includes(keyword)) {
        hybridScore += 0.5; // Debugging often needs both docs and live data
      }
    }

    // Determine intent
    let intent: QueryIntent = 'GENERAL';
    let confidence = 0;
    let reasoning = '';

    if (hybridScore > 0.4) {
      intent = 'HYBRID';
      confidence = hybridScore;
      reasoning =
        'Query appears to be debugging/troubleshooting related, needs both documentation and live data';
    } else if (liveDataScore > knowledgeScore && liveDataScore > 0.5) {
      intent = 'LIVE_DATA';
      confidence = liveDataScore;
      reasoning = 'Query contains addresses/signatures or asks for current blockchain data';
    } else if (knowledgeScore > liveDataScore && knowledgeScore > 0.5) {
      intent = 'KNOWLEDGE';
      confidence = knowledgeScore;
      reasoning = 'Query asks for conceptual information or how-to guidance';
    } else {
      intent = 'GENERAL';
      confidence = 0.3;
      reasoning = 'Query is general or unclear, will use best judgment';
    }

    // Enhanced entity extraction
    const tokens = addressTypes.includes('token') || addressTypes.includes('nft') ? addresses : [];
    const programs = addressTypes.includes('program') ? addresses : [];
    const wallets = addressTypes.includes('wallet') ? addresses : [];
    const pdas = addressTypes.includes('pda') ? addresses : [];

    // Extract Solana concepts mentioned
    const conceptKeywords = [
      'pda',
      'program derived address',
      'token mint',
      'nft',
      'spl token',
      'anchor',
      'rust',
      'account',
      'instruction',
      'transaction',
      'lamports',
      'sol',
    ];
    const concepts = conceptKeywords.filter((concept) => queryLower.includes(concept));

    const classification: QueryClassification = {
      intent,
      confidence,
      reasoning,
      extractedEntities: {
        addresses,
        tokens,
        programs,
        concepts,
        wallets,
        pdas,
        signatures,
        addressTypes,
      },
    };

    console.log(`🎯 Classification result:`, classification);
    return classification;
  }

  /**
   * Route query to appropriate handler based on intent
   */
  async routeQuery(query: string, userId?: string): Promise<AIResponse> {
    const classification = await this.classifyQuery(query);

    switch (classification.intent) {
      case 'LIVE_DATA':
        return await this.handleLiveDataQuery(query, classification, userId);

      case 'KNOWLEDGE':
        return await this.handleKnowledgeQuery(query, classification);

      case 'HYBRID':
        return await this.handleHybridQuery(query, classification, userId);

      default:
        return await this.handleGeneralQuery(query, classification);
    }
  }

  /**
   * Handle queries that need live blockchain data
   */
  private async handleLiveDataQuery(
    query: string,
    classification: QueryClassification,
    userId?: string
  ): Promise<AIResponse> {
    console.log('📊 Handling live data query...');

    try {
      // Call existing chat-enhanced API for function calling
      const response = await fetch('/api/chat-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          userId,
        }),
      });

      const data = await response.json();

      return {
        response: data.response || 'Unable to fetch live data at this time.',
        sources: {
          type: 'live_data',
          data: data.toolResults,
        },
        intent: 'LIVE_DATA',
      };
    } catch (error) {
      console.error('Live data query failed:', error);
      return {
        response: 'Sorry, I encountered an error fetching live blockchain data. Please try again.',
        intent: 'LIVE_DATA',
      };
    }
  }

  /**
   * Handle queries that need documentation/knowledge
   */
  private async handleKnowledgeQuery(
    query: string,
    classification: QueryClassification
  ): Promise<AIResponse> {
    console.log('📚 Handling knowledge query...');

    try {
      // Search knowledge base
      const searchResults = await solanaKnowledgeBase.searchKnowledge(query, 3);

      if (searchResults.length === 0) {
        return {
          response:
            "I don't have specific documentation about that topic yet. Could you try rephrasing your question or ask about Solana accounts, PDAs, transactions, or tokens?",
          intent: 'KNOWLEDGE',
        };
      }

      // Combine relevant documentation
      const context = searchResults
        .map(
          (result) =>
            `**${result.chunk.title}** (from ${result.chunk.source}):\n${result.chunk.content}`
        )
        .join('\n\n---\n\n');

      // Generate response using OpenAI with documentation context
      const aiResponse = await this.generateResponseWithContext(query, context);

      return {
        response: aiResponse,
        sources: {
          type: 'documentation',
          docs: searchResults,
        },
        intent: 'KNOWLEDGE',
      };
    } catch (error) {
      console.error('Knowledge query failed:', error);
      return {
        response: 'Sorry, I encountered an error accessing the documentation. Please try again.',
        intent: 'KNOWLEDGE',
      };
    }
  }

  /**
   * Handle queries that need both live data and documentation
   */
  private async handleHybridQuery(
    query: string,
    classification: QueryClassification,
    userId?: string
  ): Promise<AIResponse> {
    console.log('🔄 Handling hybrid query...');

    try {
      // Get both documentation and live data
      const [knowledgeResults, liveDataResponse] = await Promise.all([
        solanaKnowledgeBase.searchKnowledge(query, 2),
        this.handleLiveDataQuery(query, classification, userId),
      ]);

      // Combine contexts
      let combinedResponse = '';

      if (knowledgeResults.length > 0) {
        const docContext = knowledgeResults.map((result) => result.chunk.content).join('\n\n');

        combinedResponse += `**Based on Solana documentation:**\n${docContext}\n\n`;
      }

      if (liveDataResponse.response) {
        combinedResponse += `**Live blockchain analysis:**\n${liveDataResponse.response}`;
      }

      // Generate final response combining both contexts
      const finalResponse = await this.generateResponseWithContext(
        query,
        combinedResponse,
        'You are answering a question that requires both conceptual knowledge and live blockchain data. Provide a comprehensive answer that explains the concept and shows real examples.'
      );

      return {
        response: finalResponse,
        sources: {
          type: 'hybrid',
          docs: knowledgeResults,
          data: liveDataResponse.sources?.data,
        },
        intent: 'HYBRID',
      };
    } catch (error) {
      console.error('Hybrid query failed:', error);
      return {
        response: 'Sorry, I encountered an error processing your request. Please try again.',
        intent: 'HYBRID',
      };
    }
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(
    query: string,
    classification: QueryClassification
  ): Promise<AIResponse> {
    console.log('💬 Handling general query...');

    // For general queries, try to be helpful and suggest what the user might want
    const response = `I'm Qognita, your AI assistant for everything Solana! I can help you with:

🔍 **Live blockchain data**: Ask about wallet balances, token holders, transaction analysis
📚 **Documentation**: Learn about Solana concepts, Anchor development, PDAs, and more  
🛡️ **Security analysis**: Check tokens for risks, analyze smart contracts
🔧 **Debugging**: Help troubleshoot failed transactions and errors

Try asking something like:
- "What tokens does [wallet address] hold?"
- "How do PDAs work in Solana?"
- "My transaction failed with error 0x1771, why?"
- "Is this token safe: [token address]"

What would you like to know about Solana?`;

    return {
      response,
      intent: 'GENERAL',
    };
  }

  /**
   * Generate AI response with given context using OpenAI
   */
  private async generateResponseWithContext(
    query: string,
    context: string,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                systemPrompt ||
                `You are Qognita, an expert AI assistant for Solana blockchain. Answer the user's question using the provided documentation context. Be accurate, helpful, and cite sources when relevant. Format your response in markdown.`,
            },
            {
              role: 'user',
              content: `Context:\n${context}\n\nQuestion: ${query}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Unable to generate response.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return 'Sorry, I encountered an error generating a response. Please try again.';
    }
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();
