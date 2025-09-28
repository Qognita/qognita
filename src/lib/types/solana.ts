export interface SolanaAccountInfo {
  address: string
  lamports: number
  owner: string
  executable: boolean
  rentEpoch: number
  data: Buffer | null
}

export interface ParsedTransaction {
  signature: string
  slot: number
  blockTime: number | null
  instructions: TransactionInstruction[]
  accounts: string[]
  fee: number
  status: 'success' | 'failed'
}

export interface TransactionInstruction {
  programId: string
  accounts: string[]
  data: string
  parsed?: any
}

export interface TokenAccountInfo {
  mint: string
  owner: string
  amount: string
  decimals: number
  uiAmount: number
  state: 'initialized' | 'uninitialized' | 'frozen'
}

export interface TokenInfo {
  address: string
  name: string | null
  symbol: string | null
  decimals: number
  supply: string
  mintAuthority: string | null
  freezeAuthority: string | null
  isInitialized: boolean
  image: string | null
  description: string | null
}

export type AddressType = 'wallet' | 'program' | 'token' | 'unknown'
