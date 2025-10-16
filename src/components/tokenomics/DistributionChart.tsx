'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TokenDistribution } from '@/services/tokenomics-tools';

interface DistributionChartProps {
  data: TokenDistribution[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Convert data to format Recharts expects
  const chartData = data.map((item) => ({
    ...item,
    name: item.category, // Recharts uses 'name' for legend
    value: item.percentage,
  }));

  return (
    <div className="h-[400px] w-full">
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
              props.payload.category,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
          >
            <div
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold">{item.category}</h4>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {item.percentage}%
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{item.amount.toLocaleString()} tokens</span>
                <span className="text-gray-500">Vesting: {item.vestingSchedule}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
