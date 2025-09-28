'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, Trash2 } from 'lucide-react'
import { formatAddress, getTrustScoreColor } from '@/lib/utils'

interface AnalysisHistoryItem {
  id: string
  address: string
  addressType: string
  trustScore: number | null
  timestamp: string
  risks: any[]
}

export function RecentAnalysis() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('qognita_analysis_history')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to load analysis history:', error)
      }
    }
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('qognita_analysis_history')
    setHistory([])
  }

  const removeItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem('qognita_analysis_history', JSON.stringify(newHistory))
  }

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'token': return '🪙'
      case 'program': return '⚙️'
      case 'transaction': return '📝'
      case 'wallet': return '👛'
      default: return '❓'
    }
  }

  const getRiskSummary = (risks: any[]) => {
    if (!risks || risks.length === 0) return 'No risks detected'
    const criticalCount = risks.filter(r => r.severity === 'critical').length
    const highCount = risks.filter(r => r.severity === 'high').length
    
    if (criticalCount > 0) return `${criticalCount} critical risk${criticalCount > 1 ? 's' : ''}`
    if (highCount > 0) return `${highCount} high risk${highCount > 1 ? 's' : ''}`
    return `${risks.length} risk${risks.length > 1 ? 's' : ''} detected`
  }

  if (history.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>Recent Analysis</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your analysis history will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent analysis found</p>
            <p className="text-sm">Analyze an address to see it here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>Recent Analysis</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              {history.length} recent analysis
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-2xl">
                  {getAddressTypeIcon(item.addressType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-mono text-sm text-white truncate">
                      {formatAddress(item.address, 8)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {item.addressType}
                    </Badge>
                    {item.trustScore !== null && (
                      <span className={`text-sm font-medium ${getTrustScoreColor(item.trustScore)}`}>
                        {item.trustScore}/100
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>{getRiskSummary(item.risks)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-gray-400 hover:text-white"
                >
                  <a
                    href={`https://solscan.io/account/${item.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to save analysis to history
export function saveAnalysisToHistory(analysisResult: any) {
  try {
    const historyItem: AnalysisHistoryItem = {
      id: Date.now().toString(),
      address: analysisResult.address,
      addressType: analysisResult.addressType || 'unknown',
      trustScore: analysisResult.trustScore,
      timestamp: analysisResult.timestamp || new Date().toISOString(),
      risks: analysisResult.risks || []
    }

    const existingHistory = JSON.parse(localStorage.getItem('qognita_analysis_history') || '[]')
    
    // Remove duplicate addresses and keep only the latest
    const filteredHistory = existingHistory.filter((item: AnalysisHistoryItem) => 
      item.address !== historyItem.address
    )
    
    // Add new item at the beginning and limit to 20 items
    const newHistory = [historyItem, ...filteredHistory].slice(0, 20)
    
    localStorage.setItem('qognita_analysis_history', JSON.stringify(newHistory))
  } catch (error) {
    console.error('Failed to save analysis to history:', error)
  }
}
