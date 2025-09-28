import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      solana: 'unknown',
      morpheus: 'unknown',
      openai: 'unknown'
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  try {
    // Check Solana RPC connection
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )
    
    const slot = await connection.getSlot()
    if (slot > 0) {
      healthCheck.services.solana = 'operational'
    }
  } catch (error) {
    healthCheck.services.solana = 'error'
    console.warn('Solana health check failed:', error)
  }

  // Check OpenAI configuration
  if (process.env.OPENAI_API_KEY) {
    healthCheck.services.openai = 'configured'
  } else {
    healthCheck.services.openai = 'not_configured'
  }

  // Check Morpheus configuration
  if (process.env.MORPHEUS_API_KEY && process.env.MORPHEUS_API_URL) {
    healthCheck.services.morpheus = 'configured'
  } else {
    healthCheck.services.morpheus = 'not_configured'
  }

  // Determine overall status
  const hasErrors = Object.values(healthCheck.services).includes('error')
  const hasUnconfigured = Object.values(healthCheck.services).includes('not_configured')
  
  if (hasErrors) {
    healthCheck.status = 'degraded'
  } else if (hasUnconfigured) {
    healthCheck.status = 'partial'
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'partial' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}

export async function POST() {
  // Extended health check with more detailed diagnostics
  const extendedCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'operational', responseTime: 0 },
      solana: { status: 'unknown', endpoint: '', slot: 0, responseTime: 0 },
      morpheus: { status: 'unknown', configured: false },
      openai: { status: 'unknown', configured: false }
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version
    }
  }

  const startTime = Date.now()

  try {
    // Detailed Solana check
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    const connection = new Connection(rpcUrl)
    
    const solanaStart = Date.now()
    const [slot, version] = await Promise.all([
      connection.getSlot(),
      connection.getVersion()
    ])
    const solanaTime = Date.now() - solanaStart

    extendedCheck.services.solana = {
      status: 'operational',
      endpoint: rpcUrl,
      slot,
      responseTime: solanaTime
    }
  } catch (error) {
    extendedCheck.services.solana = {
      status: 'error',
      endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'default',
      slot: 0,
      responseTime: 0
    }
  }

  // Check service configurations
  extendedCheck.services.morpheus = {
    status: process.env.MORPHEUS_API_KEY ? 'configured' : 'not_configured',
    configured: !!(process.env.MORPHEUS_API_KEY && process.env.MORPHEUS_API_URL)
  }

  extendedCheck.services.openai = {
    status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
    configured: !!process.env.OPENAI_API_KEY
  }

  extendedCheck.services.api.responseTime = Date.now() - startTime

  return NextResponse.json(extendedCheck)
}
