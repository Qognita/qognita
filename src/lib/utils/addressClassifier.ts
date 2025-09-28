import { Connection, PublicKey } from '@solana/web3.js'

export type AddressType = 'token' | 'program' | 'wallet' | 'transaction' | 'nft' | 'pda' | 'unknown'

export interface ClassificationResult {
  type: AddressType
  confidence: number
  details: {
    isTransaction: boolean
    isProgram: boolean
    isTokenMint: boolean
    isTokenAccount: boolean
    isWallet: boolean
    isNFT: boolean
    isPDA: boolean
    programType?: string
    tokenInfo?: any
    nftInfo?: any
    pdaInfo?: any
    addressFormat?: 'base58' | 'invalid'
    length?: number
    recognizedPattern?: string
  }
  metadata?: {
    source: string
    timestamp: number
    rpcEndpoint?: string
  }
}

export class AddressClassifier {
  private connection: Connection

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  async classifyAddress(input: string): Promise<ClassificationResult> {
    console.log(`🔍 Enhanced address classification for: ${input}`)
    
    const startTime = Date.now()
    
    // Pre-validation checks
    const preValidation = this.preValidateInput(input)
    if (preValidation.type === 'unknown') {
      return preValidation
    }

    // Enhanced transaction signature detection
    if (this.isTransactionSignature(input)) {
      return {
        type: 'transaction',
        confidence: 1.0,
        details: {
          isTransaction: true,
          isProgram: false,
          isTokenMint: false,
          isTokenAccount: false,
          isWallet: false,
          isNFT: false,
          isPDA: false,
          addressFormat: 'base58',
          length: input.length,
          recognizedPattern: 'Transaction Signature'
        },
        metadata: {
          source: 'AddressClassifier',
          timestamp: Date.now(),
          rpcEndpoint: this.connection.rpcEndpoint
        }
      }
    }

    try {
      const pubkey = new PublicKey(input)
      
      // Check if it's a known program address first (faster)
      const knownProgramType = this.getKnownProgramType(input)
      if (knownProgramType) {
        return {
          type: 'program',
          confidence: 1.0,
          details: {
            isTransaction: false,
            isProgram: true,
            isTokenMint: false,
            isTokenAccount: false,
            isWallet: false,
            isNFT: false,
            isPDA: false,
            programType: knownProgramType,
            addressFormat: 'base58',
            length: input.length,
            recognizedPattern: 'Known Program'
          },
          metadata: {
            source: 'AddressClassifier',
            timestamp: Date.now()
          }
        }
      }

      // Check if it looks like a PDA (common patterns)
      const pdaCheck = this.checkPDAPatterns(input, pubkey)
      if (pdaCheck.isPDA) {
        return {
          type: 'pda',
          confidence: pdaCheck.confidence,
          details: {
            isTransaction: false,
            isProgram: false,
            isTokenMint: false,
            isTokenAccount: false,
            isWallet: false,
            isNFT: false,
            isPDA: true,
            addressFormat: 'base58',
            length: input.length,
            recognizedPattern: pdaCheck.pattern,
            pdaInfo: pdaCheck.info
          },
          metadata: {
            source: 'AddressClassifier',
            timestamp: Date.now()
          }
        }
      }

      // Fetch account info for detailed analysis
      const accountInfo = await this.connection.getAccountInfo(pubkey)

      if (!accountInfo) {
        // Account doesn't exist - could be unused wallet or PDA
        const confidence = this.isPotentialPDA(input) ? 0.6 : 0.7
        return {
          type: 'wallet',
          confidence,
          details: {
            isTransaction: false,
            isProgram: false,
            isTokenMint: false,
            isTokenAccount: false,
            isWallet: true,
            isNFT: false,
            isPDA: false,
            addressFormat: 'base58',
            length: input.length,
            recognizedPattern: 'Unused Account'
          },
          metadata: {
            source: 'AddressClassifier',
            timestamp: Date.now(),
            rpcEndpoint: this.connection.rpcEndpoint
          }
        }
      }

      // Enhanced program detection
      if (accountInfo.executable) {
        const programType = this.identifyProgramType(input, accountInfo)
        return {
          type: 'program',
          confidence: 1.0,
          details: {
            isTransaction: false,
            isProgram: true,
            isTokenMint: false,
            isTokenAccount: false,
            isWallet: false,
            isNFT: false,
            isPDA: false,
            programType,
            addressFormat: 'base58',
            length: input.length,
            recognizedPattern: 'Executable Program'
          },
          metadata: {
            source: 'AddressClassifier',
            timestamp: Date.now(),
            rpcEndpoint: this.connection.rpcEndpoint
          }
        }
      }

      // Enhanced token detection
      if (accountInfo.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        if (accountInfo.data.length === 82) {
          // Token mint - check if it's an NFT
          const nftCheck = await this.checkIfNFT(pubkey, accountInfo)
          
          return {
            type: nftCheck.isNFT ? 'nft' : 'token',
            confidence: 1.0,
            details: {
              isTransaction: false,
              isProgram: false,
              isTokenMint: true,
              isTokenAccount: false,
              isWallet: false,
              isNFT: nftCheck.isNFT,
              isPDA: false,
              addressFormat: 'base58',
              length: input.length,
              recognizedPattern: nftCheck.isNFT ? 'NFT Mint' : 'Token Mint',
              tokenInfo: nftCheck.tokenInfo,
              nftInfo: nftCheck.nftInfo
            },
            metadata: {
              source: 'AddressClassifier',
              timestamp: Date.now(),
              rpcEndpoint: this.connection.rpcEndpoint
            }
          }
        } else if (accountInfo.data.length === 165) {
          // Token account
          return {
            type: 'wallet',
            confidence: 0.8,
            details: {
              isTransaction: false,
              isProgram: false,
              isTokenMint: false,
              isTokenAccount: true,
              isWallet: false,
              isNFT: false,
              isPDA: false,
              addressFormat: 'base58',
              length: input.length,
              recognizedPattern: 'Token Account'
            },
            metadata: {
              source: 'AddressClassifier',
              timestamp: Date.now(),
              rpcEndpoint: this.connection.rpcEndpoint
            }
          }
        }
      }

      // Check for other known program-owned accounts
      const ownerProgram = this.identifyOwnerProgram(accountInfo.owner.toString())
      if (ownerProgram) {
        return {
          type: 'pda',
          confidence: 0.9,
          details: {
            isTransaction: false,
            isProgram: false,
            isTokenMint: false,
            isTokenAccount: false,
            isWallet: false,
            isNFT: false,
            isPDA: true,
            addressFormat: 'base58',
            length: input.length,
            recognizedPattern: `${ownerProgram} Account`,
            pdaInfo: {
              ownerProgram,
              dataLength: accountInfo.data.length
            }
          },
          metadata: {
            source: 'AddressClassifier',
            timestamp: Date.now(),
            rpcEndpoint: this.connection.rpcEndpoint
          }
        }
      }

      // Default to wallet
      return {
        type: 'wallet',
        confidence: 0.6,
        details: {
          isTransaction: false,
          isProgram: false,
          isTokenMint: false,
          isTokenAccount: false,
          isWallet: true,
          isNFT: false,
          isPDA: false,
          addressFormat: 'base58',
          length: input.length,
          recognizedPattern: 'System Account'
        },
        metadata: {
          source: 'AddressClassifier',
          timestamp: Date.now(),
          rpcEndpoint: this.connection.rpcEndpoint
        }
      }

    } catch (error) {
      console.error('Enhanced classification failed:', error)
      return {
        type: 'unknown',
        confidence: 0.0,
        details: {
          isTransaction: false,
          isProgram: false,
          isTokenMint: false,
          isTokenAccount: false,
          isWallet: false,
          isNFT: false,
          isPDA: false,
          addressFormat: 'invalid',
          length: input.length,
          recognizedPattern: 'Invalid Address'
        },
        metadata: {
          source: 'AddressClassifier',
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * Pre-validate input format and basic patterns
   */
  private preValidateInput(input: string): ClassificationResult {
    // Check for empty or invalid input
    if (!input || input.trim().length === 0) {
      return {
        type: 'unknown',
        confidence: 0.0,
        details: {
          isTransaction: false,
          isProgram: false,
          isTokenMint: false,
          isTokenAccount: false,
          isWallet: false,
          isNFT: false,
          isPDA: false,
          addressFormat: 'invalid',
          length: input.length,
          recognizedPattern: 'Empty Input'
        }
      }
    }

    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    if (!base58Regex.test(input)) {
      return {
        type: 'unknown',
        confidence: 0.0,
        details: {
          isTransaction: false,
          isProgram: false,
          isTokenMint: false,
          isTokenAccount: false,
          isWallet: false,
          isNFT: false,
          isPDA: false,
          addressFormat: 'invalid',
          length: input.length,
          recognizedPattern: 'Invalid Base58'
        }
      }
    }

    // Valid input, continue with classification
    return { type: 'unknown', confidence: 0, details: {} as any }
  }

  /**
   * Enhanced transaction signature detection
   */
  private isTransactionSignature(input: string): boolean {
    // Transaction signatures are typically 87-88 characters long
    if (input.length < 87 || input.length > 88) {
      return false
    }

    // Additional pattern checks for transaction signatures
    // They often start with certain patterns
    const txPatterns = [
      /^[1-9A-HJ-NP-Za-km-z]{87,88}$/,  // Standard base58
      /^[2-9A-HJ-NP-Za-km-z]/,          // Often start with 2-9
    ]

    return txPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Get known program type without RPC call
   */
  private getKnownProgramType(address: string): string | null {
    const knownPrograms: Record<string, string> = {
      // Core Solana Programs
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token Program',
      '11111111111111111111111111111112': 'System Program',
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token-2022 Program',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
      'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo': 'Memo Program',
      'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr': 'Memo Program v2',
      
      // DEX Programs
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter Aggregator v6',
      'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB': 'Jupiter Aggregator v4',
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Raydium AMM v4',
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpool',
      'CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR': 'Raydium CLMM',
      'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CAMM',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM v3',
      
      // NFT Programs
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Token Metadata',
      'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98': 'Metaplex Token Metadata v2',
      'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ': 'Candy Machine v2',
      'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR': 'Candy Machine v3',
      
      // Lending Programs
      'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo': 'Solend',
      'LendZqTs8gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi': 'Port Finance',
      'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD': 'MarginFi',
      
      // Staking Programs
      'Stake11111111111111111111111111111111111112': 'Stake Program',
      'Vote111111111111111111111111111111111111111': 'Vote Program',
      
      // Other Popular Programs
      'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX': 'Solana Name Service',
      'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f': 'Switchboard',
      'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1': 'Orca',
      'PhoeNiX1VVuPn7QnvLPzewrhHureq4oAh7QTBPhZMZg': 'Phoenix',
    }

    return knownPrograms[address] || null
  }

  /**
   * Check for common PDA patterns
   */
  private checkPDAPatterns(address: string, pubkey: PublicKey): { isPDA: boolean, confidence: number, pattern?: string, info?: any } {
    // PDAs often have specific patterns or are derived from known seeds
    
    // Check if it's on the ed25519 curve (PDAs are not)
    try {
      // This is a heuristic - PDAs are designed to be off-curve
      // We can't easily check this without the seeds, but we can look for patterns
      
      // Common PDA patterns
      const pdaPatterns = [
        { pattern: /^[A-Z][a-z0-9]{10,}/, name: 'Capitalized Pattern', confidence: 0.3 },
        { pattern: /metadata/, name: 'Metadata Account', confidence: 0.8 },
        { pattern: /vault/, name: 'Vault Account', confidence: 0.7 },
        { pattern: /pool/, name: 'Pool Account', confidence: 0.6 },
      ]

      for (const { pattern, name, confidence } of pdaPatterns) {
        if (pattern.test(address.toLowerCase())) {
          return {
            isPDA: true,
            confidence,
            pattern: name,
            info: { detectedPattern: name }
          }
        }
      }

      return { isPDA: false, confidence: 0 }
    } catch {
      return { isPDA: false, confidence: 0 }
    }
  }

  /**
   * Check if address might be a PDA based on patterns
   */
  private isPotentialPDA(address: string): boolean {
    // Simple heuristics for PDA detection
    const pdaIndicators = [
      address.includes('metadata'),
      address.includes('vault'),
      address.includes('pool'),
      address.length === 44 && /^[A-Z]/.test(address), // Often start with capital
    ]

    return pdaIndicators.some(indicator => indicator)
  }

  /**
   * Check if a token mint is an NFT
   */
  private async checkIfNFT(pubkey: PublicKey, accountInfo: any): Promise<{ isNFT: boolean, tokenInfo?: any, nftInfo?: any }> {
    try {
      // Parse token mint data to check supply and decimals
      const data = accountInfo.data
      
      // Token mint structure: supply (8 bytes at offset 36), decimals (1 byte at offset 44)
      const supply = data.readBigUInt64LE(36)
      const decimals = data[44]
      
      // NFTs typically have supply of 1 and 0 decimals
      const isNFT = supply === 1n && decimals === 0
      
      const tokenInfo = {
        supply: supply.toString(),
        decimals,
        isNFT
      }

      let nftInfo = null
      if (isNFT) {
        nftInfo = {
          supply: '1',
          decimals: 0,
          type: 'Non-Fungible Token'
        }
      }

      return { isNFT, tokenInfo, nftInfo }
    } catch (error) {
      console.warn('Failed to check NFT status:', error)
      return { isNFT: false }
    }
  }

  /**
   * Identify owner program for program-owned accounts
   */
  private identifyOwnerProgram(ownerAddress: string): string | null {
    const ownerPrograms: Record<string, string> = {
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token',
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex',
      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca',
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Raydium',
      'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo': 'Solend',
      'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Loader',
      'BPFLoader2111111111111111111111111111111111': 'BPF Loader v2',
    }

    return ownerPrograms[ownerAddress] || null
  }

  /**
   * Enhanced program type identification
   */
  private identifyProgramType(programId: string, accountInfo: any): string {
    // First check known programs
    const knownType = this.getKnownProgramType(programId)
    if (knownType) {
      return knownType
    }

    // Check program loader type
    const owner = accountInfo.owner.toString()
    if (owner === 'BPFLoaderUpgradeab1e11111111111111111111111') {
      return 'Upgradeable BPF Program'
    }
    if (owner === 'BPFLoader2111111111111111111111111111111111') {
      return 'BPF Program v2'
    }
    if (owner === 'BPFLoader1111111111111111111111111111111111') {
      return 'BPF Program v1'
    }

    return 'Custom Program'
  }
}
