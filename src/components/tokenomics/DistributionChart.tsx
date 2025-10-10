'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { TokenDistribution } from '@/services/tokenomics-tools'

interface DistributionChartProps {
  data: TokenDistribution[]
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Convert data to format Recharts expects
  const chartData = data.map(item => ({
    ...item,
    name: item.category, // Recharts uses 'name' for legend
    value: item.percentage
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percentage }) => `${category}: ${percentage}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="percentage"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${value}% (${props.payload.amount.toLocaleString()} tokens)`,
              props.payload.category
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div 
              className="w-4 h-4 rounded mt-0.5 flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold text-sm">{item.category}</h4>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {item.percentage}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {item.description}
              </p>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-500">
                  {item.amount.toLocaleString()} tokens
                </span>
                <span className="text-gray-500">
                  Vesting: {item.vestingSchedule}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
