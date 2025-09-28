export interface AnalyzeRequest {
  address: string
  type?: 'wallet' | 'program' | 'token' | 'transaction'
}

export interface AnalyzeResponse {
  address: string
  trustScore: number
  risks: Risk[]
  parsedData: any
  tokenInfo?: any
  recentTransactions?: any[]
  holderAnalysis?: {
    totalHolders: number
    topHolders: Array<{
      address: string
      amount: string
      uiAmount: number
      percentage: number
      rank: number
    }>
    distribution: {
      top10Percentage: number
      top50Percentage: number
    }
  }
  technicalDetails?: any
  report: string
  timestamp: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  context?: any
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ParseRequest {
  data: string
  programId: string
}

export interface ParseResponse {
  parsed: {
    accountType: string
    fields: Record<string, any>
  }
}

export interface ApiError {
  error: string
  code?: string
  details?: any
}

export interface Risk {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  recommendation?: string
}
