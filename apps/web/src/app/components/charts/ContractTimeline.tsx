'use client'

import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface ContractTimelineProps {
  startDate: string
  endDate: string
  totalValue: number | null
  pricePerUnit: number | null
  unitType: string | null
  escalationRate: number | null
  riskScore: number
  obligations: Array<{ next_due_date: string; status: string }>
}

type ViewMode = 'value' | 'price' | 'risk'

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export default function ContractTimeline({
  startDate,
  endDate,
  totalValue,
  pricePerUnit,
  unitType,
  escalationRate,
  riskScore,
  obligations,
}: ContractTimelineProps) {
  const { t, dateLocale } = useI18n()
  const [view, setView] = useState<ViewMode>('value')

  const hasFinancials = totalValue != null && totalValue > 0
  const hasPrice = pricePerUnit != null && pricePerUnit > 0
  const rate = escalationRate ?? 0

  const timelineData = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return []

    const months: Array<{
      date: string
      label: string
      value: number
      price: number
      risk: number
      isNow: boolean
      hasObligation: boolean
    }> = []

    const now = new Date()
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    const monthlyValue = hasFinancials ? totalValue / Math.max(totalMonths, 1) : 0
    const monthlyRate = rate / 100 / 12

    let cumulativeValue = 0
    let currentPrice = hasPrice ? pricePerUnit : 0

    // Build obligation date set for quick lookup
    const obligationMonths = new Set(
      obligations
        .filter((o) => o.next_due_date)
        .map((o) => {
          const d = new Date(o.next_due_date)
          return `${d.getFullYear()}-${d.getMonth()}`
        })
    )

    for (let i = 0; i <= totalMonths; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      if (d > end) break

      // Escalation: compound monthly
      const escalationMultiplier = Math.pow(1 + monthlyRate, i)
      const escalatedMonthlyValue = monthlyValue * escalationMultiplier
      cumulativeValue += escalatedMonthlyValue
      currentPrice = hasPrice ? pricePerUnit * escalationMultiplier : 0

      // Risk decays slightly over time as contract matures, spikes near end
      const progress = i / Math.max(totalMonths, 1)
      const timeRisk = progress > 0.8 ? riskScore * (1 + (progress - 0.8) * 2) : riskScore * (0.85 + progress * 0.15)

      const monthKey = `${d.getFullYear()}-${d.getMonth()}`
      const isCurrentMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()

      months.push({
        date: d.toISOString(),
        label: d.toLocaleDateString(dateLocale, { month: 'short', year: '2-digit' }),
        value: Math.round(cumulativeValue),
        price: Math.round(currentPrice * 100) / 100,
        risk: Math.round(Math.min(timeRisk, 10) * 10) / 10,
        isNow: isCurrentMonth,
        hasObligation: obligationMonths.has(monthKey),
      })
    }

    return months
  }, [startDate, endDate, totalValue, pricePerUnit, rate, riskScore, obligations, dateLocale, hasFinancials, hasPrice])

  if (timelineData.length < 2) return null

  const nowIndex = timelineData.findIndex((d) => d.isNow)

  const views: { key: ViewMode; label: string; available: boolean }[] = [
    { key: 'value', label: t.contractTimeline?.value ?? 'Cumulative Value', available: hasFinancials },
    { key: 'price', label: t.contractTimeline?.priceUnit ?? `Price/${unitType === 'm2' ? 'm²' : 'sqft'}`, available: hasPrice },
    { key: 'risk', label: t.contractTimeline?.riskOverTime ?? 'Risk Over Time', available: true },
  ]

  const availableViews = views.filter((v) => v.available)
  const activeView = availableViews.find((v) => v.key === view) ? view : availableViews[0]?.key ?? 'risk'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t.contractTimeline?.title ?? 'Contract Timeline'}
        </h3>
        <div className="flex gap-1">
          {availableViews.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeView === v.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {rate > 0 && (activeView === 'value' || activeView === 'price') && (
        <p className="text-xs text-gray-400 mb-3">
          {t.contractTimeline?.escalation ?? 'Annual escalation'}: {rate}%
        </p>
      )}

      <ResponsiveContainer width="100%" height={260}>
        {activeView === 'risk' ? (
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-gray-600">{t.table?.riskScore ?? 'Risk'}: {payload[0].value}/10</p>
                    {payload[0].payload?.hasObligation && (
                      <p className="text-amber-600 font-medium">{t.contractTimeline?.obligationDue ?? 'Obligation due'}</p>
                    )}
                  </div>
                )
              }}
            />
            {nowIndex >= 0 && (
              <ReferenceLine x={timelineData[nowIndex].label} stroke="#6366f1" strokeDasharray="4 4" label={{ value: t.contractTimeline?.today ?? 'Today', position: 'top', fontSize: 10, fill: '#6366f1' }} />
            )}
            <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeView === 'value' ? '#10b981' : '#f59e0b'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={activeView === 'value' ? '#10b981' : '#f59e0b'} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const val = payload[0].value as number
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-gray-600">
                      {activeView === 'value'
                        ? `$${val.toLocaleString()}`
                        : `$${val.toLocaleString()} / ${unitType === 'm2' ? 'm²' : 'sqft'}`}
                    </p>
                    {payload[0].payload?.hasObligation && (
                      <p className="text-amber-600 font-medium">{t.contractTimeline?.obligationDue ?? 'Obligation due'}</p>
                    )}
                  </div>
                )
              }}
            />
            {nowIndex >= 0 && (
              <ReferenceLine x={timelineData[nowIndex].label} stroke="#6366f1" strokeDasharray="4 4" label={{ value: t.contractTimeline?.today ?? 'Today', position: 'top', fontSize: 10, fill: '#6366f1' }} />
            )}
            <Area
              type="monotone"
              dataKey={activeView === 'value' ? 'value' : 'price'}
              stroke={activeView === 'value' ? '#10b981' : '#f59e0b'}
              strokeWidth={2}
              fill="url(#timelineGrad)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
