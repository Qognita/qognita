import { Risk, RiskSeverity, TrustScore, SecurityAnalysis } from '@/lib/types/security'
import { SolanaAccountInfo, TokenInfo } from '@/lib/types/solana'

export interface AnalysisData {
  address: string
  accountInfo: SolanaAccountInfo
  parsedData?: any
  tokenInfo?: TokenInfo
  transactionHistory?: any[]
}

export class SecurityService {
  private knownScams: Set<string> = new Set()
  private trustedPrograms: Set<string> = new Set()
  private riskPatterns: RegExp[] = []

  constructor() {
    this.loadSecurityData()
  }

  private loadSecurityData() {
    // Known scam addresses (in production, this would be loaded from a database)
    this.knownScams = new Set([
      // Add known scam addresses here
    ])

    // Trusted program IDs
    this.trustedPrograms = new Set([
      '11111111111111111111111111111112', // System Program
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
      'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo', // Solend
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter
    ])

    // Suspicious patterns
    this.riskPatterns = [
      /drain/i,
      /scam/i,
      /fake/i,
      /phishing/i
    ]
  }

  async calculateTrustScore(data: AnalysisData): Promise<TrustScore> {
    const factors = [
      this.assessProgramTrust(data),
      this.assessAccountAge(data),
      this.assessTransactionVolume(data),
      this.assessOwnershipPattern(data),
      this.assessLiquidityFactors(data)
    ]

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)
    const weightedScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
    const finalScore = Math.round(weightedScore / totalWeight)

    return {
      score: Math.max(0, Math.min(100, finalScore)),
      factors
    }
  }

  async analyzeSecurityRisks(data: AnalysisData): Promise<Risk[]> {
    const risks: Risk[] = []

    // Check against known scams
    if (this.knownScams.has(data.address)) {
      risks.push({
        type: 'MALICIOUS_PROGRAM',
        severity: 'CRITICAL',
        description: 'This address is flagged as a known scam or malicious program',
        recommendation: 'Do not interact with this address under any circumstances'
      })
    }

    // Check for drainer patterns
    if (this.detectDrainerPattern(data)) {
      risks.push({
        type: 'DRAINER',
        severity: 'HIGH',
        description: 'This program exhibits patterns similar to token drainers',
        recommendation: 'Avoid approving transactions with this program'
      })
    }

    // Check token-specific risks
    if (data.tokenInfo) {
      risks.push(...this.analyzeTokenRisks(data.tokenInfo))
    }

    // Check program-specific risks
    if (data.accountInfo.executable) {
      risks.push(...this.analyzeProgramRisks(data))
    }

    return risks
  }

  private assessProgramTrust(data: AnalysisData): { name: string; score: number; weight: number; description: string } {
    let score = 50 // Base score

    if (this.trustedPrograms.has(data.accountInfo.owner)) {
      score = 90
    } else if (this.knownScams.has(data.address)) {
      score = 0
    }

    return {
      name: 'Program Trust',
      score,
      weight: 0.3,
      description: 'Assessment based on program reputation and known status'
    }
  }

  private assessAccountAge(data: AnalysisData): { name: string; score: number; weight: number; description: string } {
    // Calculate score based on account age
    let score = 50 // Default for unknown age
    
    if (data.transactionHistory && data.transactionHistory.length > 0) {
      // Get the oldest transaction to estimate account age
      const oldestTx = data.transactionHistory[data.transactionHistory.length - 1]
      if (oldestTx && oldestTx.blockTime) {
        const ageInDays = (Date.now() / 1000 - oldestTx.blockTime) / (24 * 60 * 60)
        
        if (ageInDays > 365) score = 90      // Over 1 year
        else if (ageInDays > 180) score = 80 // Over 6 months
        else if (ageInDays > 90) score = 70  // Over 3 months
        else if (ageInDays > 30) score = 60  // Over 1 month
        else if (ageInDays > 7) score = 50   // Over 1 week
        else score = 30                      // Very new
      }
    }

    return {
      name: 'Account Age',
      score,
      weight: 0.2,
      description: `Account age assessment based on transaction history`
    }
  }

  private assessTransactionVolume(data: AnalysisData): { name: string; score: number; weight: number; description: string } {
    // Assess based on transaction history
    const txCount = data.transactionHistory?.length || 0
    let score = 50

    if (txCount > 1000) score = 80
    else if (txCount > 100) score = 70
    else if (txCount > 10) score = 60
    else if (txCount === 0) score = 30

    return {
      name: 'Transaction Volume',
      score,
      weight: 0.15,
      description: 'Higher transaction volume indicates more established usage'
    }
  }

  private assessOwnershipPattern(data: AnalysisData): { name: string; score: number; weight: number; description: string } {
    let score = 60

    // Check if it's a system account
    if (data.accountInfo.owner === '11111111111111111111111111111112') {
      score = 80
    }

    return {
      name: 'Ownership Pattern',
      score,
      weight: 0.2,
      description: 'Assessment of account ownership and control patterns'
    }
  }

  private assessLiquidityFactors(data: AnalysisData): { name: string; score: number; weight: number; description: string } {
    let score = 60

    // This would assess liquidity-related factors for tokens
    if (data.tokenInfo) {
      // Check if mint authority is renounced
      if (!data.tokenInfo.mintAuthority) {
        score += 20
      }
      
      // Check if freeze authority is renounced
      if (!data.tokenInfo.freezeAuthority) {
        score += 10
      }
    }

    return {
      name: 'Liquidity Factors',
      score: Math.min(100, score),
      weight: 0.15,
      description: 'Assessment of token liquidity and authority controls'
    }
  }

  private detectDrainerPattern(data: AnalysisData): boolean {
    // Check for common drainer patterns
    const address = data.address.toLowerCase()
    
    return this.riskPatterns.some(pattern => pattern.test(address))
  }

  private analyzeTokenRisks(tokenInfo: TokenInfo): Risk[] {
    const risks: Risk[] = []

    // Check mint authority
    if (tokenInfo.mintAuthority) {
      risks.push({
        type: 'MINT_AUTHORITY',
        severity: 'MEDIUM',
        description: 'Token has active mint authority - new tokens can be created',
        recommendation: 'Be aware that the token supply can be increased'
      })
    }

    // Check freeze authority
    if (tokenInfo.freezeAuthority) {
      risks.push({
        type: 'FREEZE_AUTHORITY',
        severity: 'MEDIUM',
        description: 'Token has active freeze authority - accounts can be frozen',
        recommendation: 'Your tokens could potentially be frozen by the authority'
      })
    }

    // Check supply
    const supply = BigInt(tokenInfo.supply)
    if (supply === 0n) {
      risks.push({
        type: 'FAKE_TOKEN',
        severity: 'HIGH',
        description: 'Token has zero supply - this may be a fake or test token',
        recommendation: 'Verify this is a legitimate token before trading'
      })
    }

    return risks
  }

  private analyzeProgramRisks(data: AnalysisData): Risk[] {
    const risks: Risk[] = []

    // Check if program is upgradeable (this would require more detailed analysis)
    if (data.parsedData?.upgradeable) {
      risks.push({
        type: 'MALICIOUS_PROGRAM',
        severity: 'MEDIUM',
        description: 'Program is upgradeable and could be modified',
        recommendation: 'Monitor for program updates that could change behavior'
      })
    }

    return risks
  }

  async checkKnownScams(address: string): Promise<{ isKnownScam: boolean; details?: string }> {
    const isKnownScam = this.knownScams.has(address)
    
    return {
      isKnownScam,
      details: isKnownScam ? 'This address is flagged in our scam database' : undefined
    }
  }

  async generateSecurityAnalysis(data: AnalysisData): Promise<SecurityAnalysis> {
    const trustScore = await this.calculateTrustScore(data)
    const risks = await this.analyzeSecurityRisks(data)

    return {
      address: data.address,
      trustScore: trustScore.score,
      risks,
      analysis: {
        accountType: data.accountInfo.executable ? 'program' : 'account',
        programInfo: data.accountInfo.executable ? {
          programId: data.address,
          upgradeable: data.parsedData?.upgradeable || false,
          upgradeAuthority: data.parsedData?.upgradeAuthority || null,
          dataLength: data.accountInfo.data?.length || 0
        } : undefined,
        tokenInfo: data.tokenInfo ? {
          mint: data.tokenInfo.address,
          supply: data.tokenInfo.supply,
          decimals: data.tokenInfo.decimals,
          mintAuthority: data.tokenInfo.mintAuthority,
          freezeAuthority: data.tokenInfo.freezeAuthority,
          liquidityLocked: false, // Would need to check DEX pools
          topHolders: [] // Would need to fetch holder data
        } : undefined
      },
      timestamp: new Date().toISOString()
    }
  }
}
