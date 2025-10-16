'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { VestingDataPoint } from '@/services/tokenomics-tools';

interface VestingTimelineProps {
  data: VestingDataPoint[];
  categories: string[];
  colors: string[];
}

export function VestingTimeline({ data, categories, colors }: VestingTimelineProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="month"
            label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
            className="text-xs"
          />
          <YAxis
            label={{ value: 'Tokens Vested', angle: -90, position: 'insideLeft' }}
            className="text-xs"
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          />
          <Tooltip
            formatter={(value: number) => value.toLocaleString()}
            labelFormatter={(month) => `Month ${month}`}
          />
          <Legend />
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h4 className="mb-2 text-sm font-semibold">Vesting Schedule Overview</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This chart shows how tokens are released over time for each allocation category. Gradual
          vesting helps prevent market dumps and aligns long-term incentives.
        </p>
      </div>
    </div>
  );
}
