import { Connection, PublicKey } from '@solana/web3.js'
import { getMint, getAccount } from '@solana/spl-token'

export interface TokenMetadata {
  name: string | null
  symbol: string | null
  image: string | null
  description: string | null
  marketData?: {
    price?: number
    volume24h?: number
    marketCap?: number
    liquidity?: number
  }
}

export interface TokenHolder {
  address: string
  amount: string
  uiAmount: number
  percentage: number
  rank: number
}

export interface TokenAnalysis {
  metadata: TokenMetadata
  holders: TokenHolder[]
  totalHolders: number
  supply: string
  decimals: number
  mintAuthority: string | null
  freezeAuthority: string | null
}

export class TokenScraperService {
  private connection: Connection

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  async scrapeTokenData(mintAddress: string): Promise<TokenAnalysis> {
    console.log(`🔍 Scraping comprehensive data for token: ${mintAddress}`)
    
    // Get basic mint info
    const mintInfo = await getMint(this.connection, new PublicKey(mintAddress))
    
    // Scrape metadata from multiple sources
    const metadata = await this.scrapeTokenMetadata(mintAddress)
    
    // Get comprehensive holder analysis
    const holderAnalysis = await this.getComprehensiveHolders(mintAddress, mintInfo)
    
    return {
      metadata,
      holders: holderAnalysis.holders,
      totalHolders: holderAnalysis.totalHolders,
      supply: mintInfo.supply.toString(),
      decimals: mintInfo.decimals,
      mintAuthority: mintInfo.mintAuthority?.toString() || null,
      freezeAuthority: mintInfo.freezeAuthority?.toString() || null
    }
  }

  private async scrapeTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
    const sources = [
      () => this.scrapeDexScreener(mintAddress),
      () => this.scrapeBirdeye(mintAddress),
      () => this.scrapeJupiter(mintAddress),
      () => this.scrapeCoinGecko(mintAddress),
      () => this.scrapeSolscan(mintAddress)
    ]

    for (const scraper of sources) {
      try {
        const result = await scraper()
        if (result && result.name) {
          console.log(`✅ Found token data: ${result.name} (${result.symbol})`)
          return result
        }
      } catch (error) {
        console.warn(`Scraper failed:`, error)
        continue
      }
    }

    return {
      name: null,
      symbol: null,
      image: null,
      description: null
    }
  }

  private async scrapeDexScreener(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TokenAnalyzer/1.0)' }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      if (data.pairs?.[0]) {
        const pair = data.pairs[0]
        return {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          image: pair.info?.imageUrl || null,
          description: `${pair.baseToken.name} - DeFi Token`,
          marketData: {
            price: parseFloat(pair.priceUsd) || 0,
            volume24h: parseFloat(pair.volume?.h24) || 0,
            marketCap: parseFloat(pair.marketCap) || 0,
            liquidity: parseFloat(pair.liquidity?.usd) || 0
          }
        }
      }
    } catch (error) {
      console.warn('DexScreener scraping failed:', error)
    }
    return null
  }

  private async scrapeBirdeye(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${mintAddress}`, {
        headers: { 
          'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
          'User-Agent': 'Mozilla/5.0 (compatible; TokenAnalyzer/1.0)'
        }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      if (data.success && data.data) {
        const token = data.data
        return {
          name: token.name,
          symbol: token.symbol,
          image: token.logoURI,
          description: `${token.name} - Solana Token`,
          marketData: {
            price: token.price || 0,
            volume24h: token.v24hUSD || 0,
            marketCap: token.mc || 0,
            liquidity: token.liquidity || 0
          }
        }
      }
    } catch (error) {
      console.warn('Birdeye scraping failed:', error)
    }
    return null
  }

  private async scrapeJupiter(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch('https://token.jup.ag/all')
      if (!response.ok) return null
      
      const tokens = await response.json()
      const token = tokens.find((t: any) => t.address === mintAddress)
      
      if (token) {
        return {
          name: token.name,
          symbol: token.symbol,
          image: token.logoURI,
          description: `${token.name} - Jupiter Listed Token`
        }
      }
    } catch (error) {
      console.warn('Jupiter scraping failed:', error)
    }
    return null
  }

  private async scrapeCoinGecko(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/solana/contract/${mintAddress}`)
      if (!response.ok) return null
      
      const data = await response.json()
      return {
        name: data.name,
        symbol: data.symbol?.toUpperCase(),
        image: data.image?.large,
        description: data.description?.en || `${data.name} - CoinGecko Listed`,
        marketData: {
          price: data.market_data?.current_price?.usd || 0,
          volume24h: data.market_data?.total_volume?.usd || 0,
          marketCap: data.market_data?.market_cap?.usd || 0
        }
      }
    } catch (error) {
      console.warn('CoinGecko scraping failed:', error)
    }
    return null
  }

  private async scrapeSolscan(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      // Solscan doesn't have a public API, but we can try to scrape their page
      // This is a fallback method
      return null
    } catch (error) {
      console.warn('Solscan scraping failed:', error)
    }
    return null
  }

  private async getComprehensiveHolders(mintAddress: string, mintInfo: any): Promise<{holders: TokenHolder[], totalHolders: number}> {
    try {
      console.log('🔍 Analyzing token holders...')
      
      const mintPublicKey = new PublicKey(mintAddress)
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: mintAddress } }
          ]
        }
      )
      
      const totalSupply = Number(mintInfo.supply)
      const decimals = mintInfo.decimals
      
      const holders: TokenHolder[] = []
      let processedCount = 0
      
      // Process in smaller batches to avoid rate limits
      const batchSize = 20
      for (let i = 0; i < Math.min(tokenAccounts.length, 50); i += batchSize) {
        const batch = tokenAccounts.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (account: any) => {
          try {
            const accountInfo = await getAccount(this.connection, account.pubkey)
            const amount = Number(accountInfo.amount)
            
            if (amount > 0) {
              const uiAmount = amount / Math.pow(10, decimals)
              return {
                address: accountInfo.owner.toString(),
                amount: amount.toString(),
                uiAmount: uiAmount,
                percentage: totalSupply > 0 ? (amount / totalSupply) * 100 : 0,
                rank: 0 // Will be set after sorting
              }
            }
            return null
          } catch (error) {
            console.warn(`Failed to get account info:`, error)
            return null
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        holders.push(...batchResults.filter(h => h !== null) as TokenHolder[])
        
        processedCount += batch.length
        console.log(`📊 Processed ${processedCount}/${Math.min(tokenAccounts.length, 50)} accounts`)
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Sort by amount and assign ranks
      holders.sort((a, b) => Number(b.amount) - Number(a.amount))
      holders.forEach((holder: TokenHolder, index: number) => {
        holder.rank = index + 1
      })
      
      console.log(`✅ Found ${holders.length} holders out of ${tokenAccounts.length} total accounts`)
      
      return {
        holders: holders.slice(0, 100), // Return top 100
        totalHolders: tokenAccounts.length
      }
      
    } catch (error) {
      console.error('Error analyzing holders:', error)
      return { holders: [], totalHolders: 0 }
    }
  }
}
