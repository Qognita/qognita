'use client';

import { useState } from 'react';
import { Search, Plus, MessageSquare, X, Menu, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ id: string; content: string; isUser: boolean; timestamp: Date }>;
  timestamp: Date;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  chatSessions?: ChatSession[];
  currentChatId?: string | null;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  chatSessions = [],
  currentChatId,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chatSessions.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 rounded-lg border border-white/20 bg-white/10 p-2 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay - Only show on mobile screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-80 transform border-r border-white/10 bg-white/5 backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold text-white">Chat History</h2>
            <button
              onClick={onToggle}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={onNewChat}
              className="w-full border-none bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {filteredChats.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>No chats found</p>
                  <p className="text-sm">Start a new conversation!</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat?.(chat.id)}
                    className={`group cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:scale-[1.02] ${
                      currentChatId === chat.id
                        ? 'border-teal-400/50 bg-white/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium text-white">{chat.title}</h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatTimestamp(chat.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat?.(chat.id);
                        }}
                        className="rounded p-1 text-gray-400 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
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
          <div className="border-t border-white/10 p-4">
            <div className="text-center text-xs text-gray-400">
              <p>Qognita AI Assistant</p>
              <p>Powered by Morpheus & OpenAI</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
