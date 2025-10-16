'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Bot,
  User,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyzeResponse, ChatMessage } from '@/lib/types/api';
import { TokenomicsMessage } from '@/components/chat/TokenomicsMessage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  analysisContext?: AnalyzeResponse | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
}

export function ChatInterface({
  analysisContext,
  isExpanded = false,
  onToggleExpand,
  onClose,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your AI security assistant. Ask me anything about Solana security, or analyze an address first to get specific insights about it.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Add context message when analysis is completed
  useEffect(() => {
    if (analysisContext) {
      const contextMessage: ChatMessage = {
        role: 'assistant',
        content: `I can now answer questions about the analyzed address: ${analysisContext.address}. The trust score is ${analysisContext.trustScore}/100. What would you like to know about this address?`,
      };
      setMessages((prev) => [...prev, contextMessage]);
    }
  }, [analysisContext]);

  const detectBlockchainQuery = (
    query: string
  ): { isBlockchainQuery: boolean; address?: string; signature?: string } => {
    const queryLower = query.toLowerCase();

    // Check if it's a blockchain-specific query
    const blockchainKeywords = [
      'balance',
      'transaction',
      'wallet',
      'last',
      'recent',
      'sent',
      'received',
      'tokens',
      'history',
    ];
    const isBlockchainQuery = blockchainKeywords.some((keyword) => queryLower.includes(keyword));

    // Extract address or signature from context or query
    let address = analysisContext?.address;
    let signature: string | undefined;

    // Try to extract address from query (basic pattern matching)
    const addressMatch = query.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    if (addressMatch) {
      if (addressMatch[0].length > 80) {
        signature = addressMatch[0];
      } else {
        address = addressMatch[0];
      }
    }

    return { isBlockchainQuery, address, signature };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input.trim();
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Check if this is a tokenomics generation request
      const isTokenomicsRequest =
        userQuery.toLowerCase().includes('tokenomics') ||
        userQuery.toLowerCase().includes('generate token') ||
        userQuery.toLowerCase().includes('create tokenomics');

      if (isTokenomicsRequest) {
        // Import the generateTokenomics function dynamically
        const { generateTokenomics } = await import('@/services/tokenomics-tools');

        // Extract project details from the query (simple parsing)
        const projectName = extractProjectName(userQuery);

        // Generate tokenomics
        const tokenomicsResult = await generateTokenomics({
          name: projectName,
          description: `A Solana project requesting tokenomics design`,
          useCase: 'Platform utility, governance, and rewards',
          targetMarket: 'Solana ecosystem users',
        });

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: `I've generated comprehensive tokenomics for ${projectName}. Check out the interactive charts below!`,
          tokenomicsData: {
            ...tokenomicsResult,
            projectName,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Extract address from analysis context
      const address = analysisContext?.address || 'unknown';

      // If no address is available, provide a helpful message
      if (address === 'unknown') {
        const helpMessage: ChatMessage = {
          role: 'assistant',
          content:
            'Please analyze a Solana address first so I can provide specific information about that wallet, token, or program. You can enter any Solana address in the analysis form above.\n\nOr try asking me to "generate tokenomics for [your project name]"!',
        };
        setMessages((prev) => [...prev, helpMessage]);
        setIsLoading(false);
        return;
      }

      // Use enhanced chat API with proper parameters
      const response = await fetch('/api/chat-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          address: address,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error:', errorText);
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const result = await response.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response || 'I apologize, but I cannot provide a response at the moment.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');

      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again or check if the AI services are properly configured.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract project name from query
  const extractProjectName = (query: string): string => {
    // Try to extract project name from common patterns
    const patterns = [
      /tokenomics for (.+?)(?:\.|$)/i,
      /generate tokenomics for (.+?)(?:\.|$)/i,
      /create tokenomics for (.+?)(?:\.|$)/i,
      /(.+?) tokenomics/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'MyProject';
  };

  const suggestedQuestions = [
    'What should I look for in a safe Solana token?',
    'How can I identify a rug pull?',
    'What are the red flags for malicious programs?',
    'Is this address safe to interact with?',
    'What are the last 5 transactions for this wallet?',
    'Show me the balance of this address',
    'Who sent this transaction and to whom?',
    'What tokens does this wallet hold?',
  ];

  return (
    <Card className="flex h-full flex-col border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-white">
          <MessageSquare className="h-5 w-5 text-green-400" />
          <span>AI Security Assistant</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Ask questions about Solana security
        </CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-1 flex-col p-0">
        {/* Messages */}
        <div
          className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex w-full items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={`${
                    message.role === 'user'
                      ? 'max-w-[85%] rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 shadow-md'
                      : message.tokenomicsData
                        ? 'w-full'
                        : 'flex-1 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 px-5 py-4 shadow-xl backdrop-blur-sm'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-white">
                      {message.content}
                    </p>
                  ) : message.tokenomicsData ? (
                    <TokenomicsMessage
                      data={message.tokenomicsData}
                      projectName={message.tokenomicsData.projectName}
                    />
                  ) : (
                    <div className="markdown-content w-full overflow-x-auto text-base">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Copy button for assistant messages */}
              {message.role === 'assistant' && !message.tokenomicsData && (
                <button
                  onClick={() => copyToClipboard(message.content, index)}
                  className="group ml-14 mt-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-400 transition-all hover:bg-white/5 hover:text-gray-200"
                  title="Copy response"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span className="font-medium text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="font-medium">Copy response</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 px-5 py-4 shadow-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-green-400"></div>
                  <span className="text-base text-gray-200">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-2 flex items-center space-x-2 rounded-lg bg-red-400/10 p-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="mx-4 mb-4">
            <p className="mb-2 text-xs text-gray-400">
              {analysisContext ? 'Ask about this address:' : 'Try asking:'}
            </p>
            <div className="space-y-1">
              {(analysisContext
                ? suggestedQuestions.slice(3, 6) // Address-specific questions
                : suggestedQuestions.slice(0, 3)
              ) // General questions
                .map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="w-full rounded bg-white/5 p-2 text-left text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
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
              className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-gray-400"
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
  );
}
