import { Connection, PublicKey, AccountInfo, ParsedTransactionWithMeta } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAccount, getMint } from '@solana/spl-token'
import { SolanaAccountInfo, ParsedTransaction, TokenAccountInfo, TokenInfo, AddressType } from '@/lib/types/solana'

export class SolanaService {
  private connection: Connection

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  async getAccountInfo(address: string): Promise<SolanaAccountInfo | null> {
    try {
      const pubkey = new PublicKey(address)
      const accountInfo = await this.connection.getAccountInfo(pubkey)
      
      if (!accountInfo) return null

      return {
        address,
        lamports: accountInfo.lamports,
        owner: accountInfo.owner.toString(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch || 0,
        data: accountInfo.data
      }
    } catch (error) {
      console.error('Error fetching account info:', error)
      return null
    }
  }

  async getTransaction(signature: string): Promise<ParsedTransaction | null> {
    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      })
      
      if (!tx) return null

      return {
        signature,
        slot: tx.slot,
        blockTime: tx.blockTime ?? null,
        instructions: tx.transaction.message.instructions.map((ix: any) => ({
          programId: ix.programId.toString(),
          accounts: ix.accounts?.map((acc: any) => acc.toString()) || [],
          data: 'data' in ix ? ix.data : '',
          parsed: 'parsed' in ix ? ix.parsed : undefined
        })),
        accounts: tx.transaction.message.accountKeys.map((key: any) => key.pubkey.toString()),
        fee: tx.meta?.fee || 0,
        status: tx.meta?.err ? 'failed' : 'success'
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return null
    }
  }

  async getTokenAccountInfo(address: string): Promise<TokenAccountInfo | null> {
    try {
      const pubkey = new PublicKey(address)
      const accountInfo = await getAccount(this.connection, pubkey)
      
      return {
        mint: accountInfo.mint.toString(),
        owner: accountInfo.owner.toString(),
        amount: accountInfo.amount.toString(),
        decimals: 0, // Will be filled by getMint
        uiAmount: 0, // Will be calculated
        state: accountInfo.isFrozen ? 'frozen' : 'initialized'
      }
    } catch (error) {
      console.error('Error fetching token account info:', error)
      return null
    }
  }

  async getTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
    try {
      const mintPublicKey = new PublicKey(mintAddress)
      const mintInfo = await getMint(this.connection, mintPublicKey)
      
      // Try to get token metadata
      let metadata = null
      try {
        metadata = await this.getTokenMetadata(mintAddress)
      } catch (error) {
        console.warn('Could not fetch token metadata:', error)
      }
      
      return {
        address: mintAddress,
        supply: mintInfo.supply.toString(),
        decimals: mintInfo.decimals,
        mintAuthority: mintInfo.mintAuthority?.toString() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
        isInitialized: mintInfo.isInitialized,
        name: metadata?.name || null,
        symbol: metadata?.symbol || null,
        image: metadata?.image || null,
        description: metadata?.description || null
      }
    } catch (error) {
      console.error('Error fetching token info:', error)
      return null
    }
  }

  async getTokenMetadata(mintAddress: string): Promise<any> {
    try {
      // First check well-known tokens
      const knownTokens: Record<string, any> = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
          name: 'USD Coin',
          symbol: 'USDC',
          image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
          description: 'USD Coin (USDC) is a fully collateralized US dollar stablecoin'
        },
        'So11111111111111111111111111111111111111112': {
          name: 'Wrapped SOL',
          symbol: 'SOL',
          image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          description: 'Wrapped Solana'
        },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
          name: 'Tether USD',
          symbol: 'USDT',
          image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
          description: 'Tether USD (USDT) stablecoin'
        },
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': {
          name: 'Jupiter',
          symbol: 'JUP',
          image: 'https://static.jup.ag/jup/icon.png',
          description: 'Jupiter Exchange Token'
        }
      }

      if (knownTokens[mintAddress]) {
        return knownTokens[mintAddress]
      }

      // Try external APIs with timeout
      const fetchWithTimeout = async (url: string, timeout = 5000) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        try {
          const response = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      }

      // 1. Try DexScreener (best for new tokens)
      try {
        const dexResponse = await fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`)
        if (dexResponse.ok) {
          const dexData = await dexResponse.json()
          if (dexData.pairs?.[0]) {
            const pair = dexData.pairs[0]
            return {
              name: pair.baseToken.name,
              symbol: pair.baseToken.symbol,
              image: pair.info?.imageUrl,
              description: `${pair.baseToken.name} trading pair`,
              marketData: {
                price: pair.priceUsd,
                volume24h: pair.volume?.h24,
                marketCap: pair.marketCap
              }
            }
          }
        }
      } catch (error) {
        console.warn('DexScreener failed:', error)
      }

      // 2. Try Jupiter (all tokens)
      try {
        const jupiterResponse = await fetchWithTimeout('https://token.jup.ag/all')
        if (jupiterResponse.ok) {
          const jupiterTokens = await jupiterResponse.json()
          const token = jupiterTokens.find((t: any) => t.address === mintAddress)
          if (token) {
            return {
              name: token.name,
              symbol: token.symbol,
              image: token.logoURI,
              description: token.name
            }
          }
        }
      } catch (error) {
        console.warn('Jupiter API failed:', error)
      }

      // 2. Try Solana Token List as fallback
      try {
        const tokenListResponse = await fetchWithTimeout('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')
        if (tokenListResponse.ok) {
          const tokenList = await tokenListResponse.json()
          const token = tokenList.tokens.find((t: any) => t.address === mintAddress)
          if (token) {
            return {
              name: token.name,
              symbol: token.symbol,
              image: token.logoURI,
              description: token.name
            }
          }
        }
      } catch (error) {
        console.warn('Solana token list failed:', error)
      }
      
      return null
    } catch (error) {
      console.warn('Error fetching token metadata:', error)
      return null
    }
  }

  validateAddress(address: string): boolean {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }

  validateTransactionSignature(signature: string): boolean {
    // Solana transaction signatures are base58 encoded and typically 87-88 characters
    if (!signature || signature.length < 87 || signature.length > 88) return false
    
    // Check if it contains only valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    return base58Regex.test(signature)
  }


  async detectAddressType(address: string): Promise<AddressType> {
    try {
      const accountInfo = await this.getAccountInfo(address)
      if (!accountInfo) return 'unknown'

      // Check if it's a program (executable)
      if (accountInfo.executable) return 'program'

      // Check if it's a token account (owned by token program)
      if (accountInfo.owner === TOKEN_PROGRAM_ID.toString()) {
        return 'token'
      }

      // Check if it's a system account (wallet)
      if (accountInfo.owner === '11111111111111111111111111111112') {
        return 'wallet'
      }

      // Try to see if it's a token mint by attempting to get mint info
      try {
        const mintInfo = await this.getTokenInfo(address)
        if (mintInfo) {
          return 'token' // It's a token mint
        }
      } catch (error) {
        // Not a mint, continue
      }

      return 'unknown'
    } catch (error) {
      console.error('Error detecting address type:', error)
      return 'unknown'
    }
  }

  async getRecentTransactions(address: string, limit: number = 10): Promise<ParsedTransaction[]> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(address),
        { limit }
      )
      
      const transactions: ParsedTransaction[] = []
      
      for (const sigInfo of signatures) {
        try {
          const tx = await this.connection.getTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0
          })
          
          if (tx && tx.meta) {
            transactions.push({
              signature: sigInfo.signature,
              slot: sigInfo.slot,
              blockTime: sigInfo.blockTime || null,
              instructions: tx.transaction.message.compiledInstructions.map(ix => ({
                programId: tx.transaction.message.staticAccountKeys[ix.programIdIndex].toString(),
                accounts: ix.accountKeyIndexes.map(idx => 
                  tx.transaction.message.staticAccountKeys[idx].toString()
                ),
                data: Buffer.from(ix.data).toString('base64'),
                parsed: null
              })),
              accounts: tx.transaction.message.staticAccountKeys.map(key => key.toString()),
              fee: tx.meta.fee,
              status: tx.meta.err ? 'failed' : 'success'
            })
          }
        } catch (txError) {
          console.warn(`Failed to fetch transaction ${sigInfo.signature}:`, txError)
        }
      }
      
      return transactions
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      return []
    }
  }

  async getTokenHolders(mintAddress: string, limit: number = 100): Promise<Array<{address: string, amount: string, percentage: number}>> {
    try {
      const mintPublicKey = new PublicKey(mintAddress)
      
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: mintAddress } }
          ]
        }
      )
      
      // Get mint info to calculate percentages
      const mintInfo = await getMint(this.connection, mintPublicKey)
      const totalSupply = Number(mintInfo.supply)
      
      const holders = []
      
      for (const account of tokenAccounts) {
        try {
          const accountInfo = await getAccount(this.connection, account.pubkey)
          const amount = Number(accountInfo.amount)
          
          if (amount > 0) {
            holders.push({
              address: accountInfo.owner.toString(),
              amount: amount.toString(),
              percentage: totalSupply > 0 ? (amount / totalSupply) * 100 : 0
            })
          }
        } catch (error) {
          console.warn(`Failed to get account info for ${account.pubkey.toString()}:`, error)
        }
      }
      
      // Sort by amount (descending) and limit results
      return holders
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, limit)
        
    } catch (error) {
      console.error('Error fetching token holders:', error)
      return []
    }
  }

  async getAccountCreationTime(address: string): Promise<number | null> {
    try {
      // Get the first transaction for this account to estimate creation time
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(address),
        { limit: 1000 } // Get more to find the earliest
      )
      
      if (signatures.length === 0) return null
      
      // The last signature in the array is the oldest
      const oldestSignature = signatures[signatures.length - 1]
      return oldestSignature.blockTime || null
      
    } catch (error) {
      console.error('Error fetching account creation time:', error)
      return null
    }
  }

  async getDetailedTransactionHistory(address: string, limit: number = 10): Promise<any[]> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(address),
        { limit }
      )
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            })
            
            if (!tx) return null
            
            return {
              signature: sig.signature,
              slot: tx.slot,
              blockTime: tx.blockTime,
              fee: tx.meta?.fee || 0,
              status: tx.meta?.err ? 'failed' : 'success',
              instructions: tx.transaction.message.instructions.length,
              accounts: tx.transaction.message.accountKeys.length,
              logMessages: tx.meta?.logMessages || [],
              preBalances: tx.meta?.preBalances || [],
              postBalances: tx.meta?.postBalances || []
            }
          } catch (error) {
            console.error(`Error fetching transaction ${sig.signature}:`, error)
            return null
          }
        })
      )
      
      return transactions.filter(tx => tx !== null)
    } catch (error) {
      console.error('Error fetching detailed transaction history:', error)
      return []
    }
  }

  async getWalletBalance(address: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(address))
      return balance / 1e9 // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      return 0
    }
  }

  async getTokenBalances(address: string): Promise<any[]> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(address),
        { programId: TOKEN_PROGRAM_ID }
      )
      
      return tokenAccounts.value.map(account => ({
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
        address: account.pubkey.toString()
      }))
    } catch (error) {
      console.error('Error fetching token balances:', error)
      return []
    }
  }

  async analyzeTransactionFlow(signature: string): Promise<any> {
    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      })
      
      if (!tx) return null
      
      const accountKeys = tx.transaction.message.accountKeys
      const preBalances = tx.meta?.preBalances || []
      const postBalances = tx.meta?.postBalances || []
      
      const balanceChanges = accountKeys.map((account, index) => ({
        address: account.pubkey.toString(),
        preBalance: preBalances[index] || 0,
        postBalance: postBalances[index] || 0,
        change: (postBalances[index] || 0) - (preBalances[index] || 0)
      })).filter(change => change.change !== 0)
      
      const sender = balanceChanges.find(change => change.change < 0)
      const receivers = balanceChanges.filter(change => change.change > 0)
      
      return {
        signature,
        sender: sender ? {
          address: sender.address,
          amount: Math.abs(sender.change) / 1e9
        } : null,
        receivers: receivers.map(receiver => ({
          address: receiver.address,
          amount: receiver.change / 1e9
        })),
        fee: (tx.meta?.fee || 0) / 1e9,
        status: tx.meta?.err ? 'failed' : 'success',
        blockTime: tx.blockTime
      }
    } catch (error) {
      console.error('Error analyzing transaction flow:', error)
      return null
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address)
      return await this.connection.getBalance(pubkey)
    } catch (error) {
      console.error('Error fetching balance:', error)
      return 0
    }
  }
}
