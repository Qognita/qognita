'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { ChatSidebar } from '@/components/layout/ChatSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Brain, MessageSquare, Sparkles, Search, Code, TrendingUp, Shield } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatSession {
  id: string
  title: string
  messages: Array<{id: string, content: string, isUser: boolean, timestamp: Date}>
  timestamp: Date
}

export default function Dashboard() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date}>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateChatTitle = (firstMessage: string) => {
    // Generate a simple title from the first message (max 50 chars)
    return firstMessage.length > 50 ? firstMessage.substring(0, 47) + '...' : firstMessage
  }

  const saveCurrentChat = () => {
    if (messages.length > 0 && currentChatId) {
      setChatSessions(prev => prev.map(session => 
        session.id === currentChatId 
          ? { ...session, messages, timestamp: new Date() }
          : session
      ))
    }
  }

  const handleNewChat = () => {
    // Save current chat if it has messages
    if (messages.length > 0) {
      const chatId = currentChatId || Date.now().toString()
      const firstUserMessage = messages.find(m => m.isUser)?.content || 'New Chat'
      const title = generateChatTitle(firstUserMessage)
      
      if (!currentChatId) {
        // Create new chat session
        const newSession: ChatSession = {
          id: chatId,
          title,
          messages,
          timestamp: new Date()
        }
        setChatSessions(prev => [newSession, ...prev])
      } else {
        saveCurrentChat()
      }
    }
    
    // Start new chat
    setMessages([])
    setCurrentChatId(null)
    setIsSidebarOpen(false)
  }

  const handleSelectChat = (chatId: string) => {
    // Save current chat before switching
    saveCurrentChat()
    
    // Load selected chat
    const selectedChat = chatSessions.find(session => session.id === chatId)
    if (selectedChat) {
      setMessages(selectedChat.messages)
      setCurrentChatId(chatId)
    }
    setIsSidebarOpen(false)
  }

  const handleDeleteChat = (chatId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== chatId))
    
    // If we're deleting the current chat, start a new one
    if (currentChatId === chatId) {
      setMessages([])
      setCurrentChatId(null)
    }
  }

  const exampleQueries = [
    {
      icon: Search,
      color: 'text-teal-400',
      title: "Wallet Analysis",
      query: "What tokens does wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU hold?",
      category: "Live Data"
    },
    {
      icon: Code,
      color: 'text-emerald-400', 
      title: "Developer Help",
      query: "How do I create a PDA in Anchor? Show me the code.",
      category: "Documentation"
    },
    {
      icon: TrendingUp,
      color: 'text-cyan-400',
      title: "DeFi Analysis", 
      query: "How do Jupiter swaps work? Show me a recent swap transaction.",
      category: "Hybrid"
    },
    {
      icon: Shield,
      color: 'text-amber-400',
      title: "Security Check",
      query: "Is this token safe? Check for any security concerns: [paste token address]",
      category: "Security"
    }
  ]

  const handleSendMessage = async (query?: string) => {
    const messageContent = query || inputValue.trim()
    if (!messageContent) return

    // If this is the first message and no current chat, create a new chat session
    if (messages.length === 0 && !currentChatId) {
      const newChatId = Date.now().toString()
      setCurrentChatId(newChatId)
    }

    const userMessage = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call the new RAG-enabled chat API
      const response = await fetch('/api/chat-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          userId: user?.uid
        }),
      })

      const data = await response.json()
      
      // Enhanced message with intent and sources
      let responseContent = data.response || 'Sorry, I encountered an error processing your request.'
      
      // Add source attribution if available
      if (data.sources) {
        if (data.sources.type === 'documentation' && data.sources.docs?.length > 0) {
          responseContent += '\n\n**Sources:**\n'
          data.sources.docs.forEach((doc: any) => {
            responseContent += `• [${doc.source_title}](${doc.source_url}) (similarity: ${(doc.similarity * 100).toFixed(1)}%)\n`
          })
        } else if (data.sources.type === 'live_data') {
          responseContent += '\n\n*Data sourced from live Solana blockchain*'
        } else if (data.sources.type === 'hybrid') {
          responseContent += '\n\n*Response combines live blockchain data with Solana documentation*'
        }
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-800 to-blue-900 font-lato">
      <Header />
      
      {/* Chat Sidebar */}
      <ChatSidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        chatSessions={chatSessions}
        currentChatId={currentChatId}
      />

      <main className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col items-center justify-center flex-1">
        {/* Welcome Section - Show when no messages */}
        {messages.length === 0 && (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Brain className="h-16 w-16 text-blue-400 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 font-raleway">
                  Ask Qognita Anything
                </h1>
                <p className="text-gray-300 text-lg">
                  Your AI assistant for everything Solana
                </p>
              </div>
            </div>

            {/* Example Queries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 justify-center max-w-4xl mx-auto">
              {exampleQueries.map((example, index) => {
                const IconComponent = example.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(example.query)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 text-left transition-all duration-200 hover:scale-105 hover:border-blue-400/30"
                  >
                    <div className="flex items-start space-x-4">
                      <IconComponent className={`h-6 w-6 ${example.color} mt-1`} />
                      <div>
                        <h3 className="text-white font-semibold mb-2">{example.title}</h3>
                        <p className="text-gray-300 text-sm mb-2">{example.query}</p>
                        <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                          {example.category}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto pb-32">
            <div className="space-y-6 mb-8 px-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-6 py-4 break-words overflow-wrap-anywhere ${
                      message.isUser
                        ? 'bg-gradient-to-r from-navy-600 to-blue-600 text-white shadow-lg'
                        : 'text-white'
                    }`}
                  >
                    {!message.isUser && (
                      <div className="flex items-center mb-3">
                        <Brain className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-sm text-gray-300 font-medium">Qognita</span>
                      </div>
                    )}
                    <div className="prose prose-invert max-w-none text-white">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-blue-400 font-raleway">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-blue-300 font-raleway">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-blue-200 font-raleway">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-200">{children}</li>,
                          code: ({ children }) => <code className="bg-navy-800 px-2 py-1 rounded text-blue-300 text-sm">{children}</code>,
                          pre: ({ children }) => <pre className="bg-navy-800 p-4 rounded-lg overflow-x-auto mb-3">{children}</pre>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-300 mb-3">{children}</blockquote>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-6 py-4">
                    <div className="flex items-center">
                      <Brain className="h-5 w-5 text-blue-400 mr-2" />
                      <span className="text-sm text-gray-300 mr-3">Qognita is thinking</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-navy-900 to-transparent p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 shadow-xl">
              <div className="flex space-x-4">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask anything about Solana... (Shift+Enter for new line)"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none text-lg resize-none min-h-[2.5rem] max-h-32 overflow-y-auto"
                  disabled={isLoading}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '2.5rem'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg self-end"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
