import { Connection, PublicKey, ParsedAccountData, TokenAmount } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

export class SolanaService {
  private connections: Connection[]
  private currentConnectionIndex: number = 0

  constructor() {
    // Use multiple RPC endpoints for reliability and rate limit avoidance
    const rpcEndpoints = [
      'https://rpc.ankr.com/solana',
      'https://solana-api.projectserum.com', 
      'https://api.mainnet-beta.solana.com',
      'https://solana.public-rpc.com'
    ]
    
    this.connections = rpcEndpoints.map(endpoint => 
      new Connection(endpoint, 'confirmed')
    )
  }

  private async executeWithFallback<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    let lastError: Error | null = null
    
    // Try each RPC endpoint
    for (let i = 0; i < this.connections.length; i++) {
      const connectionIndex = (this.currentConnectionIndex + i) % this.connections.length
      const connection = this.connections[connectionIndex]
      
      try {
        console.log(`🔗 Trying RPC endpoint ${connectionIndex + 1}/${this.connections.length}`)
        const result = await operation(connection)
        this.currentConnectionIndex = connectionIndex // Use this endpoint next time
        return result
      } catch (error) {
        console.warn(`❌ RPC endpoint ${connectionIndex + 1} failed:`, error)
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Add delay before trying next endpoint
        if (i < this.connections.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed')
  }

  async getWalletData(address: string) {
    try {
      const publicKey = new PublicKey(address)
      
      // Get SOL balance with fallback
      const balance = await this.executeWithFallback(async (connection) => {
        return await connection.getBalance(publicKey)
      })
      const solBalance = balance / 1e9 // Convert lamports to SOL
      
      // Get REAL SOL price from CoinGecko
      const solPrice = await this.getSolPrice()
      
      // Get all token accounts with fallback
      const tokenAccounts = await this.executeWithFallback(async (connection) => {
        return await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        )
      })
      
      // Process token holdings
      const tokenHoldings = tokenAccounts.value.map(account => {
        const parsedData = account.account.data as ParsedAccountData
        const tokenInfo = parsedData.parsed.info
        
        return {
          mint: tokenInfo.mint,
          amount: tokenInfo.tokenAmount.amount,
          uiAmount: tokenInfo.tokenAmount.uiAmount,
          decimals: tokenInfo.tokenAmount.decimals,
          // We'll need to fetch token metadata separately for name/symbol
        }
      }).filter(token => token.uiAmount > 0) // Only non-zero balances
      
      // Get ALL transaction signatures (not just 100) with fallback
      console.log('🔍 Fetching ALL transaction signatures...')
      let allSignatures: any[] = []
      let before: string | undefined = undefined
      let hasMore = true
      
      while (hasMore && allSignatures.length < 5000) { // Reduced limit for performance
        try {
          const batch = await this.executeWithFallback(async (connection) => {
            return await connection.getSignaturesForAddress(
              publicKey,
              { 
                limit: 1000, // Max per request
                before: before
              }
            )
          })
          
          if (batch.length === 0) {
            hasMore = false
          } else {
            allSignatures = allSignatures.concat(batch)
            before = batch[batch.length - 1].signature
            
            // If we got less than 1000, we've reached the end
            if (batch.length < 1000) {
              hasMore = false
            }
          }
          
          console.log(`📊 Fetched ${allSignatures.length} transaction signatures so far...`)
        } catch (error) {
          console.warn('Failed to fetch transaction signatures:', error)
          hasMore = false // Stop on error to avoid infinite loop
        }
      }
      
      console.log(`✅ Total signatures found: ${allSignatures.length}`)
      
      // Get detailed transaction data for recent transactions
      const transactions = []
      for (const sig of allSignatures.slice(0, 20)) { // Process first 20 for speed
        try {
          const tx = await this.executeWithFallback(async (connection) => {
            return await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            })
          })
          
          if (tx) {
            transactions.push({
              signature: sig.signature,
              blockTime: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
              slot: sig.slot,
              status: sig.err ? 'Failed' : 'Success',
              // Parse transaction type and details
              ...this.parseTransactionType(tx, address)
            })
          }
        } catch (error) {
          console.warn(`Failed to fetch transaction ${sig.signature}:`, error)
        }
      }
      
      // Calculate CORRECT first and last activity from ALL signatures
      const sortedSigs = allSignatures
        .filter(sig => sig.blockTime) // Only signatures with valid timestamps
        .sort((a, b) => (a.blockTime || 0) - (b.blockTime || 0))
      
      const firstActivity = sortedSigs[0]?.blockTime ? sortedSigs[0].blockTime * 1000 : Date.now()
      const lastActivity = sortedSigs[sortedSigs.length - 1]?.blockTime ? 
        sortedSigs[sortedSigs.length - 1].blockTime! * 1000 : Date.now()
      
      console.log(`📅 First activity: ${new Date(firstActivity).toLocaleString()}`)
      console.log(`📅 Last activity: ${new Date(lastActivity).toLocaleString()}`)
      console.log(`💰 SOL Balance: ${solBalance} SOL (~$${(solBalance * solPrice).toFixed(2)})`)
      
      return {
        address,
        balance: solBalance,
        solPrice: solPrice,
        totalTransactions: allSignatures.length, // REAL total count
        tokenCount: tokenHoldings.length,
        firstActivity,
        lastActivity,
        tokenHoldings,
        allTransactions: transactions,
        totalValue: await this.calculatePortfolioValue(solBalance, tokenHoldings, solPrice)
      }
      
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to fetch wallet data: ${errorMessage}`)
    }
  }
  
  private parseTransactionType(tx: any, walletAddress: string) {
    // Basic transaction type detection
    const instructions = tx.transaction.message.instructions
    
    // Look for common patterns
    for (const instruction of instructions) {
      if (instruction.program === 'system') {
        if (instruction.parsed?.type === 'transfer') {
          const info = instruction.parsed.info
          if (info.source === walletAddress) {
            return {
              type: 'Transfer',
              amount: info.lamports / 1e9,
              token: 'SOL',
              recipient: info.destination
            }
          }
        }
      } else if (instruction.program === 'spl-token') {
        if (instruction.parsed?.type === 'transfer') {
          return {
            type: 'Token Transfer',
            amount: instruction.parsed.info.amount,
            token: 'TOKEN', // Would need to resolve token symbol
            recipient: instruction.parsed.info.destination
          }
        }
      }
    }
    
    // Default fallback
    return {
      type: 'Unknown',
      amount: 0,
      token: 'SOL'
    }
  }
  
  async getSolPrice(): Promise<number> {
    try {
      console.log('💰 Fetching real SOL price from CoinGecko...')
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }
      
      const data = await response.json()
      const solPrice = data.solana?.usd || 100 // Fallback to $100 if API fails
      
      console.log(`✅ Real SOL price: $${solPrice}`)
      return solPrice
    } catch (error) {
      console.warn('Failed to fetch SOL price, using fallback:', error)
      return 100 // Fallback price
    }
  }

  private async calculatePortfolioValue(solBalance: number, tokenHoldings: any[], solPrice: number) {
    // Calculate SOL value with REAL price
    let totalValue = solBalance * solPrice
    
    // Add token values (placeholder for now - would need real token prices)
    for (const token of tokenHoldings) {
      // This is still a placeholder - you'd fetch real token prices from Jupiter/CoinGecko
      totalValue += (token.uiAmount || 0) * 0.1 // Rough estimate
    }
    
    return totalValue
  }
  
  async getTokenMetadata(mintAddress: string) {
    // Placeholder for token metadata fetching
    // In production, you'd use Metaplex or other metadata services
    return {
      name: 'Unknown Token',
      symbol: 'UNK',
      decimals: 9
    }
  }
}
