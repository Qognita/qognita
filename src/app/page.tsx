import Link from 'next/link';
import Image from 'next/image';
import {
  Brain,
  MessageSquare,
  Search,
  Code,
  TrendingUp,
  Shield,
  Zap,
  BookOpen,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-navy-950 via-navy-800 to-blue-900 font-lato">
      {/* Header */}
      <header className="border-b border-white/10 bg-navy-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="Qognita Logo"
                width={32}
                height={32}
                className="text-blue-400"
              />
              <h1 className="font-raleway text-2xl font-bold text-white">Qognita</h1>
              <span className="ml-2 text-sm text-gray-400">ChatGPT for Solana</span>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg bg-gradient-to-r from-navy-600 to-blue-600 px-6 py-2 text-white shadow-lg transition-all duration-200 hover:from-navy-700 hover:to-blue-700"
            >
              Start Chatting
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 font-raleway text-5xl font-bold text-white">
              Your AI Assistant for{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Everything Solana
              </span>
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-gray-300">
              Ask anything about Solana - from wallet analysis to DeFi mechanics, NFT collections to
              program debugging. Get instant answers with live blockchain data and comprehensive
              documentation.
            </p>

            <div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-lg bg-gradient-to-r from-navy-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-navy-700 hover:to-blue-700"
              >
                Ask Qognita Anything
              </Link>
            </div>

            {/* Stats */}
            <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 font-raleway text-3xl font-bold text-blue-400">Live Data</div>
                <div className="text-gray-300">Real-time blockchain analysis</div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-raleway text-3xl font-bold text-blue-300">AI-Powered</div>
                <div className="text-gray-300">OpenAI GPT-4o integration</div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-raleway text-3xl font-bold text-cyan-400">
                  Comprehensive
                </div>
                <div className="text-gray-300">Docs + blockchain + security</div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="mx-auto grid max-w-6xl grid-cols-1 justify-center gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-blue-400" />
              <h3 className="mb-2 font-raleway text-xl font-semibold text-white">
                Conversational AI
              </h3>
              <p className="text-gray-300">
                Ask questions in plain English about any Solana address, token, or transaction.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <Search className="mx-auto mb-4 h-12 w-12 text-blue-300" />
              <h3 className="mb-2 font-raleway text-xl font-semibold text-white">
                Live Blockchain Data
              </h3>
              <p className="text-gray-300">
                Real-time analysis of wallets, tokens, NFTs, and DeFi protocols with live data.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-cyan-400" />
              <h3 className="mb-2 font-raleway text-xl font-semibold text-white">
                Documentation Expert
              </h3>
              <p className="text-gray-300">
                Instant access to Solana docs, Anchor guides, and ecosystem knowledge.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
              <Shield className="mx-auto mb-4 h-12 w-12 text-indigo-400" />
              <h3 className="mb-2 font-raleway text-xl font-semibold text-white">
                Security Insights
              </h3>
              <p className="text-gray-300">
                Built-in security analysis and risk detection for all your queries.
              </p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mx-auto mt-24 max-w-6xl">
            <h3 className="mb-12 text-center font-raleway text-3xl font-bold text-white">
              Perfect for Everyone
            </h3>
            <div className="grid grid-cols-1 justify-center gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-navy-500/20 bg-gradient-to-br from-navy-500/10 to-blue-500/10 p-8">
                <Code className="mb-4 h-10 w-10 text-blue-400" />
                <h4 className="mb-4 font-raleway text-xl font-semibold text-white">Developers</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Debug failed transactions</li>
                  <li>• Understand program instructions</li>
                  <li>• Analyze account structures</li>
                </ul>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8">
                <TrendingUp className="mb-4 h-10 w-10 text-blue-300" />
                <h4 className="mb-4 font-raleway text-xl font-semibold text-white">
                  Traders & DeFi Users
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Analyze token holders</li>
                  <li>• Check liquidity pools</li>
                  <li>• Track wallet activity</li>
                  <li>• Assess token risks</li>
                </ul>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-8">
                <Brain className="mb-4 h-10 w-10 text-cyan-400" />
                <h4 className="mb-4 font-raleway text-xl font-semibold text-white">Newcomers</h4>
                <ul className="space-y-2 text-gray-300">
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
            <p>&copy; 2024 Qognita.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
