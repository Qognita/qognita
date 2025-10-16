'use client';

import { useState } from 'react';
import { MessageSquare, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/forms/ChatInterface';
import { AnalyzeResponse } from '@/lib/types/api';

interface SidebarChatProps {
  analysisContext?: AnalyzeResponse | null;
}

export function SidebarChat({ analysisContext }: SidebarChatProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 transform">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-l-lg rounded-r-none bg-purple-600 p-3 text-white shadow-lg hover:bg-purple-700"
          >
            <MessageSquare className="h-5 w-5" />
            <ChevronLeft className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Sidebar Chat Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full border-l border-slate-600 bg-slate-800 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-96`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-600 bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            <span className="font-medium text-white">AI Security Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex h-full flex-col bg-slate-800">
          <div className="flex-1 overflow-hidden">
            <ChatInterface analysisContext={analysisContext} isExpanded={false} />
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
