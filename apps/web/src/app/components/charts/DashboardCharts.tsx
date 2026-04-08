'use client'

import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

interface ChartData {
  byStatus: { name: string; value: number }[]
  byRisk: { name: string; count: number }[]
  byType: { name: string; count: number }[]
  expiryTimeline: { name: string; count: number }[]
  valueComparison: { name: string; value: number }[]
  pricePerUnit: { name: string; price: number; unit: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  expired: '#9ca3af',
  pending: '#6366f1',
  cancelled: '#ef4444',
}

const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[220px]">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 min-h-[220px]">{children}</div>
      )}
    </div>
  )
}

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; payload?: { name: string; unit?: string } }>; label?: string }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const unit = entry.payload?.unit
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-900">{label ?? entry.payload?.name}</p>
      <p className="text-gray-600">
        {unit
          ? `$${entry.value.toLocaleString()} / ${unit === 'm2' ? 'm²' : 'sqft'}`
          : `$${entry.value.toLocaleString()}`}
      </p>
    </div>
  )
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; payload?: { name: string } }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-900">{label ?? payload[0]?.payload?.name}</p>
      <p className="text-gray-600">{payload[0].value} contract{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/charts')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const empty = !loading && (!data || data.byStatus.length === 0)

  if (empty) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center">
        <p className="text-sm text-gray-400">Upload contracts to see analytics</p>
      </div>
    )
  }

  const hasValues = (data?.valueComparison?.length ?? 0) > 0
  const hasPrices = (data?.pricePerUnit?.length ?? 0) > 0

  return (
    <div className="space-y-4">
      {/* Row 1: Status + Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contract Status — Donut */}
        <ChartCard title="Contracts by Status" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.byStatus ?? []}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data?.byStatus.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#6366f1'} />
                ))}
              </Pie>
              <Tooltip content={<CountTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-gray-600 capitalize">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Risk Distribution — Bar */}
        <ChartCard title="Risk Distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.byRisk ?? []} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data?.byRisk.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Type + Expiry Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contracts by Type — Horizontal Bar */}
        <ChartCard title="Contracts by Type" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.byType ?? []} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expiry Timeline — Area */}
        <ChartCard title="Expiring Contracts (Next 12 Months)" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.expiryTimeline ?? []}>
              <defs>
                <linearGradient id="expiryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CountTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#expiryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Financial Charts (only if data exists) */}
      {(hasValues || hasPrices) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Contract Value Comparison */}
          {hasValues && (
            <ChartCard title="Total Contract Value (Top 10)" loading={loading}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.valueComparison ?? []} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Price Per Unit Comparison */}
          {hasPrices && (
            <ChartCard
              title={`Price per ${data?.pricePerUnit?.[0]?.unit === 'm2' ? 'm²' : 'sqft'} (Top 10)`}
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.pricePerUnit ?? []} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="price" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  )
}
