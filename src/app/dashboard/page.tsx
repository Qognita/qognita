'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { ChatSidebar } from '@/components/layout/ChatSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, MessageSquare, Sparkles, Search, Code, TrendingUp, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TokenomicsMessage } from '@/components/chat/TokenomicsMessage';

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    tokenomicsData?: {
      tokenomics: any;
      chartData: any;
      analysis: string;
      risks: string[];
      recommendations: string[];
      projectName: string;
    };
  }>;
  timestamp: Date;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      isUser: boolean;
      timestamp: Date;
      tokenomicsData?: {
        tokenomics: any;
        chartData: any;
        analysis: string;
        risks: string[];
        recommendations: string[];
        projectName: string;
      };
    }>
  >([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChatTitle = (firstMessage: string) => {
    // Generate a simple title from the first message (max 50 chars)
    return firstMessage.length > 50 ? firstMessage.substring(0, 47) + '...' : firstMessage;
  };

  const saveCurrentChat = () => {
    if (messages.length > 0 && currentChatId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentChatId ? { ...session, messages, timestamp: new Date() } : session
        )
      );
    }
  };

  const handleNewChat = () => {
    // Save current chat if it has messages
    if (messages.length > 0) {
      const chatId = currentChatId || Date.now().toString();
      const firstUserMessage = messages.find((m) => m.isUser)?.content || 'New Chat';
      const title = generateChatTitle(firstUserMessage);

      if (!currentChatId) {
        // Create new chat session
        const newSession: ChatSession = {
          id: chatId,
          title,
          messages,
          timestamp: new Date(),
        };
        setChatSessions((prev) => [newSession, ...prev]);
      } else {
        saveCurrentChat();
      }
    }

    // Start new chat
    setMessages([]);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    // Save current chat before switching
    saveCurrentChat();

    // Load selected chat
    const selectedChat = chatSessions.find((session) => session.id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setCurrentChatId(chatId);
    }
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = (chatId: string) => {
    setChatSessions((prev) => prev.filter((session) => session.id !== chatId));

    // If we're deleting the current chat, start a new one
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(null);
    }
  };

  const exampleQueries = [
    {
      icon: Search,
      color: 'text-teal-400',
      title: 'Wallet Analysis',
      query: 'What tokens does wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU hold?',
      category: 'Live Data',
    },
    {
      icon: Code,
      color: 'text-emerald-400',
      title: 'Developer Help',
      query: 'How do I create a PDA in Anchor? Show me the code.',
      category: 'Documentation',
    },
    {
      icon: TrendingUp,
      color: 'text-cyan-400',
      title: 'DeFi Analysis',
      query: 'How do Jupiter swaps work? Show me a recent swap transaction.',
      category: 'Hybrid',
    },
    {
      icon: Shield,
      color: 'text-amber-400',
      title: 'Security Check',
      query: 'Is this token safe? Check for any security concerns: [paste token address]',
      category: 'Security',
    },
  ];

  const handleSendMessage = async (query?: string) => {
    const messageContent = query || inputValue.trim();
    if (!messageContent) {
      return;
    }

    // If this is the first message and no current chat, create a new chat session
    if (messages.length === 0 && !currentChatId) {
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
    }

    const userMessage = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call the new RAG-enabled chat API
      const response = await fetch('/api/chat-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          userId: user?.uid,
        }),
      });

      const data = await response.json();

      // Enhanced message with intent and sources
      let responseContent =
        data.response || 'Sorry, I encountered an error processing your request.';

      // Add source attribution if available
      if (data.sources) {
        if (data.sources.type === 'documentation' && data.sources.docs?.length > 0) {
          responseContent += '\n\n**Sources:**\n';
          data.sources.docs.forEach((doc: any) => {
            responseContent += `• [${doc.source_title}](${doc.source_url}) (similarity: ${(doc.similarity * 100).toFixed(1)}%)\n`;
          });
        } else if (data.sources.type === 'live_data') {
          responseContent += '\n\n*Data sourced from live Solana blockchain*';
        } else if (data.sources.type === 'hybrid') {
          responseContent +=
            '\n\n*Response combines live blockchain data with Solana documentation*';
        } else if (data.sources.type === 'tokenomics') {
          responseContent += '\n\n*Interactive tokenomics charts generated using AI*';
        }
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        isUser: false,
        timestamp: new Date(),
        tokenomicsData: data.sources?.type === 'tokenomics' ? data.sources.tokenomics_data : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 py-8">
          {/* Welcome Section - Show when no messages */}
          {messages.length === 0 && (
            <div className="mb-12 text-center">
              <div className="mb-8 flex items-center justify-center">
                <div className="relative">
                  <Brain className="h-20 w-20 text-blue-400 drop-shadow-lg" />
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"></div>
                </div>
                <div className="ml-6">
                  <h1 className="mb-3 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text font-raleway text-5xl font-bold text-transparent">
                    Ask Qognita Anything
                  </h1>
                  <p className="text-xl text-gray-300">Your AI assistant for everything Solana</p>
                </div>
              </div>

              {/* Example Queries */}
              <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 justify-center gap-6 md:grid-cols-2">
                {exampleQueries.map((example, index) => {
                  const IconComponent = example.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(example.query)}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-300 hover:scale-105 hover:border-blue-400/40 hover:bg-gradient-to-br hover:from-white/10 hover:to-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20"
                    >
                      <div className="flex items-start space-x-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 transition-all duration-300 group-hover:scale-110">
                          <IconComponent className={`h-6 w-6 ${example.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-3 text-lg font-semibold text-white">{example.title}</h3>
                          <p className="mb-4 text-sm leading-relaxed text-gray-300">{example.query}</p>
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-xs font-medium text-blue-300 backdrop-blur-sm">
                            {example.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto pb-32">
              <div className="mb-8 space-y-8 px-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`overflow-wrap-anywhere max-w-4xl break-words rounded-2xl px-8 py-6 ${message.isUser
                        ? 'bg-gradient-to-r from-navy-600 to-blue-600 text-white shadow-xl'
                        : message.tokenomicsData
                          ? 'w-full'
                          : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 text-white shadow-xl backdrop-blur-sm border border-white/10'
                        }`}
                    >
                      {!message.isUser && !message.tokenomicsData && (
                        <div className="mb-4 flex items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <Brain className="h-4 w-4 text-white" />
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-300">Qognita</span>
                        </div>
                      )}
                      {message.tokenomicsData ? (
                        <TokenomicsMessage
                          data={message.tokenomicsData}
                          projectName={message.tokenomicsData.projectName}
                        />
                      ) : (
                        <div className="markdown-content w-full overflow-x-auto text-base">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 px-8 py-6 shadow-xl backdrop-blur-sm border border-white/10">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                          <Brain className="h-4 w-4 text-white animate-pulse" />
                        </div>
                        <span className="ml-3 mr-4 text-sm font-medium text-gray-300">Qognita is thinking</span>
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
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
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-navy-900 via-navy-900/95 to-transparent p-6">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                <div className="flex space-x-6">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask anything about Solana... (Shift+Enter for new line)"
                    className="max-h-32 min-h-[3rem] flex-1 resize-none overflow-y-auto border-none bg-transparent text-lg text-white placeholder-gray-400 outline-none"
                    disabled={isLoading}
                    rows={1}
                    style={{
                      height: 'auto',
                      minHeight: '3rem',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="flex items-center space-x-3 self-end rounded-2xl bg-gradient-to-r from-navy-600 to-blue-600 px-8 py-3 text-white shadow-xl transition-all duration-200 hover:from-navy-700 hover:to-blue-700 hover:scale-105 disabled:from-gray-600 disabled:to-gray-600 disabled:hover:scale-100"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
