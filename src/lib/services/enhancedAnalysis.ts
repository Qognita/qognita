import { Connection, PublicKey } from '@solana/web3.js'
import { getMint, getAccount } from '@solana/spl-token'
import { SmartContractScanner, SmartContractAnalysis } from './smartContractScanner'

export interface HoneypotAnalysis {
  isHoneypot: boolean
  canSell: boolean
  buyTax: number
  sellTax: number
  liquidityLocked: boolean
  ownershipRenounced: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  warnings: string[]
}

export interface ProgramAnalysis {
  programId: string
  programType: 'TOKEN_PROGRAM' | 'SYSTEM_PROGRAM' | 'CUSTOM_PROGRAM' | 'DEX_PROGRAM' | 'UNKNOWN'
  isUpgradeable: boolean
  authority: string | null
  codeVerified: boolean
  securityIssues: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  smartContractAnalysis?: SmartContractAnalysis
}

export interface TransactionAnalysis {
  signature: string
  transactionType: 'TRANSFER' | 'SWAP' | 'MINT' | 'BURN' | 'PROGRAM_INTERACTION' | 'UNKNOWN'
  involvedPrograms: string[]
  tokenTransfers: Array<{
    mint: string
    from: string
    to: string
    amount: string
  }>
  riskFactors: string[]
  isSuccessful: boolean
}

export class EnhancedAnalysisService {
  private connection: Connection
  private solscanApiKey: string
  private smartContractScanner: SmartContractScanner
  
  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
    this.solscanApiKey = process.env.SOLSCAN_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTg2NjI5ODg2MTMsImVtYWlsIjoiYWtpbnRvbGFoYXJyeUBnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NTg2NjI5ODh9.7EV2QRVCc_-Sobo4Vv1YTuA18OPlmLvsmrsdbMRPCmE'
    this.smartContractScanner = new SmartContractScanner(rpcUrl)
  }

  async analyzeForHoneypot(tokenAddress: string): Promise<HoneypotAnalysis> {
    console.log(`🕵️ Analyzing ${tokenAddress} for honeypot characteristics...`)
    
    const warnings: string[] = []
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
    
    try {
      // 1. Check DexScreener for trading data
      const dexData = await this.getDexScreenerData(tokenAddress)
      
      // 2. Analyze transaction patterns
      const transactionAnalysis = await this.analyzeTransactionPatterns(tokenAddress)
      
      // 3. Check liquidity and ownership
      const liquidityAnalysis = await this.analyzeLiquidity(tokenAddress)
      
      // 4. Simulate buy/sell (basic check)
      const tradingAnalysis = await this.simulateTrading(tokenAddress)
      
      // Evaluate honeypot indicators
      let isHoneypot = false
      let canSell = true
      let buyTax = 0
      let sellTax = 0
      
      if (dexData) {
        // Check for suspicious trading patterns
        const buyCount = dexData.txns?.h24?.buys || 0
        const sellCount = dexData.txns?.h24?.sells || 0
        
        if (buyCount > 0 && sellCount === 0) {
          warnings.push('⚠️ No sells detected in 24h - possible honeypot')
          riskLevel = 'CRITICAL'
          isHoneypot = true
          canSell = false
        } else if (sellCount > 0 && buyCount / sellCount > 50) {
          warnings.push('⚠️ Extremely high buy/sell ratio - suspicious activity')
          riskLevel = 'HIGH'
        }
        
        // Check liquidity
        if (dexData.liquidity?.usd && dexData.liquidity.usd < 1000) {
          warnings.push('💧 Very low liquidity - high slippage risk')
          riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel
        }
      }
      
      if (transactionAnalysis.suspiciousPatterns) {
        warnings.push('📊 Suspicious transaction patterns detected')
        riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel
      }
      
      return {
        isHoneypot,
        canSell,
        buyTax,
        sellTax,
        liquidityLocked: liquidityAnalysis.locked,
        ownershipRenounced: liquidityAnalysis.ownershipRenounced,
        riskLevel,
        warnings
      }
      
    } catch (error) {
      console.error('Honeypot analysis failed:', error)
      return {
        isHoneypot: false,
        canSell: true,
        buyTax: 0,
        sellTax: 0,
        liquidityLocked: false,
        ownershipRenounced: false,
        riskLevel: 'MEDIUM',
        warnings: ['⚠️ Could not complete honeypot analysis']
      }
    }
  }

  async analyzeProgram(programId: string): Promise<ProgramAnalysis> {
    console.log(`🔍 Analyzing program ${programId}...`)
    
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(programId))
      
      if (!accountInfo) {
        throw new Error('Program not found')
      }
      
      // Determine program type
      let programType: ProgramAnalysis['programType'] = 'UNKNOWN'
      const securityIssues: string[] = []
      
      // Well-known program IDs
      const knownPrograms: Record<string, ProgramAnalysis['programType']> = {
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'TOKEN_PROGRAM',
        '11111111111111111111111111111112': 'SYSTEM_PROGRAM',
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'DEX_PROGRAM',
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'DEX_PROGRAM'
      }
      
      programType = knownPrograms[programId] || 'CUSTOM_PROGRAM'
      
      // Check if program is upgradeable
      const isUpgradeable = accountInfo.owner.toString() === 'BPFLoaderUpgradeab1e11111111111111111111111'
      
      if (isUpgradeable) {
        securityIssues.push('Program is upgradeable - code can be changed by authority')
      }
      
      // Get program authority using Solscan API
      let authority: string | null = null
      try {
        const solscanData = await this.getSolscanProgramData(programId)
        authority = solscanData?.authority || null
      } catch (error) {
        console.warn('Could not fetch program authority:', error)
      }
      
      const riskLevel: ProgramAnalysis['riskLevel'] = 
        programType === 'CUSTOM_PROGRAM' && isUpgradeable ? 'MEDIUM' : 'LOW'
      
      return {
        programId,
        programType,
        isUpgradeable,
        authority,
        codeVerified: false, // Would need additional verification
        securityIssues,
        riskLevel
      }
      
    } catch (error) {
      console.error('Program analysis failed:', error)
      throw error
    }
  }

  async analyzeTransaction(signature: string): Promise<TransactionAnalysis> {
    console.log(`📝 Analyzing transaction ${signature}...`)
    
    try {
      const transaction = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      })
      
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
      const involvedPrograms: string[] = []
      const tokenTransfers: TransactionAnalysis['tokenTransfers'] = []
      const riskFactors: string[] = []
      
      // Extract involved programs from parsed instructions
      transaction.transaction.message.instructions.forEach((instruction: any) => {
        let programId: string
        
        if ('parsed' in instruction) {
          // For parsed instructions, get program from the instruction
          programId = instruction.programId?.toString() || 'Unknown'
        } else {
          // For raw instructions, get programId directly
          programId = instruction.programId?.toString() || 'Unknown'
        }
        
        if (programId !== 'Unknown' && !involvedPrograms.includes(programId)) {
          involvedPrograms.push(programId)
        }
      })
      
      // Determine transaction type with enhanced detection
      let transactionType: TransactionAnalysis['transactionType'] = 'UNKNOWN'
      
      // Check for SOL transfers (System Program)
      if (involvedPrograms.includes('11111111111111111111111111111112')) {
        // Check if this is a simple transfer by looking at instructions
        const hasTransferInstruction = transaction.transaction.message.instructions.some((instruction: any) => {
          if ('parsed' in instruction && instruction.program === 'system' && instruction.parsed?.type === 'transfer') {
            return true
          }
          return false
        })
        if (hasTransferInstruction) {
          transactionType = 'TRANSFER'
        }
      }
      
      // Check for Token transfers (SPL Token Program)
      if (involvedPrograms.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) {
        transactionType = 'TRANSFER'
      }
      
      // Check for DEX swaps (Jupiter and other DEXes)
      if (involvedPrograms.includes('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4') ||
          involvedPrograms.includes('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc') || // Whirlpool
          involvedPrograms.includes('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')) { // Serum DEX
        transactionType = 'SWAP'
      }
      
      // Check for minting operations
      if (transaction.transaction.message.instructions.some((instruction: any) => {
        return 'parsed' in instruction && 
               instruction.program === 'spl-token' && 
               (instruction.parsed?.type === 'mintTo' || instruction.parsed?.type === 'initializeMint')
      })) {
        transactionType = 'MINT'
      }
      
      // Check for burning operations
      if (transaction.transaction.message.instructions.some((instruction: any) => {
        return 'parsed' in instruction && 
               instruction.program === 'spl-token' && 
               instruction.parsed?.type === 'burn'
      })) {
        transactionType = 'BURN'
      }
      
      // If still unknown but has programs, classify as program interaction
      if (transactionType === 'UNKNOWN' && involvedPrograms.length > 1) {
        transactionType = 'PROGRAM_INTERACTION'
      }
      
      // Check for risk factors
      if (transaction.meta?.err) {
        riskFactors.push('Transaction failed')
      }
      
      if (involvedPrograms.some(p => !this.isKnownSafeProgram(p))) {
        riskFactors.push('Interaction with unknown programs')
      }
      
      return {
        signature,
        transactionType,
        involvedPrograms,
        tokenTransfers,
        riskFactors,
        isSuccessful: !transaction.meta?.err
      }
      
    } catch (error) {
      console.error('Transaction analysis failed:', error)
      throw error
    }
  }

  private async getDexScreenerData(tokenAddress: string): Promise<any> {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
        headers: {
          'User-Agent': 'Qognita-Security-Scanner/1.0'
        }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.pairs?.[0] || null
    } catch (error) {
      console.warn('DexScreener API failed:', error)
      return null
    }
  }

  private async getSolscanProgramData(programId: string): Promise<any> {
    try {
      const response = await fetch(`https://pro-api.solscan.io/v2.0/account/${programId}`, {
        headers: {
          'token': this.solscanApiKey,
          'User-Agent': 'Qognita-Security-Scanner/1.0'
        }
      })
      
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.warn('Solscan API failed:', error)
      return null
    }
  }

  private async analyzeTransactionPatterns(tokenAddress: string): Promise<{ suspiciousPatterns: boolean }> {
    // Simplified pattern analysis
    return { suspiciousPatterns: false }
  }

  private async analyzeLiquidity(tokenAddress: string): Promise<{ locked: boolean, ownershipRenounced: boolean }> {
    // Simplified liquidity analysis
    return { locked: false, ownershipRenounced: false }
  }

  private async simulateTrading(tokenAddress: string): Promise<{ canBuy: boolean, canSell: boolean }> {
    // Simplified trading simulation
    return { canBuy: true, canSell: true }
  }

  private isKnownSafeProgram(programId: string): boolean {
    const safePrograms = [
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program
      '11111111111111111111111111111112', // System Program
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', // Whirlpool
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Serum DEX
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
      'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo', // Memo Program
      'ComputeBudget111111111111111111111111111111', // Compute Budget Program
      'AddressLookupTab1e1111111111111111111111111' // Address Lookup Table Program
    ]
    return safePrograms.includes(programId)
  }
}
