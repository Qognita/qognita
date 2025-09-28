export const runtime = "nodejs"
import { NextRequest, NextResponse } from 'next/server'
import { SolanaService } from '@/lib/services/solana'
import { EnhancedAnalysisService } from '@/lib/services/enhancedAnalysis'
import { AddressClassifier } from '@/lib/utils/addressClassifier'
import { OpenAIService } from '@/lib/services/openai'
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

    console.log(`🚀 Enhanced analysis starting for: ${address}`)
    const startTime = Date.now()

    // Initialize services
    const solanaService = new SolanaService('https://api.mainnet-beta.solana.com')
    const enhancedAnalysis = new EnhancedAnalysisService()
    const classifier = new AddressClassifier()
    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '')

    // Step 1: Fast classification
    const classification = await classifier.classifyAddress(address)
    const addressType = type || classification.type
    
    console.log(`📊 Classified as: ${classification.type} (${classification.confidence * 100}% confidence)`)

    let analysisResult: any = {
      address,
      addressType: classification.type,
      confidence: classification.confidence,
      details: classification.details
    }

    // Step 2: Type-specific analysis
    if (classification.details.isTransaction) {
      console.log('🔍 Analyzing transaction...')
      try {
        const txAnalysis = await enhancedAnalysis.analyzeTransaction(address)
        const txData = await solanaService.getTransaction(address)
        
        analysisResult = {
          ...analysisResult,
          transactionAnalysis: txAnalysis,
          transactionData: txData,
          trustScore: txAnalysis.isSuccessful ? 70 : 30,
          risks: txAnalysis.riskFactors.map(risk => ({
            type: 'Transaction Risk',
            severity: 'medium',
            description: risk
          }))
        }
      } catch (error) {
        console.error('Transaction analysis failed:', error)
        analysisResult.risks = [{ type: 'Analysis Error', severity: 'low', description: 'Could not analyze transaction' }]
        analysisResult.trustScore = 50
      }
    } 
    else if (classification.details.isProgram) {
      console.log('🔍 Analyzing program...')
      try {
        const programAnalysis = await enhancedAnalysis.analyzeProgram(address)
        const accountInfo = await solanaService.getAccountInfo(address)
        
        analysisResult = {
          ...analysisResult,
          programAnalysis,
          accountInfo,
          trustScore: programAnalysis.riskLevel === 'LOW' ? 80 : 
                     programAnalysis.riskLevel === 'MEDIUM' ? 60 : 
                     programAnalysis.riskLevel === 'HIGH' ? 40 : 20,
          risks: programAnalysis.securityIssues.map(issue => ({
            type: 'Program Security',
            severity: programAnalysis.riskLevel.toLowerCase(),
            description: issue
          }))
        }
      } catch (error) {
        console.error('Program analysis failed:', error)
        analysisResult.risks = [{ type: 'Analysis Error', severity: 'low', description: 'Could not analyze program' }]
        analysisResult.trustScore = 50
      }
    }
    else if (classification.details.isTokenMint) {
      console.log('🔍 Analyzing token for honeypot...')
      try {
        // Get basic token info
        const tokenInfo = await solanaService.getTokenInfo(address)
        
        // Run honeypot analysis
        const honeypotAnalysis = await enhancedAnalysis.analyzeForHoneypot(address)
        
        // Get market data from DexScreener
        const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
        let marketData = null
        if (dexResponse.ok) {
          const dexData = await dexResponse.json()
          marketData = dexData.pairs?.[0] || null
        }

        analysisResult = {
          ...analysisResult,
          tokenInfo: {
            ...tokenInfo,
            marketData: marketData ? {
              price: marketData.priceUsd,
              volume24h: marketData.volume?.h24,
              marketCap: marketData.marketCap,
              liquidity: marketData.liquidity?.usd
            } : null
          },
          honeypotAnalysis,
          trustScore: honeypotAnalysis.riskLevel === 'LOW' ? 85 : 
                     honeypotAnalysis.riskLevel === 'MEDIUM' ? 65 : 
                     honeypotAnalysis.riskLevel === 'HIGH' ? 35 : 15,
          risks: honeypotAnalysis.warnings.map(warning => ({
            type: 'Honeypot Risk',
            severity: honeypotAnalysis.riskLevel.toLowerCase(),
            description: warning
          }))
        }
      } catch (error) {
        console.error('Token analysis failed:', error)
        analysisResult.risks = [{ type: 'Analysis Error', severity: 'low', description: 'Could not analyze token' }]
        analysisResult.trustScore = 50
      }
    }
    else {
      // Default wallet analysis
      console.log('🔍 Analyzing wallet...')
      try {
        const accountInfo = await solanaService.getAccountInfo(address)
        const recentTransactions = await solanaService.getRecentTransactions(address, 10)
        
        analysisResult = {
          ...analysisResult,
          accountInfo,
          recentTransactions,
          trustScore: accountInfo ? 70 : 30,
          risks: accountInfo ? [] : [{ type: 'Account Risk', severity: 'low', description: 'Account not found or inactive' }]
        }
      } catch (error) {
        console.error('Wallet analysis failed:', error)
        analysisResult.risks = [{ type: 'Analysis Error', severity: 'low', description: 'Could not analyze wallet' }]
        analysisResult.trustScore = 50
      }
    }

    // Step 3: Generate enhanced report
    let report = 'Enhanced security analysis completed.'
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const reportPrompt = `
Generate a comprehensive security report for this ${classification.type}:

Address: ${address}
Type: ${classification.type}
Trust Score: ${analysisResult.trustScore}/100
Classification Confidence: ${(classification.confidence * 100).toFixed(1)}%

Analysis Results:
${JSON.stringify(analysisResult, null, 2)}

Provide specific insights based on the analysis type and detected risks. Use clear, actionable language.
        `
        
        report = await openaiService.generateSecurityReport({
          address,
          trustScore: analysisResult.trustScore,
          risks: analysisResult.risks || [],
          accountType: classification.type,
          ...analysisResult
        })
      } catch (error) {
        console.warn('Report generation failed:', error)
      }
    }

    const endTime = Date.now()
    console.log(`✅ Enhanced analysis completed in ${endTime - startTime}ms`)

    const response: AnalyzeResponse = {
      address,
      trustScore: analysisResult.trustScore,
      risks: analysisResult.risks || [],
      parsedData: {
        accountType: classification.type,
        fields: analysisResult,
        confidence: classification.confidence
      },
      tokenInfo: analysisResult.tokenInfo,
      recentTransactions: analysisResult.recentTransactions || [],
      holderAnalysis: analysisResult.holderAnalysis,
      technicalDetails: {
        owner: analysisResult.accountInfo?.owner || 'Unknown',
        executable: analysisResult.accountInfo?.executable || false,
        balance: analysisResult.accountInfo?.lamports || 0,
        analysisTime: endTime - startTime,
        classification: classification
      },
      report,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enhanced analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
