import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

/**
 * Clean, AI-callable functions for Solana data fetching
 * These are the "tools" that the AI can use to answer specific questions
 */

// Multiple RPC endpoints for reliability
const RPC_ENDPOINTS = [
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com',
  'https://api.mainnet-beta.solana.com',
  'https://solana.public-rpc.com'
]

let currentRpcIndex = 0

async function getConnection(): Promise<Connection> {
  return new Connection(RPC_ENDPOINTS[currentRpcIndex % RPC_ENDPOINTS.length], 'confirmed')
}

async function executeWithFallback<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const connection = new Connection(RPC_ENDPOINTS[(currentRpcIndex + i) % RPC_ENDPOINTS.length], 'confirmed')
    
    try {
      const result = await operation(connection)
      currentRpcIndex = (currentRpcIndex + i) % RPC_ENDPOINTS.length
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`RPC endpoint ${i + 1} failed:`, error)
      
      if (i < RPC_ENDPOINTS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
  
  throw lastError || new Error('All RPC endpoints failed')
}

export interface Transaction {
  signature: string
  blockTime: number | null
  slot: number
  status: 'Success' | 'Failed'
  type: string
  amount?: number
  recipient?: string
  sender?: string
  fee: number
}

export interface DetailedTransaction {
  signature: string
  blockTime: number | null
  slot: number
  status: 'Success' | 'Failed'
  fee: number
  instructions: Array<{
    program: string
    type: string
    data?: any
  }>
  accounts: Array<{
    address: string
    role: 'signer' | 'writable' | 'readonly'
    preBalance: number
    postBalance: number
    balanceChange: number
  }>
  transfers: Array<{
    from: string
    to: string
    amount: number
    token?: string
  }>
}

export interface TokenHolding {
  mint: string
  amount: string
  uiAmount: number
  decimals: number
  symbol?: string
  name?: string
}

/**
 * Fetches the entire transaction history for a given Solana address.
 * This is a core "tool" that AI can use to answer questions about wallet activity.
 */
export async function getTransactionHistory(address: string, limit: number = 1000): Promise<Transaction[]> {
  try {
    const publicKey = new PublicKey(address)
    
    const signatures = await executeWithFallback(async (connection) => {
      let allSignatures: any[] = []
      let before: string | undefined = undefined
      let hasMore = true
      
      while (hasMore && allSignatures.length < limit) {
        const batch = await connection.getSignaturesForAddress(publicKey, {
          limit: Math.min(1000, limit - allSignatures.length),
          before: before
        })
        
        if (batch.length === 0) {
          hasMore = false
        } else {
          allSignatures = allSignatures.concat(batch)
          before = batch[batch.length - 1].signature
          
          if (batch.length < 1000) {
            hasMore = false
          }
        }
      }
      
      return allSignatures
    })
    
    // Process signatures into structured transaction data
    const transactions: Transaction[] = signatures.map(sig => ({
      signature: sig.signature,
      blockTime: sig.blockTime ? sig.blockTime * 1000 : null,
      slot: sig.slot,
      status: sig.err ? 'Failed' : 'Success',
      type: 'Transfer', // Simplified for now
      fee: 5000 // Default Solana fee in lamports
    }))
    
    console.log(`✅ Fetched ${transactions.length} transactions for ${address}`)
    return transactions
    
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    throw new Error(`Failed to fetch transaction history: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Fetches the current SOL balance of a specific Solana wallet address.
 */
export async function getSolBalance(address: string): Promise<number> {
  try {
    const publicKey = new PublicKey(address)
    
    const balance = await executeWithFallback(async (connection) => {
      return await connection.getBalance(publicKey)
    })
    
    const solBalance = balance / 1e9 // Convert lamports to SOL
    console.log(`✅ SOL balance for ${address}: ${solBalance}`)
    return solBalance
    
  } catch (error) {
    console.error('Error fetching SOL balance:', error)
    throw new Error(`Failed to fetch SOL balance: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Fetches all token holdings for a given wallet address.
 */
export async function getTokenHoldings(address: string): Promise<TokenHolding[]> {
  try {
    const publicKey = new PublicKey(address)
    
    const tokenAccounts = await executeWithFallback(async (connection) => {
      return await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID
      })
    })
    
    const holdings: TokenHolding[] = tokenAccounts.value
      .map(account => {
        const parsedData = account.account.data as any
        const tokenInfo = parsedData.parsed.info
        
        return {
          mint: tokenInfo.mint,
          amount: tokenInfo.tokenAmount.amount,
          uiAmount: tokenInfo.tokenAmount.uiAmount || 0,
          decimals: tokenInfo.tokenAmount.decimals
        }
      })
      .filter(holding => holding.uiAmount > 0)
    
    console.log(`✅ Found ${holdings.length} token holdings for ${address}`)
    return holdings
    
  } catch (error) {
    console.error('Error fetching token holdings:', error)
    throw new Error(`Failed to fetch token holdings: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Gets the most recent transaction for a wallet.
 */
export async function getLastTransaction(address: string): Promise<Transaction | null> {
  try {
    const transactions = await getTransactionHistory(address, 1)
    return transactions.length > 0 ? transactions[0] : null
  } catch (error) {
    console.error('Error fetching last transaction:', error)
    throw new Error(`Failed to fetch last transaction: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Analyzes a specific transaction signature to get detailed information.
 */
export async function analyzeTransactionSignature(signature: string): Promise<{
  signature: string
  type: string
  status: string
  fee: number
  blockTime: number | null
  instructions: Array<{ program: string, type: string, data?: any }>
  transfers: Array<{ from: string, to: string, amount: number, token?: string }>
  accounts: Array<{ address: string, role: string, balanceChange: number }>
}> {
  try {
    console.log(`🔍 Analyzing transaction signature: ${signature}`)
    
    const detailedTx = await getTransactionDetails(signature)
    
    // Determine main transaction type
    let mainType = 'Unknown'
    if (detailedTx.instructions.length > 0) {
      const primaryInstruction = detailedTx.instructions[0]
      if (primaryInstruction.type.includes('Transfer')) {
        mainType = 'Transfer'
      } else if (primaryInstruction.type.includes('Swap')) {
        mainType = 'Swap'
      } else if (primaryInstruction.type.includes('Create')) {
        mainType = 'Account Creation'
      } else {
        mainType = primaryInstruction.type
      }
    }
    
    // Calculate total transfer amount
    const totalAmount = detailedTx.transfers.reduce((sum, transfer) => sum + transfer.amount, 0)
    
    return {
      signature: detailedTx.signature,
      type: mainType,
      status: detailedTx.status,
      fee: detailedTx.fee,
      blockTime: detailedTx.blockTime,
      instructions: detailedTx.instructions,
      transfers: detailedTx.transfers,
      accounts: detailedTx.accounts.map(acc => ({
        address: acc.address,
        role: acc.role,
        balanceChange: acc.balanceChange
      }))
    }
    
  } catch (error) {
    console.error('Error analyzing transaction signature:', error)
    throw new Error(`Failed to analyze transaction: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Gets basic account information for any Solana address.
 */
export async function getAccountInfo(address: string): Promise<{
  address: string
  lamports: number
  owner: string
  executable: boolean
  rentEpoch: number
}> {
  try {
    const publicKey = new PublicKey(address)
    
    const accountInfo = await executeWithFallback(async (connection) => {
      return await connection.getAccountInfo(publicKey)
    })
    
    if (!accountInfo) {
      throw new Error('Account not found')
    }
    
    const info = {
      address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toString(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch ?? 0
    }
    
    console.log(`✅ Account info fetched for ${address}`)
    return info
    
  } catch (error) {
    console.error('Error fetching account info:', error)
    throw new Error(`Failed to fetch account info: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ========== DATA PROCESSING HELPERS ==========
// These are NOT called directly by AI, but used by our backend to process data

/**
 * Counts transfers in a specific month from transaction history.
 */
export function countTransfersInMonth(transactions: Transaction[], month: string, year: number): number {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ]
  
  const monthIndex = monthNames.indexOf(month.toLowerCase())
  if (monthIndex === -1) {
    throw new Error(`Invalid month: ${month}`)
  }
  
  let count = 0
  for (const tx of transactions) {
    if (tx.blockTime && tx.status === 'Success') {
      const date = new Date(tx.blockTime)
      if (date.getFullYear() === year && date.getMonth() === monthIndex) {
        count++
      }
    }
  }
  
  return count
}

/**
 * Finds transactions within a specific date range.
 */
export function getTransactionsInDateRange(
  transactions: Transaction[], 
  startDate: Date, 
  endDate: Date
): Transaction[] {
  return transactions.filter(tx => {
    if (!tx.blockTime) return false
    const txDate = new Date(tx.blockTime)
    return txDate >= startDate && txDate <= endDate
  })
}

/**
 * Calculates days since last activity.
 */
export function getDaysSinceLastActivity(transactions: Transaction[]): number {
  if (transactions.length === 0) return -1
  
  const lastTx = transactions[0] // Assuming sorted by most recent first
  if (!lastTx.blockTime) return -1
  
  const now = Date.now()
  const daysDiff = Math.floor((now - lastTx.blockTime) / (1000 * 60 * 60 * 24))
  return daysDiff
}

/**
 * Counts transactions within a specific date range.
 * This is the AI-friendly tool that lets GPT-4 specify exact dates.
 */
export async function countTransactionsByDateRange(
  address: string, 
  startDate: string, // e.g., "2024-11-01"
  endDate: string // e.g., "2024-11-30"
): Promise<number> {
  try {
    console.log(`📊 Counting transactions from ${startDate} to ${endDate} for ${address}`)
    
    // Fetch comprehensive transaction history
    const transactions = await getTransactionHistory(address, 5000)
    
    const start = new Date(startDate).getTime()
    const end = new Date(endDate + 'T23:59:59.999Z').getTime() // Include full end date
    
    const count = transactions.filter(tx => {
      if (!tx.blockTime) return false
      const txTime = tx.blockTime // blockTime is already in milliseconds from our getTransactionHistory
      return txTime >= start && txTime <= end
    }).length
    
    console.log(`✅ Found ${count} transactions in date range ${startDate} to ${endDate}`)
    return count
    
  } catch (error) {
    console.error('Error counting transactions by date range:', error)
    throw new Error(`Failed to count transactions: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Fetches detailed, paginated transactions for a specific date range.
 * This is the powerful but slow function that gets rich transaction details.
 */
export async function getDetailedTransactions(
  address: string,
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 5
): Promise<{ transactions: DetailedTransaction[], currentPage: number, totalPages: number, totalCount: number }> {
  try {
    console.log(`🔍 Fetching detailed transactions page ${page} (${limit} per page) from ${startDate} to ${endDate}`)
    
    // Step 1: Get all transaction signatures for the date range (fast)
    const allTransactions = await getTransactionHistory(address, 5000)
    
    const start = new Date(startDate).getTime()
    const end = new Date(endDate + 'T23:59:59.999Z').getTime()
    
    const relevantTransactions = allTransactions.filter(tx => {
      if (!tx.blockTime) return false
      const txTime = tx.blockTime
      return txTime >= start && txTime <= end
    })
    
    const totalCount = relevantTransactions.length
    const totalPages = Math.ceil(totalCount / limit)
    
    // Step 2: Get only the transactions for the current page
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const pageTransactions = relevantTransactions.slice(startIndex, endIndex)
    
    console.log(`📄 Processing ${pageTransactions.length} transactions for page ${page}/${totalPages}`)
    
    // Step 3: Fetch detailed data for each transaction (the slow part)
    const detailedTransactions: DetailedTransaction[] = []
    
    for (const tx of pageTransactions) {
      try {
        const detailedTx = await getTransactionDetails(tx.signature)
        detailedTransactions.push(detailedTx)
      } catch (error) {
        console.warn(`Failed to get details for transaction ${tx.signature}:`, error)
        // Add a fallback transaction with basic info
        detailedTransactions.push({
          signature: tx.signature,
          blockTime: tx.blockTime,
          slot: tx.slot,
          status: tx.status,
          fee: tx.fee,
          instructions: [{ program: 'Unknown', type: 'Failed to parse' }],
          accounts: [],
          transfers: []
        })
      }
    }
    
    console.log(`✅ Successfully fetched ${detailedTransactions.length} detailed transactions`)
    
    return {
      transactions: detailedTransactions,
      currentPage: page,
      totalPages,
      totalCount
    }
    
  } catch (error) {
    console.error('Error fetching detailed transactions:', error)
    throw new Error(`Failed to fetch detailed transactions: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Fetches detailed information for a single transaction.
 */
async function getTransactionDetails(signature: string): Promise<DetailedTransaction> {
  return await executeWithFallback(async (connection) => {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    })
    
    if (!tx) {
      throw new Error(`Transaction ${signature} not found`)
    }
    
    // Parse instructions with better type detection
    const instructions = tx.transaction.message.instructions.map((instruction: any, index: number) => {
      if ('parsed' in instruction) {
        // Handle parsed instructions (most common)
        const program = instruction.program || 'Unknown'
        const type = instruction.parsed?.type || 'Unknown'
        const info = instruction.parsed?.info || {}
        
        // Enhanced type detection for common programs
        let enhancedType = type
        if (program === 'system' && type === 'transfer') {
          enhancedType = 'SOL Transfer'
        } else if (program === 'spl-token' && type === 'transfer') {
          enhancedType = 'Token Transfer'
        } else if (program === 'spl-token' && type === 'transferChecked') {
          enhancedType = 'Token Transfer (Checked)'
        } else if (program === 'spl-associated-token-account' && type === 'create') {
          enhancedType = 'Create Token Account'
        }
        
        return {
          program,
          type: enhancedType,
          data: info
        }
      } else {
        // Handle raw/unparsed instructions
        const programId = instruction.programId?.toString() || 'Unknown'
        
        // Try to identify common program types by program ID
        let programName = 'Unknown Program'
        let instructionType = 'Raw Instruction'
        
        if (programId === '11111111111111111111111111111112') {
          programName = 'System Program'
          instructionType = 'System Instruction'
        } else if (programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          programName = 'Token Program'
          instructionType = 'Token Instruction'
        }
        
        return {
          program: programName,
          type: instructionType,
          data: { 
            programId,
            accounts: instruction.accounts?.length || 0,
            dataLength: instruction.data?.length || 0
          }
        }
      }
    })
    
    // Parse account changes
    const accounts = tx.meta?.preBalances?.map((preBalance: number, index: number) => {
      const postBalance = tx.meta?.postBalances?.[index] || 0
      const accountKey = tx.transaction.message.accountKeys[index]
      
      // Determine role with proper typing
      let role: 'signer' | 'writable' | 'readonly' = 'readonly'
      if (accountKey?.signer) {
        role = 'signer'
      } else if (accountKey?.writable) {
        role = 'writable'
      }
      
      return {
        address: accountKey?.pubkey?.toString() || 'Unknown',
        role,
        preBalance: preBalance / 1e9, // Convert lamports to SOL
        postBalance: postBalance / 1e9,
        balanceChange: (postBalance - preBalance) / 1e9
      }
    }) || []
    
    // Extract transfers with better logic
    const transfers: Array<{ from: string, to: string, amount: number, token?: string }> = []
    
    // First, try to extract transfers from parsed instructions
    instructions.forEach(instruction => {
      if (instruction.type === 'SOL Transfer' && instruction.data) {
        const data = instruction.data as any
        if (data.source && data.destination && data.lamports) {
          transfers.push({
            from: data.source,
            to: data.destination,
            amount: data.lamports / 1e9 // Convert lamports to SOL
          })
        }
      } else if (instruction.type === 'Token Transfer' && instruction.data) {
        const data = instruction.data as any
        if (data.source && data.destination && data.amount) {
          transfers.push({
            from: data.source,
            to: data.destination,
            amount: parseFloat(data.amount) || 0,
            token: data.mint || 'Unknown Token'
          })
        }
      }
    })
    
    // Fallback: Look for SOL transfers in account balance changes if no parsed transfers found
    if (transfers.length === 0) {
      const significantChanges = accounts.filter(account => Math.abs(account.balanceChange) > 0.000001)
      
      // Try to pair senders and receivers
      const senders = significantChanges.filter(acc => acc.balanceChange < 0)
      const receivers = significantChanges.filter(acc => acc.balanceChange > 0)
      
      senders.forEach(sender => {
        const matchingReceiver = receivers.find(receiver => 
          Math.abs(Math.abs(sender.balanceChange) - receiver.balanceChange) < 0.000001
        )
        
        if (matchingReceiver) {
          transfers.push({
            from: sender.address,
            to: matchingReceiver.address,
            amount: Math.abs(sender.balanceChange)
          })
        }
      })
    }
    
    return {
      signature,
      blockTime: tx.blockTime ? tx.blockTime * 1000 : null,
      slot: tx.slot,
      status: tx.meta?.err ? 'Failed' : 'Success',
      fee: (tx.meta?.fee || 0) / 1e9, // Convert lamports to SOL
      instructions,
      accounts,
      transfers
    }
  })
}

/**
 * Get token holders and their balances for a specific token mint
 * Uses Morpheus AI for intelligent token analysis with fallback to external APIs
 */
export async function getTokenHolders(mintAddress: string, limit: number = 50) {
  console.log(`🔍 Fetching token holders for mint: ${mintAddress} using Morpheus AI`)
  
  try {
    // First, use Morpheus to analyze the token mint and get structured data
    const { MorpheusService } = await import('@/lib/services/morpheus')
    const morpheusService = new MorpheusService({
      apiUrl: process.env.MORPHEUS_API_URL || 'https://api.morpheus.ai',
      apiKey: process.env.MORPHEUS_API_KEY || 'demo-key',
      modelId: 'token-analyzer-v1'
    })
    
    // Get token mint account data first
    const mintPubkey = new PublicKey(mintAddress)
    const mintAccountInfo = await executeWithFallback(async (connection) => {
      return await connection.getAccountInfo(mintPubkey)
    })
    
    if (!mintAccountInfo) {
      throw new Error('Token mint account not found')
    }
    
    // Use Morpheus to parse the token mint data
    const parsedTokenData = await morpheusService.parseAccountData(
      mintAccountInfo.data,
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    )
    
    console.log('🧠 Morpheus parsed token data:', parsedTokenData)
    
    // Cross-validate with RPC parsed data for accuracy
    let rpcValidation = null
    try {
      const rpcParsedInfo = await executeWithFallback(async (connection) => {
        return await connection.getParsedAccountInfo(mintPubkey)
      })
      
      if (rpcParsedInfo.value?.data && 'parsed' in rpcParsedInfo.value.data) {
        const rpcData = rpcParsedInfo.value.data.parsed.info
        rpcValidation = {
          supply: rpcData.supply,
          decimals: rpcData.decimals,
          mintAuthority: rpcData.mintAuthority,
          freezeAuthority: rpcData.freezeAuthority,
          isInitialized: rpcData.isInitialized
        }
        
        // Compare Morpheus vs RPC results
        console.log('🔍 RPC Validation Data:', rpcValidation)
        console.log('🔍 Morpheus vs RPC Comparison:')
        console.log(`  Supply: Morpheus=${parsedTokenData.fields.supply} | RPC=${rpcData.supply}`)
        console.log(`  Decimals: Morpheus=${parsedTokenData.fields.decimals} | RPC=${rpcData.decimals}`)
        console.log(`  MintAuth: Morpheus=${parsedTokenData.fields.mintAuthority} | RPC=${rpcData.mintAuthority}`)
      }
    } catch (error) {
      console.warn('Failed to get RPC validation data:', error)
    }
    
    // Now try to get holder data from external APIs with Morpheus-enhanced context
    try {
      console.log('🔗 Trying Solscan API for holder data...')
      
      // Use public API first (more reliable for token holders)
      const apiUrl = `https://public-api.solscan.io/token/holders?tokenAddress=${mintAddress}&limit=${limit}&offset=0`
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Qognita-Security-Platform/1.0'
      }
      
      console.log('🌐 Using public Solscan API for token holders')
      
      const solscanResponse = await fetch(apiUrl, {
        signal: AbortSignal.timeout(15000),
        headers
      })
      
      console.log(`📡 Solscan API Response Status: ${solscanResponse.status}`)
      
      if (solscanResponse.ok) {
        const solscanData = await solscanResponse.json()
        console.log('📊 Solscan API Raw Response:', JSON.stringify(solscanData, null, 2))
        
        // Handle public API response format
        const holdersData = (solscanData.success && solscanData.data) ? solscanData.data : []
        
        if (holdersData && holdersData.length > 0) {
          console.log(`✅ Got holder data from Solscan: ${holdersData.length} holders`)
          
          // Use RPC validation data if available, otherwise fall back to Morpheus
          const decimals = rpcValidation ? rpcValidation.decimals : (parseInt(parsedTokenData.fields.decimals) || 9)
          const rawSupply = rpcValidation ? rpcValidation.supply : parsedTokenData.fields.supply
          const totalSupply = rawSupply ? parseInt(rawSupply) / Math.pow(10, decimals) : 0
          
          console.log(`📊 Using decimals: ${decimals}, raw supply: ${rawSupply}, total supply: ${totalSupply}`)
          
          const holders = holdersData.map((holder: any, index: number) => ({
            address: holder.owner,
            amount: holder.amount,
            uiAmount: parseFloat(holder.amount) / Math.pow(10, decimals),
            decimals: decimals,
            percentage: totalSupply > 0 ? (parseFloat(holder.amount) / Math.pow(10, decimals) / totalSupply) * 100 : 0,
            rank: index + 1
          }))
          
          return {
            mintAddress,
            totalHolders: holders.length,
            totalSupply,
            decimals,
            holders,
            distribution: {
              top10Percentage: holders.slice(0, 10).reduce((sum: number, h: any) => sum + h.percentage, 0),
              top50Percentage: holders.slice(0, 50).reduce((sum: number, h: any) => sum + h.percentage, 0)
            },
            dataSource: 'Morpheus AI + Solscan API',
            morpheusAnalysis: parsedTokenData,
            tokenAuthorities: {
              mintAuthority: parsedTokenData.fields.mintAuthority,
              freezeAuthority: parsedTokenData.fields.freezeAuthority,
              isInitialized: parsedTokenData.fields.isInitialized
            }
          }
        } else {
          console.warn(`❌ Solscan API returned empty or invalid data:`, solscanData)
        }
      } else {
        console.warn(`❌ Solscan API failed with status: ${solscanResponse.status}`)
        const errorText = await solscanResponse.text()
        console.warn(`❌ Solscan Error Response: ${errorText}`)
      }
    } catch (error) {
      console.warn('❌ Solscan API failed completely:', error)
    }
    
    // Try alternative APIs if Solscan failed
    try {
      console.log('🔗 Trying alternative API for holder data...')
      
      // Try Helius API if available
      if (process.env.HELIUS_API_KEY) {
        const heliusResponse = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mintAccounts: [mintAddress]
          }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (heliusResponse.ok) {
          const heliusData = await heliusResponse.json()
          console.log('📊 Helius API response:', heliusData)
          // Process Helius data if available
        }
      }
      
      // Try Jupiter API for basic token info
      const jupiterResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${mintAddress}&outputMint=So11111111111111111111111111111111111111112&amount=1000000`, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (jupiterResponse.ok) {
        console.log('✅ Token is tradeable on Jupiter (indicates active holders)')
      }
      
    } catch (error) {
      console.warn('Alternative APIs also failed:', error)
    }
    
    // Fallback: Return validated analysis with basic token info
    const decimals = rpcValidation ? rpcValidation.decimals : (parseInt(parsedTokenData.fields.decimals) || 9)
    const rawSupply = rpcValidation ? rpcValidation.supply : parsedTokenData.fields.supply
    const totalSupply = rawSupply ? parseInt(rawSupply) / Math.pow(10, decimals) : 0
    
    console.log(`📊 Fallback using decimals: ${decimals}, raw supply: ${rawSupply}, total supply: ${totalSupply}`)
    
    return {
      mintAddress,
      totalSupply,
      decimals,
      holders: [],
      totalHolders: 0,
      distribution: {
        top10Percentage: 0,
        top50Percentage: 0
      },
      note: "Token analysis completed by Morpheus AI with RPC validation. Holder data requires external indexing services.",
      dataSource: rpcValidation ? 'Morpheus AI + RPC Validation' : 'Morpheus AI Analysis',
      morpheusAnalysis: parsedTokenData,
      rpcValidation: rpcValidation,
      tokenAuthorities: {
        mintAuthority: rpcValidation ? rpcValidation.mintAuthority : parsedTokenData.fields.mintAuthority,
        freezeAuthority: rpcValidation ? rpcValidation.freezeAuthority : parsedTokenData.fields.freezeAuthority,
        isInitialized: rpcValidation ? rpcValidation.isInitialized : parsedTokenData.fields.isInitialized
      },
      recommendation: "For detailed holder analysis, the system uses specialized blockchain indexing services. Morpheus provides intelligent parsing with RPC validation for accuracy."
    }
    
  } catch (error) {
    console.error('Failed to fetch token holders with Morpheus:', error)
    throw new Error(`Failed to fetch token holders: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get basic token information including metadata using Morpheus AI
 */
export async function getTokenInfo(mintAddress: string) {
  console.log(`🔍 Fetching token info for: ${mintAddress} using Morpheus AI`)
  
  try {
    // Use Morpheus to analyze the token mint
    const { MorpheusService } = await import('@/lib/services/morpheus')
    const morpheusService = new MorpheusService({
      apiUrl: process.env.MORPHEUS_API_URL || 'https://api.morpheus.ai',
      apiKey: process.env.MORPHEUS_API_KEY || 'demo-key',
      modelId: 'token-analyzer-v1'
    })
    
    const mintPubkey = new PublicKey(mintAddress)
    
    // Get raw mint account data
    const mintAccountInfo = await executeWithFallback(async (connection) => {
      return await connection.getAccountInfo(mintPubkey)
    })
    
    if (!mintAccountInfo) {
      throw new Error('Token mint account not found')
    }
    
    // Use Morpheus to parse the token mint data intelligently
    const morpheusParsedData = await morpheusService.parseAccountData(
      mintAccountInfo.data,
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    )
    
    console.log('🧠 Morpheus token analysis:', morpheusParsedData)
    
    // Try to get market data from DexScreener
    let marketData = null
    try {
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (dexResponse.ok) {
        const dexData = await dexResponse.json()
        const pair = dexData.pairs?.[0]
        
        if (pair) {
          marketData = {
            name: pair.baseToken.name,
            symbol: pair.baseToken.symbol,
            price: pair.priceUsd,
            volume24h: pair.volume?.h24,
            marketCap: pair.marketCap,
            liquidity: pair.liquidity?.usd,
            priceChange24h: pair.priceChange?.h24
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch market data:', error)
    }
    
    // Combine Morpheus analysis with market data
    return {
      mintAddress,
      decimals: parseInt(morpheusParsedData.fields.decimals) || 9,
      supply: morpheusParsedData.fields.supply,
      mintAuthority: morpheusParsedData.fields.mintAuthority,
      freezeAuthority: morpheusParsedData.fields.freezeAuthority,
      isInitialized: morpheusParsedData.fields.isInitialized,
      marketData,
      morpheusAnalysis: {
        accountType: morpheusParsedData.accountType,
        confidence: morpheusParsedData.confidence,
        parsedFields: morpheusParsedData.fields
      },
      dataSource: 'Morpheus AI + DexScreener API'
    }
    
  } catch (error) {
    console.error('Failed to fetch token info with Morpheus:', error)
    throw new Error(`Failed to fetch token info: ${error instanceof Error ? error.message : String(error)}`)
  }
}
