'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BurnProjection as BurnProjectionType } from '@/services/tokenomics-tools'

interface BurnProjectionProps {
  data: BurnProjectionType[]
}

export function BurnProjection({ data }: BurnProjectionProps) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCirculating" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="quarter" 
            className="text-xs"
          />
          <YAxis 
            className="text-xs"
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="supply"
            name="Total Supply"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorSupply)"
          />
          <Area
            type="monotone"
            dataKey="circulatingSupply"
            name="Circulating Supply"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorCirculating)"
          />
          <Area
            type="monotone"
            dataKey="burned"
            name="Burned Tokens"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorBurned)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm font-semibold">Total Supply</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data[0]?.supply.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Fixed maximum supply
          </p>
        </div>
        
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm font-semibold">Circulating (Q8)</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data[data.length - 1]?.circulatingSupply.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            After 2 years of burns
          </p>
        </div>
        
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-semibold">Total Burned (Q8)</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {data[data.length - 1]?.burned.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {((data[data.length - 1]?.burned / data[0]?.supply) * 100).toFixed(2)}% of supply
          </p>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Deflationary Mechanism</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Token burns reduce circulating supply over time, creating scarcity and potentially increasing value. 
          This projection assumes consistent burn rate from transaction fees and other mechanisms.
        </p>
      </div>
    </div>
  )
}
