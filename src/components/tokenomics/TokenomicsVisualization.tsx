'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DistributionChart } from './DistributionChart'
import { VestingTimeline } from './VestingTimeline'
import { StakingRewards } from './StakingRewards'
import { BurnProjection } from './BurnProjection'
import { TokenomicsChartData } from '@/services/tokenomics-tools'
import { PieChart, TrendingUp, Lock, Flame } from 'lucide-react'

interface TokenomicsVisualizationProps {
  chartData: TokenomicsChartData
  tokenomics: {
    totalSupply: number
    utilities: string[]
    governance: string
    staking: {
      enabled: boolean
      apy: string
      lockPeriods: string[]
    }
    deflationary: {
      enabled: boolean
      burnMechanism: string
      burnRate: string
    }
  }
  analysis: string
  risks: string[]
  recommendations: string[]
}

export function TokenomicsVisualization({ 
  chartData, 
  tokenomics,
  analysis,
  risks,
  recommendations
}: TokenomicsVisualizationProps) {
  const [activeTab, setActiveTab] = useState('distribution')
  
  const categories = chartData.distribution.map(d => d.category)
  const colors = chartData.distribution.map(d => d.color || '#8b5cf6')

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokenomics.totalSupply.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Fixed maximum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Allocation Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.distribution.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Distribution types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Staking APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {tokenomics.staking.apy}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {tokenomics.staking.enabled ? 'Active' : 'Disabled'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Burn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {tokenomics.deflationary.burnRate}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {tokenomics.deflationary.enabled ? 'Active' : 'Disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tokenomics Visualization</CardTitle>
          <CardDescription>
            Comprehensive visual analysis of token distribution, vesting, staking, and burn mechanics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="distribution" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Distribution</span>
              </TabsTrigger>
              <TabsTrigger value="vesting" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Vesting</span>
              </TabsTrigger>
              <TabsTrigger value="staking" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Staking</span>
              </TabsTrigger>
              <TabsTrigger value="burn" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                <span className="hidden sm:inline">Burns</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="distribution" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Token Distribution</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    How tokens are allocated across different stakeholder groups
                  </p>
                </div>
                <DistributionChart data={chartData.distribution} />
              </div>
            </TabsContent>

            <TabsContent value="vesting" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Vesting Schedule</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Token release timeline over 48 months for each allocation category
                  </p>
                </div>
                <VestingTimeline 
                  data={chartData.vestingTimeline} 
                  categories={categories}
                  colors={colors}
                />
              </div>
            </TabsContent>

            <TabsContent value="staking" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Staking Rewards</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Annual percentage yields for different lock periods
                  </p>
                </div>
                <StakingRewards data={chartData.stakingTiers} />
              </div>
            </TabsContent>

            <TabsContent value="burn" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Supply & Burn Projection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Token supply reduction over time through burn mechanisms
                  </p>
                </div>
                <BurnProjection data={chartData.burnProjections} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Token Utilities */}
      <Card>
        <CardHeader>
          <CardTitle>Token Utilities</CardTitle>
          <CardDescription>Primary use cases within the ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tokenomics.utilities.map((utility, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                <span className="text-sm">{utility}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Governance */}
      <Card>
        <CardHeader>
          <CardTitle>Governance Structure</CardTitle>
          <CardDescription>How token holders participate in decision-making</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {tokenomics.governance}
          </p>
        </CardContent>
      </Card>

      {/* Analysis, Risks, and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {analysis}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-orange-600 dark:text-orange-400">
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {risks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 mt-0.5">⚠️</span>
                  <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-600 dark:text-green-400">
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
