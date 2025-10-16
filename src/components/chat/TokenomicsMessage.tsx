'use client';

import { useState } from 'react';
import { TokenomicsVisualization } from '@/components/tokenomics/TokenomicsVisualization';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TokenomicsMessageProps {
  data: {
    tokenomics: any;
    chartData: any;
    analysis: string;
    risks: string[];
    recommendations: string[];
  };
  projectName: string;
}

export function TokenomicsMessage({ data, projectName }: TokenomicsMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between bg-purple-100 p-4 transition-colors hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 font-bold text-white">
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
        <Button variant="ghost" size="sm" className="text-purple-700 dark:text-purple-300">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="bg-white p-4 dark:bg-gray-900">
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
  );
}
