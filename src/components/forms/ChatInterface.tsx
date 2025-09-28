'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Bot, User, AlertCircle, X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyzeResponse, ChatMessage } from '@/lib/types/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatInterfaceProps {
  analysisContext?: AnalyzeResponse | null
  isExpanded?: boolean
  onToggleExpand?: () => void
  onClose?: () => void
}

export function ChatInterface({ analysisContext, isExpanded = false, onToggleExpand, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI security assistant. Ask me anything about Solana security, or analyze an address first to get specific insights about it.'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add context message when analysis is completed
  useEffect(() => {
    if (analysisContext) {
      const contextMessage: ChatMessage = {
        role: 'assistant',
        content: `I can now answer questions about the analyzed address: ${analysisContext.address}. The trust score is ${analysisContext.trustScore}/100. What would you like to know about this address?`
      }
      setMessages(prev => [...prev, contextMessage])
    }
  }, [analysisContext])

  const detectBlockchainQuery = (query: string): { isBlockchainQuery: boolean, address?: string, signature?: string } => {
    const queryLower = query.toLowerCase()
    
    // Check if it's a blockchain-specific query
    const blockchainKeywords = ['balance', 'transaction', 'wallet', 'last', 'recent', 'sent', 'received', 'tokens', 'history']
    const isBlockchainQuery = blockchainKeywords.some(keyword => queryLower.includes(keyword))
    
    // Extract address or signature from context or query
    let address = analysisContext?.address
    let signature: string | undefined
    
    // Try to extract address from query (basic pattern matching)
    const addressMatch = query.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)
    if (addressMatch) {
      if (addressMatch[0].length > 80) {
        signature = addressMatch[0]
      } else {
        address = addressMatch[0]
      }
    }
    
    return { isBlockchainQuery, address, signature }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    try {
      // Extract address from analysis context
      const address = analysisContext?.address || 'unknown'
      
      // If no address is available, provide a helpful message
      if (address === 'unknown') {
        const helpMessage: ChatMessage = {
          role: 'assistant',
          content: 'Please analyze a Solana address first so I can provide specific information about that wallet, token, or program. You can enter any Solana address in the analysis form above.'
        }
        setMessages(prev => [...prev, helpMessage])
        return
      }
      
      // Use enhanced chat API with proper parameters
      const response = await fetch('/api/chat-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input.trim(),
          address: address
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Chat API error:', errorText)
        throw new Error(`Chat request failed: ${response.status}`)
      }

      const result = await response.json()
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response || 'I apologize, but I cannot provide a response at the moment.'
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or check if the AI services are properly configured.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [
    "What should I look for in a safe Solana token?",
    "How can I identify a rug pull?",
    "What are the red flags for malicious programs?",
    "Is this address safe to interact with?",
    "What are the last 5 transactions for this wallet?",
    "Show me the balance of this address",
    "Who sent this transaction and to whom?",
    "What tokens does this wallet hold?"
  ]

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-green-400" />
          <span>AI Security Assistant</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Ask questions about Solana security
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-white/10 text-gray-100'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm max-w-none markdown-content break-words overflow-hidden">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-lg font-bold mb-3 mt-2 text-white border-b border-gray-600 pb-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3 text-white">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-bold mb-2 mt-2 text-white">{children}</h3>,
                        p: ({children}) => <p className="mb-3 text-gray-100 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc ml-4 mb-3 space-y-1 text-gray-100">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal ml-4 mb-3 space-y-1 text-gray-100">{children}</ol>,
                        li: ({children}) => <li className="text-gray-100 leading-relaxed">{children}</li>,
                        strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-200">{children}</em>,
                        code: ({children}) => <code className="bg-gray-800 px-2 py-1 rounded text-green-400 text-xs font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-800 p-3 rounded-lg mb-3 overflow-x-auto text-green-400 text-xs font-mono border border-gray-700">{children}</pre>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 italic text-gray-300 bg-gray-800/30 rounded-r">{children}</blockquote>,
                        table: ({children}) => <table className="w-full border-collapse border border-gray-600 mb-3">{children}</table>,
                        th: ({children}) => <th className="border border-gray-600 px-2 py-1 bg-gray-700 text-white font-bold text-left">{children}</th>,
                        td: ({children}) => <td className="border border-gray-600 px-2 py-1 text-gray-100">{children}</td>,
                        a: ({children, href}) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white/10 text-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-2 flex items-center space-x-2 text-red-400 bg-red-400/10 p-2 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="mx-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">
              {analysisContext ? 'Ask about this address:' : 'Try asking:'}
            </p>
            <div className="space-y-1">
              {(analysisContext 
                ? suggestedQuestions.slice(3, 6) // Address-specific questions
                : suggestedQuestions.slice(0, 3)  // General questions
              ).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="w-full text-left text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded transition-colors"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="border-t border-white/10 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Solana security..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
