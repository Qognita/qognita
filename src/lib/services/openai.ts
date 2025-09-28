import OpenAI from 'openai'
import { ChatMessage } from '@/lib/types/api'
import { SecurityAnalysis } from '@/lib/types/security'

export class OpenAIService {
  private client: OpenAI
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: false // This will run on the server side
    })
  }

  async generateSecurityReport(analysisData: any): Promise<string> {
    try {
      const prompt = this.createReportPrompt(analysisData)
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain security expert specializing in Solana. Provide clear, actionable security assessments that non-technical users can understand.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 1000
      })

      return response.choices[0].message.content || 'Unable to generate security report.'
    } catch (error) {
      console.error('Error generating security report:', error)
      return this.fallbackSecurityReport(analysisData)
    }
  }

  async answerSecurityQuestion(question: string, context: any): Promise<string> {
    try {
      const prompt = this.createQuestionPrompt(question, context)
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful blockchain security assistant. Answer questions about Solana security in a clear, educational manner. Always prioritize user safety and provide actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 800
      })

      return response.choices[0].message.content || 'I apologize, but I cannot provide an answer at this time.'
    } catch (error) {
      console.error('Error answering security question:', error)
      return this.fallbackAnswer(question)
    }
  }

  async streamChatResponse(messages: ChatMessage[], context?: any): Promise<ReadableStream> {
    try {
      // Fall back to regular Chat Completions API since GPT-5 Responses API might not be available yet
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4o', // Use available model
        messages: [
          {
            role: 'system',
            content: `You are a blockchain security expert for Solana. Help users understand security risks, analyze transactions, wallets, programs, and tokens. Provide detailed insights about:
            - Security analysis and risk assessment
            - Transaction history and patterns
            - Wallet activity and behavior
            - Program functionality and risks
            - Token information and legitimacy
            
            Be thorough but accessible to both technical and non-technical users.
            ${context ? `\n\nContext: ${JSON.stringify(context, null, 2)}` : ''}`
          },
          ...messages
        ],
        stream: true,
        temperature: 0.3,
        max_completion_tokens: 1000
      })

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                controller.enqueue(new TextEncoder().encode(content))
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })
    } catch (error) {
      console.error('Error streaming chat response:', error)
      
      // Return fallback stream
      return new ReadableStream({
        start(controller) {
          const fallbackMessage = "I'm sorry, but I'm unable to process your request at the moment. Please try again later."
          controller.enqueue(new TextEncoder().encode(fallbackMessage))
          controller.close()
        }
      })
    }
  }

  private createReportPrompt(analysisData: any): string {
    const trustScore = analysisData.trustScore || 50
    const risks = analysisData.risks || []
    const address = analysisData.address || 'Unknown'
    const tokenInfo = analysisData.tokenInfo
    const holderAnalysis = analysisData.holderAnalysis
    const accountType = analysisData.parsedData?.accountType || 'Unknown'
    
    let contextualInfo = ''
    
    if (tokenInfo) {
      contextualInfo += `
**Token Information:**
- Name: ${tokenInfo.name || 'Unknown'}
- Symbol: ${tokenInfo.symbol || 'Unknown'}
- Supply: ${tokenInfo.supply || 'Unknown'}
- Decimals: ${tokenInfo.decimals || 'Unknown'}
- Mint Authority: ${tokenInfo.mintAuthority ? 'Active (can create new tokens)' : 'Renounced (fixed supply)'}
- Freeze Authority: ${tokenInfo.freezeAuthority ? 'Active (can freeze accounts)' : 'Renounced (cannot freeze)'}
${tokenInfo.marketData ? `
- Market Cap: $${tokenInfo.marketData.marketCap?.toLocaleString() || 'Unknown'}
- Price: $${tokenInfo.marketData.price || 'Unknown'}
- 24h Volume: $${tokenInfo.marketData.volume24h?.toLocaleString() || 'Unknown'}` : ''}
      `
    }
    
    if (holderAnalysis) {
      const topHolder = holderAnalysis.topHolders?.[0]
      contextualInfo += `
**Holder Distribution:**
- Total Holders: ${holderAnalysis.totalHolders?.toLocaleString() || 'Unknown'}
- Top Holder: ${topHolder ? `${topHolder.percentage.toFixed(2)}% (${topHolder.uiAmount.toLocaleString()} tokens)` : 'Unknown'}
- Top 10 Holders Control: ${holderAnalysis.distribution?.top10Percentage?.toFixed(2) || 'Unknown'}% of supply
      `
    }
    
    return `
      Generate a comprehensive, specific security analysis report for this ${accountType}:
      
      **Address:** ${address}
      **Trust Score:** ${trustScore}/100
      **Account Type:** ${accountType}
      
      ${contextualInfo}
      
      **Identified Security Risks:**
      ${risks.length > 0 ? risks.map((r: any) => `- **${r.type}** (${r.severity}): ${r.description}`).join('\n') : 'No specific risks identified'}
      
      **Technical Analysis:**
      ${JSON.stringify(analysisData.technicalDetails, null, 2)}
      
      **Instructions:**
      1. Provide a specific executive summary based on the actual token/account data
      2. Analyze the REAL risks based on mint/freeze authorities, holder distribution, and market data
      3. Give specific recommendations based on the token's actual characteristics
      4. If it's a new/unknown token, provide appropriate warnings about due diligence
      5. Comment on the holder distribution and what it means for centralization risk
      6. Use markdown formatting for better readability
      7. Be specific about THIS token, not generic advice
      
      Make this report specific to the actual data provided, not generic security advice.
    `
  }

  private createQuestionPrompt(question: string, context: any): string {
    let contextStr = ''
    if (context) {
      contextStr = `
        **Analysis Context for ${context.address}:**
        - Trust Score: ${context.trustScore}/100
        - Account Type: ${context.parsedData?.accountType || 'Unknown'}
        
        **Token Information:**
        ${context.tokenInfo ? `
        - Name: ${context.tokenInfo.name || 'Unknown'}
        - Symbol: ${context.tokenInfo.symbol || 'Unknown'}
        - Supply: ${context.tokenInfo.supply}
        - Decimals: ${context.tokenInfo.decimals}
        - Mint Authority: ${context.tokenInfo.mintAuthority ? 'Active' : 'Renounced'}
        - Freeze Authority: ${context.tokenInfo.freezeAuthority ? 'Active' : 'Renounced'}
        ` : 'No token information available'}
        
        **Recent Activity:**
        - Transaction Count: ${context.recentTransactions?.length || 0}
        
        **Security Risks:**
        ${context.risks?.map((risk: any) => `- ${risk.type}: ${risk.description}`).join('\n') || 'No specific risks identified'}
        
        **Parsed Account Data:**
        ${context.parsedData ? JSON.stringify(context.parsedData.fields, null, 2) : 'No parsed data available'}
      `
    }

    return `
      User Question: ${question}
      
      ${contextStr}
      
      **Instructions:**
      - Provide clear, helpful answers in plain English
      - Use markdown formatting for better readability
      - Include specific details from the context when relevant
      - For token questions, reference the actual token name, supply, and authorities
      - For transaction questions, reference the actual transaction data
      - For holder questions, explain how to find this information
      - Always prioritize user safety and provide actionable advice
      - Use bullet points and numbered lists where appropriate
      - Bold important information
      
      Answer the user's question comprehensively using the provided context.
    `
  }

  private fallbackSecurityReport(analysisData: any): string {
    const trustScore = analysisData.trustScore || 50
    const address = analysisData.address || 'Unknown'
    
    let report = `Security Analysis for ${address}\n\n`
    report += `Trust Score: ${trustScore}/100\n\n`
    
    if (trustScore >= 80) {
      report += "✅ This address appears to be relatively safe based on our analysis.\n\n"
    } else if (trustScore >= 60) {
      report += "⚠️ This address has some potential concerns. Please review the risks carefully.\n\n"
    } else {
      report += "🚨 This address has significant security concerns. Exercise extreme caution.\n\n"
    }
    
    report += "Recommendations:\n"
    report += "• Always verify addresses before sending funds\n"
    report += "• Start with small amounts when testing\n"
    report += "• Research the project thoroughly\n"
    report += "• Be cautious of promises of high returns\n\n"
    
    report += "Note: This is a basic analysis. For detailed security assessment, please ensure all AI services are properly configured."
    
    return report
  }

  private fallbackAnswer(question: string): string {
    return `I understand you're asking about: "${question}"

While I can't provide a detailed analysis right now due to technical limitations, here are some general Solana security tips:

🔒 **General Security Guidelines:**
• Always verify contract addresses before interacting
• Be cautious of new or unaudited programs
• Never share your private keys or seed phrases
• Use hardware wallets for large amounts
• Research projects thoroughly before investing

🚨 **Red Flags to Watch For:**
• Promises of guaranteed high returns
• Pressure to act quickly
• Unverified or anonymous teams
• Lack of proper documentation
• Unusual permission requests

For specific security analysis, please ensure the AI services are properly configured and try your question again.`
  }
}
