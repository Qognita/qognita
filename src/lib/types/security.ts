export interface SecurityAnalysis {
  address: string
  trustScore: number
  risks: Risk[]
  analysis: AnalysisResult
  timestamp: string
}

export interface Risk {
  type: RiskType
  severity: RiskSeverity
  description: string
  recommendation?: string
}

export type RiskType = 
  | 'DRAINER'
  | 'RUG_PULL'
  | 'HONEYPOT'
  | 'FAKE_TOKEN'
  | 'MALICIOUS_PROGRAM'
  | 'LOW_LIQUIDITY'
  | 'UNUSUAL_TRANSFER'
  | 'MINT_AUTHORITY'
  | 'FREEZE_AUTHORITY'
  | 'OWNERSHIP_CONCENTRATION'
  | 'UNKNOWN_PROGRAM'

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AnalysisResult {
  accountType: string
  programInfo?: ProgramInfo
  tokenInfo?: TokenSecurityInfo
  transactionInfo?: TransactionSecurityInfo
}

export interface ProgramInfo {
  programId: string
  upgradeable: boolean
  upgradeAuthority: string | null
  dataLength: number
  codeHash?: string
}

export interface TokenSecurityInfo {
  mint: string
  supply: string
  decimals: number
  mintAuthority: string | null
  freezeAuthority: string | null
  liquidityLocked: boolean
  topHolders: TokenHolder[]
  tradingVolume24h?: number
}

export interface TokenHolder {
  address: string
  amount: string
  percentage: number
}

export interface TransactionSecurityInfo {
  signature: string
  instructions: number
  accounts: number
  fee: number
  suspiciousPatterns: string[]
}

export interface TrustScore {
  score: number
  factors: TrustFactor[]
}

export interface TrustFactor {
  name: string
  score: number
  weight: number
  description: string
}
