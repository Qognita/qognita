'use client'

import { Shield, AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AnalyzeResponse } from '@/lib/types/api'
import { formatAddress, getTrustScoreColor, getRiskSeverityColor } from '@/lib/utils'

interface SecurityReportProps {
  result: AnalyzeResponse
  isLoading?: boolean
}

export function SecurityReport({ result, isLoading }: SecurityReportProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getTrustScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 60) return <Shield className="h-5 w-5 text-yellow-500" />
    return <AlertTriangle className="h-5 w-5 text-red-500" />
  }

  const getTrustScoreDescription = (score: number) => {
    if (score >= 80) return "High Trust - This address appears to be safe"
    if (score >= 60) return "Medium Trust - Exercise caution and review risks"
    if (score >= 40) return "Low Trust - Significant risks identified"
    return "Very Low Trust - High risk, avoid interaction"
  }

  return (
    <div className="space-y-6">
      {/* Trust Score Overview */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            {getTrustScoreIcon(result.trustScore)}
            <span>Security Analysis Results</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Analysis completed at {new Date(result.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Address Info */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="font-mono text-white">{formatAddress(result.address, 12)}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.address)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <a 
                    href={`https://solscan.io/account/${result.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Trust Score */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
              <div className={`text-6xl font-bold mb-2 ${getTrustScoreColor(result.trustScore)}`}>
                {result.trustScore}
              </div>
              <div className="text-white font-semibold mb-1">Trust Score</div>
              <div className="text-gray-300 text-sm">
                {getTrustScoreDescription(result.trustScore)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      {result.risks && result.risks.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Risk Assessment</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              {result.risks.length} risk{result.risks.length !== 1 ? 's' : ''} identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.risks.map((risk, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskSeverityColor(risk.severity)}>
                        {risk.severity}
                      </Badge>
                      <span className="font-medium text-white">{risk.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{risk.description}</p>
                  {risk.recommendation && (
                    <p className="text-blue-300 text-sm">
                      <strong>Recommendation:</strong> {risk.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Report */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span>AI Security Report</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Detailed analysis powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed break-words overflow-hidden">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium text-white mb-2 mt-4">{children}</h3>,
                p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                code: ({ children }) => <code className="bg-gray-800 text-blue-300 px-2 py-1 rounded text-sm font-mono break-all">{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4">{children}</blockquote>
              }}
              >
                {result.report}
              </ReactMarkdown>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      {result.parsedData && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-400" />
              <span>Technical Details</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Parsed account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black/20 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-300 break-words overflow-wrap-anywhere">
                {JSON.stringify(result.parsedData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
