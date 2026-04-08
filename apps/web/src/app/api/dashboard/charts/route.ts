export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

export async function GET() {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('name, status, type, risk_score, end_date, total_value, price_per_unit, unit_type')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = contracts ?? []

    // 1. Status breakdown
    const statusCounts: Record<string, number> = {}
    for (const c of rows) {
      const s = c.status ?? 'unknown'
      statusCounts[s] = (statusCounts[s] ?? 0) + 1
    }
    const byStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

    // 2. Risk distribution
    const riskBuckets = { Low: 0, Medium: 0, High: 0 }
    for (const c of rows) {
      const score = Number(c.risk_score) || 0
      if (score <= 3) riskBuckets.Low++
      else if (score <= 6) riskBuckets.Medium++
      else riskBuckets.High++
    }
    const byRisk = Object.entries(riskBuckets).map(([name, count]) => ({ name, count }))

    // 3. Contracts by type
    const typeCounts: Record<string, number> = {}
    for (const c of rows) {
      const t = c.type ?? 'Other'
      typeCounts[t] = (typeCounts[t] ?? 0) + 1
    }
    const byType = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // 4. Monthly expiry timeline (next 12 months)
    const now = new Date()
    const months: { name: string; count: number }[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      months.push({
        name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: 0,
      })
    }
    for (const c of rows) {
      if (!c.end_date) continue
      const end = new Date(c.end_date)
      const diffMonths =
        (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
      if (diffMonths >= 0 && diffMonths < 12) {
        months[diffMonths].count++
      }
    }

    // 5. Total contract value comparison (top 10 by value)
    const valueComparison = rows
      .filter((c) => c.total_value != null && Number(c.total_value) > 0)
      .map((c) => ({
        name: c.name?.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
        value: Number(c.total_value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // 6. Price per unit comparison (top 10)
    const pricePerUnit = rows
      .filter((c) => c.price_per_unit != null && Number(c.price_per_unit) > 0)
      .map((c) => ({
        name: c.name?.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
        price: Number(c.price_per_unit),
        unit: c.unit_type ?? 'sqft',
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 10)

    const res = NextResponse.json({
      byStatus,
      byRisk,
      byType,
      expiryTimeline: months,
      valueComparison,
      pricePerUnit,
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('Unexpected error in GET /api/dashboard/charts:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
