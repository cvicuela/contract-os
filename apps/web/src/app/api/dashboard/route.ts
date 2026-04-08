import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

interface DashboardStats {
  total_contracts: number
  active_contracts: number
  expiring_soon: number        // end_date within next 30 days AND status='active'
  high_risk_contracts: number  // risk_score >= 7
  unread_alerts: number
  overdue_obligations: number
}

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const nowIso = now.toISOString()
    const thirtyDaysIso = thirtyDaysFromNow.toISOString()

    // Run all counts in parallel for performance
    const [
      totalResult,
      activeResult,
      expiringSoonResult,
      highRiskResult,
      unreadAlertsResult,
      overdueObligationsResult,
    ] = await Promise.all([
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('end_date', nowIso).lte('end_date', thirtyDaysIso),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).gte('risk_score', 7),
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
      supabase.from('obligations').select('*', { count: 'exact', head: true }).or(`status.eq.overdue,and(next_due_date.lt.${nowIso},status.eq.pending)`),
    ])

    // Collect any errors (non-fatal — return 0 for failed counts rather than crashing)
    const errors = [
      totalResult.error,
      activeResult.error,
      expiringSoonResult.error,
      highRiskResult.error,
      unreadAlertsResult.error,
      overdueObligationsResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Supabase errors in dashboard stats:', errors)
    }

    const stats: DashboardStats = {
      total_contracts: totalResult.count ?? 0,
      active_contracts: activeResult.count ?? 0,
      expiring_soon: expiringSoonResult.count ?? 0,
      high_risk_contracts: highRiskResult.count ?? 0,
      unread_alerts: unreadAlertsResult.count ?? 0,
      overdue_obligations: overdueObligationsResult.count ?? 0,
    }

    return NextResponse.json({ stats })
  } catch (err) {
    console.error('Unexpected error in GET /api/dashboard:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
