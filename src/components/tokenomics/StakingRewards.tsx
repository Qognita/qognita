'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { StakingTier } from '@/services/tokenomics-tools'

interface StakingRewardsProps {
  data: StakingTier[]
}

export function StakingRewards({ data }: StakingRewardsProps) {
  const colors = ['#8b5cf6', '#3b82f6', '#10b981']
  
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="period" 
            className="text-xs"
          />
          <YAxis 
            label={{ value: 'APY (%)', angle: -90, position: 'insideLeft' }}
            className="text-xs"
          />
          <Tooltip 
            formatter={(value: number) => `${value}% APY`}
            labelFormatter={(period) => `Lock Period: ${period}`}
          />
          <Legend />
          <Bar dataKey="apy" name="Annual Percentage Yield" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((tier, index) => (
          <div 
            key={index} 
            className="p-4 rounded-lg border-2 transition-all hover:shadow-lg"
            style={{ borderColor: colors[index % colors.length] }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{tier.period}</span>
              <span 
                className="text-2xl font-bold"
                style={{ color: colors[index % colors.length] }}
              >
                {tier.apy}%
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Lock your tokens for {tier.lockDays} days to earn {tier.apy}% annual rewards
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Daily Rate:</span>
                  <span className="font-medium">{(tier.apy / 365).toFixed(3)}%</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Monthly Rate:</span>
                  <span className="font-medium">{(tier.apy / 12).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
