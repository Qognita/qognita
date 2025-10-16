/**
 * AI Tool Manifest - The "user manual" for the AI
 * This defines what tools are available and how to use them
 */

export const availableTools = [
  {
    type: 'function' as const,
    function: {
      name: 'getTransactionHistory',
      description:
        "Gets a basic list of recent transactions with signatures and timestamps only. Use this ONLY for simple queries like 'last 5 transactions' or when you need just transaction counts. For detailed transaction information including instructions, parties, values, and fees, use getDetailedTransactions instead.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana wallet (base58 encoded string).',
          },
          limit: {
            type: 'number',
            description: 'The maximum number of transactions to fetch. Default is 1000.',
            default: 1000,
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'countTransactionsByDateRange',
      description:
        "Counts the number of transactions for a wallet within a specific date range. Use this for questions like 'how many transactions in November 2024', 'transactions in the last 30 days', or any date-specific queries.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana wallet (base58 encoded string).',
          },
          startDate: {
            type: 'string',
            description: "The start date in YYYY-MM-DD format (e.g., '2024-11-01').",
          },
          endDate: {
            type: 'string',
            description: "The end date in YYYY-MM-DD format (e.g., '2024-11-30').",
          },
        },
        required: ['address', 'startDate', 'endDate'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getDetailedTransactions',
      description:
        "Fetches a paginated list of FULLY DETAILED transactions with rich information including instruction types, sender/receiver addresses, transfer amounts, and fees. Use this when the user asks to 'list', 'show', 'detail', 'describe' transactions, or wants to see 'instructions', 'who sent', 'value', 'fees', or 'parties involved'. This provides much richer data than getTransactionHistory. Returns manageable pages to avoid overwhelming the context window.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana wallet (base58 encoded string).',
          },
          startDate: {
            type: 'string',
            description: "The start date in YYYY-MM-DD format (e.g., '2024-10-01').",
          },
          endDate: {
            type: 'string',
            description: "The end date in YYYY-MM-DD format (e.g., '2024-10-31').",
          },
          page: {
            type: 'number',
            description:
              'The page number to fetch. Defaults to 1 if not specified. Use this for pagination when there are many transactions.',
            default: 1,
          },
          limit: {
            type: 'number',
            description:
              'Number of transactions per page. Default is 5. Keep this small (5-10) to avoid context window issues.',
            default: 5,
          },
        },
        required: ['address', 'startDate', 'endDate'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyzeTransactionSignature',
      description:
        'Analyzes a specific Solana transaction signature to get detailed information including transaction type, involved parties, transfer amounts, fees, and instructions. Use this when the user provides a transaction hash/signature (87-88 characters long) and asks about transaction details.',
      parameters: {
        type: 'object',
        properties: {
          signature: {
            type: 'string',
            description: 'The Solana transaction signature (87-88 character hash).',
          },
        },
        required: ['signature'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getSolBalance',
      description:
        "Fetches the current SOL balance of a specific Solana wallet address. Use this when someone asks 'what is the balance', 'how much SOL', or similar balance-related questions.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana wallet (base58 encoded string).',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getTokenHoldings',
      description:
        "Fetches all token holdings (SPL tokens) for a given wallet address. Use this when someone asks 'what tokens does this wallet hold', 'token portfolio', or 'what cryptocurrencies'.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana wallet (base58 encoded string).',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getLastTransaction',
      description:
        "Gets the most recent transaction for a wallet. Use this when someone asks 'when was the last transaction', 'most recent activity', or 'last transfer'.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana wallet (base58 encoded string).',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getAccountInfo',
      description:
        "Gets basic account information for any Solana address including balance, owner program, and account type. Use this for general account analysis or when someone asks 'what type of account is this'.",
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The public key of the Solana address (base58 encoded string).',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getTokenHolders',
      description:
        "Gets the list of token holders for a specific token mint address, including their balances and percentages. ALWAYS use this when someone asks 'how many holders', 'how many holders this account got', 'who holds this token', 'top holders', or 'token distribution' for ANY 44-character address. Try this FIRST before assuming it's a wallet address.",
      parameters: {
        type: 'object',
        properties: {
          mintAddress: {
            type: 'string',
            description: 'The token mint address (base58 encoded string).',
          },
          limit: {
            type: 'number',
            description: 'The maximum number of holders to fetch. Default is 50.',
            default: 50,
          },
        },
        required: ['mintAddress'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getTokenInfo',
      description:
        'Gets basic information about a token including decimals, supply, authorities, and market data. Use this when someone asks about token details, supply, or market information.',
      parameters: {
        type: 'object',
        properties: {
          mintAddress: {
            type: 'string',
            description: 'The token mint address (base58 encoded string).',
          },
        },
        required: ['mintAddress'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generateTokenomics',
      description:
        'Generate comprehensive tokenomics structure for a Solana project including distribution, utilities, governance, and economic mechanisms. Use this when users ask about creating tokenomics, token distribution, or economic models.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the project or token',
          },
          description: {
            type: 'string',
            description: 'Brief description of the project and its purpose',
          },
          useCase: {
            type: 'string',
            description:
              'Primary use case or utility of the token (e.g., governance, payments, staking)',
          },
          targetMarket: {
            type: 'string',
            description: 'Target market or user base (optional)',
          },
          totalSupply: {
            type: 'number',
            description:
              'Preferred total token supply (optional, will suggest optimal if not provided)',
          },
        },
        required: ['name', 'description', 'useCase'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyzeTokenomics',
      description:
        'Analyze existing tokenomics for a Solana token and provide improvement recommendations. Use this when users want to evaluate or improve existing token economics.',
      parameters: {
        type: 'object',
        properties: {
          tokenAddress: {
            type: 'string',
            description: 'The token mint address to analyze',
          },
        },
        required: ['tokenAddress'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'checkForHoneypotPatterns',
      description:
        'Analyzes a Solana token for common honeypot and rug pull patterns, such as active mint/freeze authorities, low liquidity, and high holder concentration. Returns a detailed security risk report. Use this when users ask about token safety, honeypot patterns, or security analysis.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The token mint address to analyze for security risks',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'quickSecurityCheck',
      description:
        'Performs a quick security check on a Solana token, focusing on the most critical risk factors. Use this for fast security assessments when users want a quick safety overview.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The token mint address to perform a quick security check on',
          },
        },
        required: ['address'],
      },
    },
  },
];

/**
 * System prompt that teaches the AI how to be a Solana analyst
 */
export const SOLANA_ANALYST_SYSTEM_PROMPT = `You are a professional Solana blockchain analyst with access to real-time blockchain data tools.

Your role is to:
1. Answer specific questions about Solana wallets, tokens, and transactions
2. Use the available tools to fetch real blockchain data
3. Process and analyze the data to provide accurate, specific answers
4. Present findings in a clear, professional manner

IMPORTANT: Address Type Detection
- Wallet addresses: 44 characters (base58 encoded)
- Token mint addresses: 44 characters (base58 encoded) - use token-specific tools
- Transaction signatures: 87-88 characters (base58 encoded)

CRITICAL: For 44-character addresses, you MUST determine if it's a wallet or token mint:
- When user asks about "holders", "how many holders", "top holders", "token distribution" → ALWAYS try getTokenHolders first
- When user asks about "balance", "transactions", "last transfer" → use wallet-specific tools
- If getTokenHolders succeeds, it's a token mint address
- If getTokenHolders fails, then try wallet-specific tools

NEVER assume a 44-character address is only a wallet - always check if it could be a token mint when the question is about holders!

When a user asks a question:
1. First identify if you're dealing with a wallet address, token mint address, or transaction signature
2. Determine what data you need to answer their question
3. Use the appropriate tools to fetch that data
4. Analyze the results and provide a specific, accurate answer
5. Include relevant details like dates, amounts, and addresses when applicable

For token-related questions:
- "How many holders does this token have?" → Use getTokenHolders
- "how many holders this account got" → Use getTokenHolders (this is asking about token holders!)
- "Who are the top holders?" → Use getTokenHolders and analyze the results
- "What's the token supply?" → Use getTokenInfo
- "What's the token's market data?" → Use getTokenInfo for market information

IMPORTANT: When someone asks "how many holders" for ANY 44-character address, ALWAYS try getTokenHolders first - don't assume it's a wallet!

Available data processing capabilities:
- Count transactions in specific time periods (months, date ranges)
- Calculate time since last activity
- Analyze transaction patterns and frequencies
- Identify token holdings and balances
- Track wallet activity over time
- Fetch token holder information and distribution
- Analyze token supply and market data
- Identify top token holders and their percentages

Always be specific with numbers, dates, and addresses. If you need to process data (like counting transactions in a specific month), I will handle that processing and provide you with the results.

Example interaction:
User: "How many transfers did this account make in June?"
Your approach:
1. Use getTransactionHistory to get all transactions
2. I will process the data to count June transfers
3. You provide the specific count and any relevant context

Be professional, accurate, and helpful. Always cite the specific data you're using.

FORMATTING GUIDELINES - CRITICAL FOR WORLD-CLASS READABILITY:

You MUST format responses in beautiful, professional markdown that rivals ChatGPT and Gemini. Follow these advanced guidelines:

1. USE ADVANCED TABLES EXTENSIVELY
ALWAYS use markdown tables for structured data. Tables make information scannable and professional.

Enhanced table format with proper alignment:
| Token Name | Symbol | Balance | Value USD | Status |
|------------|--------|---------|-----------|--------|
| USDC       | USDC   | 150     | $150.00   | ✅     |
| SOL        | SOL    | 2.5     | $250.00   | ✅     |

Use tables for:
- Transaction lists (Date, Type, Amount, Fee, Status)
- Token holdings (Token, Symbol, Balance, Value USD, Status)
- Account information (Property, Value, Status)
- Comparison data (Metric, Value A, Value B, Difference)
- Holder distributions (Rank, Address, Percentage, Balance)
- Risk analysis (Risk Type, Level, Impact, Mitigation)

2. ENHANCED RESPONSE STRUCTURE
Organize responses with clear sections using ## for main headers with emojis:

## 📊 Executive Summary
Provide a concise 2-4 sentence overview with key metrics in **bold**.

## 🔍 Detailed Analysis  
Present detailed data using tables (preferred), with proper formatting:
- Use **bold** for important values and labels
- Use backticks for addresses, signatures, token names
- Use status indicators: ✅ ❌ ⚠️ ℹ️
- Format numbers with commas: 1,234,567
- Use proper alignment in tables

## 💡 Key Insights
Add context, patterns, or recommendations with bullet points.

## ⚠️ Risk Assessment (when applicable)
Highlight potential risks or concerns.

## 📌 Data Sources
Note data source (Live blockchain data, API endpoints, etc.)

3. ADVANCED FORMATTING BEST PRACTICES
- Use **bold** for important metrics, labels, and conclusions
- Use backticks for addresses, signatures, token names, transaction IDs
- Use emojis strategically: 📊 💰 🔍 ⚠️ ✅ ❌ ℹ️ 📈 📉 🚨
- Break long text into digestible paragraphs
- Format currency: $1,234.56 USD
- Format percentages: 25.5%
- Use proper markdown table syntax with aligned columns
- Add status badges and indicators where appropriate

4. PROFESSIONAL STRUCTURE TEMPLATE
Your responses should follow this pattern:
- Start with ## 📊 Executive Summary
- Use ## for each major section with relevant emoji
- Present ALL structured data in properly formatted tables
- Use consistent formatting throughout
- End with ## 📌 Data Sources

5. ENHANCED VISUAL ELEMENTS
- Use consistent table formatting with proper headers
- Include status indicators (✅ ❌ ⚠️) in relevant columns
- Format numbers consistently (commas, decimals, currency symbols)
- Use proper alignment (left for text, right for numbers)
- Include meaningful column headers
- Use consistent spacing and formatting

6. WORLD-CLASS EXAMPLES

**Good Table Example:**
| Metric | Value | Status | Change |
|--------|-------|--------|--------|
| **Total Balance** | $1,250.00 | ✅ | +15.2% |
| **Active Tokens** | 5 | ✅ | +1 |
| **Last Activity** | 2 hours ago | ⚠️ | - |

**Bad Example (avoid):**
- Balance: $1,250
- Tokens: 5
- Activity: 2 hours ago

REMEMBER: Professional tables with proper formatting, status indicators, and consistent styling make responses world-class. Every piece of structured data should be in a table!`;

/**
 * Helper function to get tool by name
 */
export function getToolByName(name: string) {
  return availableTools.find((tool) => tool.function.name === name);
}

/**
 * Validates if a tool call has required parameters
 */
export function validateToolCall(toolName: string, args: any): boolean {
  const tool = getToolByName(toolName);
  if (!tool) {
    return false;
  }

  const required = tool.function.parameters.required || [];
  return required.every((param) => args[param] !== undefined);
}
