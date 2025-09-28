import Link from 'next/link'
import Image from 'next/image'
import { Brain, MessageSquare, Search, Code, TrendingUp, Shield, Zap, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-navy-950 via-navy-800 to-blue-900 font-lato">
      {/* Header */}
      <header className="border-b border-white/10 bg-navy-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white font-raleway">Qognita</h1>
              <span className="text-sm text-gray-400 ml-2">ChatGPT for Solana</span>
            </div>
            <Link 
              href="/dashboard"
              className="bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg"
            >
              Start Chatting
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-white mb-6 font-raleway">
              Your AI Assistant for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Everything Solana
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Ask anything about Solana - from wallet analysis to DeFi mechanics, NFT collections to program debugging. 
              Get instant answers with live blockchain data and comprehensive documentation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/dashboard"
                className="bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg"
              >
                Ask Qognita Anything
              </Link>
              <button className="border border-white/20 hover:bg-white/10 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                See Examples
              </button>
            </div>

            {/* Example Queries */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-16 text-left max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-white mb-6 text-center font-raleway">Try asking Qognita:</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border-l-4 border-blue-400">
                  <p className="text-gray-300">"What tokens does wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU hold?"</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border-l-4 border-blue-300">
                  <p className="text-gray-300">"How do Jupiter swaps work? Show me a recent swap transaction."</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border-l-4 border-cyan-400">
                  <p className="text-gray-300">"My transaction failed with error 0x1771. What does this mean?"</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border-l-4 border-indigo-400">
                  <p className="text-gray-300">"Is this token safe? Check for any security concerns: [token address]"</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2 font-raleway">Live Data</div>
                <div className="text-gray-300">Real-time blockchain analysis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2 font-raleway">AI-Powered</div>
                <div className="text-gray-300">Morpheus + OpenAI integration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2 font-raleway">Comprehensive</div>
                <div className="text-gray-300">Docs + blockchain + security</div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto justify-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2 font-raleway">Conversational AI</h3>
              <p className="text-gray-300">
                Ask questions in plain English about any Solana address, token, or transaction.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <Search className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2 font-raleway">Live Blockchain Data</h3>
              <p className="text-gray-300">
                Real-time analysis of wallets, tokens, NFTs, and DeFi protocols with live data.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <BookOpen className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2 font-raleway">Documentation Expert</h3>
              <p className="text-gray-300">
                Instant access to Solana docs, Anchor guides, and ecosystem knowledge.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <Shield className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2 font-raleway">Security Insights</h3>
              <p className="text-gray-300">
                Built-in security analysis and risk detection for all your queries.
              </p>
            </div>
          </div>
          
          {/* Use Cases */}
          <div className="mt-24 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-white text-center mb-12 font-raleway">Perfect for Everyone</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
              <div className="bg-gradient-to-br from-navy-500/10 to-blue-500/10 border border-navy-500/20 rounded-xl p-8">
                <Code className="h-10 w-10 text-blue-400 mb-4" />
                <h4 className="text-xl font-semibold text-white mb-4 font-raleway">Developers</h4>
                <ul className="text-gray-300 space-y-2">
                  <li>• Debug failed transactions</li>
                  <li>• Understand program instructions</li>
                  <li>• Analyze account structures</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-8">
                <TrendingUp className="h-10 w-10 text-blue-300 mb-4" />
                <h4 className="text-xl font-semibold text-white mb-4 font-raleway">Traders & DeFi Users</h4>
                <ul className="text-gray-300 space-y-2">
                  <li>• Analyze token holders</li>
                  <li>• Check liquidity pools</li>
                  <li>• Track wallet activity</li>
                  <li>• Assess token risks</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-xl p-8">
                <Brain className="h-10 w-10 text-cyan-400 mb-4" />
                <h4 className="text-xl font-semibold text-white mb-4 font-raleway">Newcomers</h4>
                <ul className="text-gray-300 space-y-2">
                  <li>• Understand transactions</li>
                  <li>• Learn Solana concepts</li>
                  <li>• Explore the ecosystem</li>
                  <li>• Stay safe from scams</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-navy-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Qognita. Built with ❤️ for the Solana ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
