import { NextRequest, NextResponse } from 'next/server'
import { MorpheusService } from '@/lib/services/morpheus'
import { ParseRequest, ParseResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequest = await request.json()
    const { data, programId } = body

    if (!data || !programId) {
      return NextResponse.json(
        { error: 'Both data and programId are required' },
        { status: 400 }
      )
    }

    // Initialize Morpheus service
    const morpheusService = new MorpheusService({
      apiUrl: process.env.MORPHEUS_API_URL || 'https://api.morpheus.ai',
      apiKey: process.env.MORPHEUS_API_KEY || 'demo-key',
      modelId: process.env.MORPHEUS_MODEL_ID || 'security-analyzer-v1'
    })

    try {
      // Convert base64 data to Buffer
      const rawData = Buffer.from(data, 'base64')
      
      // Parse the account data using Morpheus AI
      const parsedResult = await morpheusService.parseAccountData(rawData, programId)
      
      const response: ParseResponse = {
        parsed: {
          accountType: parsedResult.accountType,
          fields: parsedResult.fields
        }
      }

      return NextResponse.json(response)

    } catch (parseError) {
      console.error('Parsing error:', parseError)
      
      // Fallback parsing
      const fallbackResponse: ParseResponse = {
        parsed: {
          accountType: 'Unknown',
          fields: {
            programId,
            dataLength: Buffer.from(data, 'base64').length,
            error: 'Advanced parsing unavailable - using basic analysis',
            rawDataPreview: data.substring(0, 100) + (data.length > 100 ? '...' : '')
          }
        }
      }

      return NextResponse.json(fallbackResponse)
    }

  } catch (error) {
    console.error('Parse API error:', error)
    return NextResponse.json(
      { 
        error: 'Parsing failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Solana Account Data Parser API',
    description: 'Parse raw Solana account data into human-readable format',
    usage: {
      method: 'POST',
      body: {
        data: 'base64_encoded_account_data',
        programId: 'program_id_that_owns_the_account'
      }
    },
    example: {
      data: 'AQAAABYnAQAAAAAABgAAAAAAAAAGAAAAAAAAAA==',
      programId: '11111111111111111111111111111112'
    }
  })
}
