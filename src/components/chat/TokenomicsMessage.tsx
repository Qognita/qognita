'use client'

import { useState } from 'react'
import { TokenomicsVisualization } from '@/components/tokenomics/TokenomicsVisualization'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TokenomicsMessageProps {
  data: {
    tokenomics: any
    chartData: any
    analysis: string
    risks: string[]
    recommendations: string[]
  }
  projectName: string
}

export function TokenomicsMessage({ data, projectName }: TokenomicsMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="my-4 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-purple-100 dark:bg-purple-900/40 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
            📊
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">
              {projectName} Tokenomics
            </h3>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              AI-generated tokenomics with interactive charts
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-purple-700 dark:text-purple-300"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900">
          <TokenomicsVisualization
            chartData={data.chartData}
            tokenomics={data.tokenomics}
            analysis={data.analysis}
            risks={data.risks}
            recommendations={data.recommendations}
          />
        </div>
      )}
    </div>
  )
}
