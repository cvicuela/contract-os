'use client'

import { useState, useRef, useEffect } from 'react'
import { useI18n } from '@/i18n/context'

interface SnoozeOption {
  label: string
  date: string // YYYY-MM-DD
  capped: boolean // true if this option was capped at deadline
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysUntil(deadline: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const end = new Date(deadline)
  end.setHours(0, 0, 0, 0)
  return Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function buildOptions(deadline: string | null): SnoozeOption[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deadlineDate = deadline ? new Date(deadline) : null
  if (deadlineDate) deadlineDate.setHours(0, 0, 0, 0)

  const rawOptions = [
    { label: 'tomorrow', days: 1 },
    { label: 'in3Days', days: 3 },
    { label: 'in1Week', days: 7 },
    { label: 'in2Weeks', days: 14 },
  ]

  const seen = new Set<string>()
  const result: SnoozeOption[] = []

  for (const opt of rawOptions) {
    let target = addDays(today, opt.days)
    let capped = false

    if (deadlineDate && target >= deadlineDate) {
      // Cap at one day before deadline
      target = addDays(deadlineDate, -1)
      capped = true
    }

    // Skip if the capped date is today or in the past
    if (target <= today) continue

    const ymd = toYMD(target)
    if (seen.has(ymd)) continue
    seen.add(ymd)

    result.push({
      label: opt.label,
      date: ymd,
      capped,
    })
  }

  return result
}

interface Props {
  itemId: string
  deadline: string | null // YYYY-MM-DD — the hard limit
  snoozedUntil?: string | null
  apiPath: string // e.g. '/api/alerts' or '/api/obligations'
  onSnoozed?: (id: string, snoozedUntil: string) => void
  size?: 'sm' | 'xs'
}

export default function SnoozeButton({
  itemId,
  deadline,
  snoozedUntil,
  apiPath,
  onSnoozed,
  size = 'sm',
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t, dateLocale } = useI18n()

  const options = buildOptions(deadline)
  const daysLeft = deadline ? daysUntil(deadline) : null

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const snooze = async (date: string) => {
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch(`${apiPath}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozed_until: date }),
      })
      if (res.ok) {
        setDone(true)
        onSnoozed?.(itemId, date)
      }
    } finally {
      setLoading(false)
    }
  }

  const textSize = size === 'xs' ? 'text-xs' : 'text-xs'
  const px = size === 'xs' ? 'px-2 py-1' : 'px-3 py-1.5'

  // Already snoozed indicator
  if (done || (snoozedUntil && snoozedUntil >= new Date().toISOString().split('T')[0])) {
    const displayDate = snoozedUntil
      ? new Date(snoozedUntil).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
      : ''
    return (
      <span className={`inline-flex items-center gap-1 ${textSize} text-violet-600 bg-violet-50 border border-violet-200 ${px} rounded-lg`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t.snooze.snoozeUntil} {displayDate}
      </span>
    )
  }

  if (options.length === 0) return null

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        title={deadline ? `${daysLeft} days until deadline (${deadline})` : t.snooze.snooze}
        className={`inline-flex items-center gap-1 ${textSize} font-medium text-violet-600 hover:text-violet-800 border border-violet-200 hover:border-violet-300 hover:bg-violet-50 ${px} rounded-lg transition-colors disabled:opacity-50`}
      >
        {loading ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {t.snooze.snooze}
        <svg className="w-2.5 h-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg shadow-black/10 border border-gray-100 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.snooze.snoozeUntil}</p>
            {deadline && daysLeft !== null && (
              <p className="text-xs text-gray-400 mt-0.5">
                Deadline: <span className={daysLeft <= 7 ? 'text-red-500 font-medium' : 'text-gray-600'}>
                  {daysLeft}d left ({new Date(deadline).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })})
                </span>
              </p>
            )}
          </div>
          <div className="p-1">
            {options.map((opt) => (
              <button
                key={opt.date}
                onClick={() => snooze(opt.date)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                  opt.capped
                    ? 'text-amber-700 hover:bg-amber-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{opt.capped
                  ? `${t.snooze.dayBeforeDeadline.replace('{date}', new Date(opt.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }))}`
                  : (t.snooze as Record<string, string>)[opt.label] ?? opt.label}</span>
                <span className="text-gray-400">
                  {new Date(opt.date).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
