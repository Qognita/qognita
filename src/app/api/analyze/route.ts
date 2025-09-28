import { NextRequest, NextResponse } from 'next/server'
import { SolanaService } from '@/lib/services/solana'
import { MorpheusService } from '@/lib/services/morpheus'
import { SecurityService } from '@/lib/services/security'
import { OpenAIService } from '@/lib/services/openai'
import { TokenScraperService } from '@/lib/services/tokenScraper'
import { AnalyzeResponse, AnalyzeRequest } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()
    const { address, type } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Initialize services
    const solanaService = new SolanaService(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    const morpheusService = new MorpheusService({
      apiUrl: process.env.MORPHEUS_API_URL || 'https://api.morpheus.ai',
      apiKey: process.env.MORPHEUS_API_KEY || 'demo-key',
      modelId: process.env.MORPHEUS_MODEL_ID || 'security-analyzer-v1'
    })

    const openaiService = new OpenAIService(
      process.env.OPENAI_API_KEY || ''
    )

    const securityService = new SecurityService()

    // Validate input (address or transaction)
    const isTransaction = type === 'transaction' || address.length > 80
    if (isTransaction) {
      if (!solanaService.validateTransactionSignature(address)) {
        return NextResponse.json(
          { error: 'Invalid transaction signature' },
          { status: 400 }
        )
      }
    } else {
      if (!solanaService.validateAddress(address)) {
        return NextResponse.json(
          { error: 'Invalid Solana address' },
          { status: 400 }
        )
      }
    }

    // Step 1: Fetch on-chain data
    let accountInfo = null
    let transactionData = null

    if (isTransaction) {
      // Fetch transaction data
      transactionData = await solanaService.getTransaction(address)
      if (!transactionData) {
        return NextResponse.json(
          { error: 'Transaction not found on Solana blockchain' },
          { status: 404 }
        )
      }
    } else {
      // Fetch account data
      accountInfo = await solanaService.getAccountInfo(address)
      if (!accountInfo) {
        return NextResponse.json(
          { error: 'Address not found on Solana blockchain' },
          { status: 404 }
        )
      }
    }

    // Step 2: Detect address type if not provided
    const addressType = type || (isTransaction ? 'transaction' : await solanaService.detectAddressType(address))

    // Step 3: Parse data using Morpheus AI (if data exists)
    let parsedData = null

    if (accountInfo && accountInfo.data && accountInfo.data.length > 0) {
      try {
        parsedData = await morpheusService.parseAccountData(
          accountInfo.data,
          accountInfo.owner
        )
      } catch (error) {
        console.warn('Morpheus parsing failed, using fallback:', error)
      }
    } else if (transactionData) {
      try {
        parsedData = await morpheusService.detectRisks(transactionData)
      } catch (error) {
        console.warn('Morpheus transaction analysis failed, using fallback:', error)
      }
    }

    // Step 4: Get comprehensive token analysis for token mints
    let tokenInfo = null
    let comprehensiveTokenData = null

    if (addressType === 'token' || (accountInfo && accountInfo.owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) {
      try {
        let mintAddress = address

        // If it's a token account, get the mint address
        if (parsedData && 'fields' in parsedData && parsedData.fields && parsedData.fields.mintAddress) {
          mintAddress = parsedData.fields.mintAddress
        }

        // Get basic token info
        tokenInfo = await solanaService.getTokenInfo(mintAddress)

        // For token mints, get comprehensive analysis including holders
        if (parsedData && (parsedData as any).accountType === 'TokenMint') {
          console.log('🚀 Running comprehensive token analysis...')
          const tokenScraper = new TokenScraperService()
          comprehensiveTokenData = await tokenScraper.scrapeTokenData(mintAddress)

          // Merge the comprehensive data with basic token info
          if (comprehensiveTokenData.metadata.name && tokenInfo) {
            tokenInfo = {
              ...tokenInfo,
              address: tokenInfo.address || mintAddress, // Ensure address is always defined
              name: comprehensiveTokenData.metadata.name,
              symbol: comprehensiveTokenData.metadata.symbol,
              image: comprehensiveTokenData.metadata.image,
              description: comprehensiveTokenData.metadata.description,
              marketData: comprehensiveTokenData.metadata.marketData
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch token info:', error)
      }
    }

    // Step 5: Get recent transaction history (only for addresses, not transactions)
    const recentTransactions = isTransaction ? [] : await solanaService.getRecentTransactions(address, 20)

    // Step 6: Run security analysis
    const analysisData = {
      address,
      accountInfo: accountInfo || {
        address,
        lamports: 0,
        owner: 'Transaction',
        executable: false,
        rentEpoch: 0,
        data: null
      },
      parsedData,
      tokenInfo: tokenInfo ? { ...tokenInfo, address: tokenInfo.address || address } : undefined,
      transactionHistory: recentTransactions,
      transactionData: transactionData || undefined
    }

    const securityAnalysis = await securityService.generateSecurityAnalysis(analysisData)

    // Step 7: Generate human-readable report using OpenAI
    let report = 'Security analysis completed. Please review the trust score and risks.'

    if (process.env.OPENAI_API_KEY) {
      try {
        const finalAccountInfo = accountInfo || analysisData.accountInfo
        report = await openaiService.generateSecurityReport({
          address,
          trustScore: securityAnalysis.trustScore,
          risks: securityAnalysis.risks,
          accountType: addressType,
          tokenInfo: tokenInfo,
          holderAnalysis: comprehensiveTokenData ? {
            totalHolders: comprehensiveTokenData.totalHolders,
            topHolders: comprehensiveTokenData.holders.slice(0, 5),
            distribution: {
              top10Percentage: comprehensiveTokenData.holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0),
              top50Percentage: comprehensiveTokenData.holders.slice(0, 50).reduce((sum, h) => sum + h.percentage, 0)
            }
          } : undefined,
          parsedData: parsedData,
          technicalDetails: {
            owner: finalAccountInfo.owner,
            executable: finalAccountInfo.executable,
            balance: finalAccountInfo.lamports,
            parsedData,
            transactionData
          }
        })
      } catch (error) {
        console.warn('OpenAI report generation failed:', error)
      }
    }

    const response: AnalyzeResponse = {
      address,
      trustScore: securityAnalysis.trustScore,
      risks: securityAnalysis.risks,
      parsedData: parsedData || {
        accountType: addressType,
        fields: {},
        confidence: 0.5
      },
      tokenInfo: tokenInfo || undefined,
      recentTransactions: recentTransactions || [],
      holderAnalysis: comprehensiveTokenData ? {
        totalHolders: comprehensiveTokenData.totalHolders,
        topHolders: comprehensiveTokenData.holders.slice(0, 5),
        distribution: {
          top10Percentage: comprehensiveTokenData.holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0),
          top50Percentage: comprehensiveTokenData.holders.slice(0, 50).reduce((sum, h) => sum + h.percentage, 0)
        }
      } : undefined,
      technicalDetails: {
        owner: (accountInfo || analysisData.accountInfo).owner,
        executable: (accountInfo || analysisData.accountInfo).executable,
        balance: (accountInfo || analysisData.accountInfo).lamports,
        transactionData: transactionData
      },
      report,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Qognita Security Analysis API',
    endpoints: {
      analyze: 'POST /api/analyze - Analyze a Solana address',
      chat: 'POST /api/chat - Natural language security queries',
      parse: 'POST /api/parse - Parse raw account data',
      health: 'GET /api/health - Health check'
    }
  })
}
