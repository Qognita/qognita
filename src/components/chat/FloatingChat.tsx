'use client'

import { useState } from 'react'
import { MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/forms/ChatInterface'
import { AnalyzeResponse } from '@/lib/types/api'

interface FloatingChatProps {
  analysisContext?: AnalyzeResponse | null
}

export function FloatingChat({ analysisContext }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl transition-all duration-300 ${
      isExpanded 
        ? 'inset-4' 
        : 'bottom-4 right-4 w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-400" />
          <span className="text-white font-medium">AI Security Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="h-full pb-16">
        <ChatInterface 
          analysisContext={analysisContext}
          isExpanded={isExpanded}
        />
      </div>
    </div>
  )
}
