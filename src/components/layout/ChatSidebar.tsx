'use client'

import { useState } from 'react'
import { Search, Plus, MessageSquare, X, Menu, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatSession {
  id: string
  title: string
  messages: Array<{id: string, content: string, isUser: boolean, timestamp: Date}>
  timestamp: Date
}

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  onSelectChat?: (chatId: string) => void
  onDeleteChat?: (chatId: string) => void
  chatSessions?: ChatSession[]
  currentChatId?: string | null
}

export function ChatSidebar({ 
  isOpen, 
  onToggle, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat, 
  chatSessions = [], 
  currentChatId 
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = chatSessions.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  return (
    <>
      {/* Sidebar Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className="fixed top-20 left-4 z-50 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-2 rounded-lg hover:bg-white/20 transition-all duration-200 shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay - Only show on mobile screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Chat History</h2>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {filteredChats.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No chats found</p>
                  <p className="text-sm">Start a new conversation!</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat?.(chat.id)}
                    className={`group border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      currentChatId === chat.id 
                        ? 'bg-white/10 border-teal-400/50' 
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {chat.title}
                        </h3>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(chat.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteChat?.(chat.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 p-1 rounded hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-gray-400 text-center">
              <p>Qognita AI Assistant</p>
              <p>Powered by Morpheus & OpenAI</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
