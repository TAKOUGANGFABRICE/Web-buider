import React from 'react'
import { mockTrafficData } from '../data/mockData'

export const TrafficAnalyticsChart: React.FC = () => {
  const maxValue = Math.max(...mockTrafficData.map(d => d.visits))
  const width = 600
  const height = 200
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const barWidth = chartWidth / mockTrafficData.length - 10

  const getBarHeight = (value: number) => (value / maxValue) * chartHeight
  const getBarX = (index: number) => padding + index * (chartWidth / mockTrafficData.length) + 5
  const getBarY = (value: number) => padding + chartHeight - getBarHeight(value)

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Traffic Analytics</h3>
          <p className="mt-1 text-sm text-slate-600">Daily visitor overview</p>
        </div>
        <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>
      <div className="mt-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = padding + chartHeight - chartHeight * tick
            const value = Math.round(maxValue * tick)
            return (
              <g key={tick}>
                <line x1={padding - 5} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs fill-slate-600">
                  {value}
                </text>
              </g>
            )
          })}

          {mockTrafficData.map((data, index) => (
            <g key={index}>
              <rect
                x={getBarX(index)}
                y={getBarY(data.visits)}
                width={barWidth}
                height={getBarHeight(data.visits)}
                rx="4"
                fill="#6366f1"
                className="hover:fill-brand-600"
              />
              <text
                x={getBarX(index) + barWidth / 2}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-slate-600"
              >
                {data.day}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm text-slate-600">Total visits</p>
          <p className="text-lg font-semibold text-slate-900">1,270</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Avg. daily</p>
          <p className="text-lg font-semibold text-slate-900">181</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Peak day</p>
          <p className="text-lg font-semibold text-slate-900">Fri</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Growth</p>
          <p className="text-lg font-semibold text-green-600">+12.5%</p>
        </div>
      </div>
    </div>
  )
}