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

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const nowIso = now.toISOString()
    const thirtyDaysIso = thirtyDaysFromNow.toISOString()

    // Single round-trip: stats + recent contracts + active alerts in parallel
    const [
      totalResult,
      activeResult,
      expiringSoonResult,
      highRiskResult,
      unreadAlertsResult,
      overdueObligationsResult,
      contractsResult,
      alertsResult,
    ] = await Promise.all([
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active').gte('end_date', nowIso).lte('end_date', thirtyDaysIso),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('risk_score', 7),
      supabase.from('alerts').select('*, contracts!inner(user_id)', { count: 'exact', head: true }).eq('contracts.user_id', userId).eq('status', 'unread'),
      supabase.from('obligations').select('*, contracts!inner(user_id)', { count: 'exact', head: true }).eq('contracts.user_id', userId).or(`status.eq.overdue,and(next_due_date.lt.${nowIso},status.eq.pending)`),
      supabase.from('contracts').select('id,name,type,party_a,party_b,start_date,end_date,renewal_type,notice_days,risk_score,status,file_url,ai_summary,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('alerts').select('id,contract_id,message,severity,trigger_date,status,created_at, contracts!inner(user_id)').eq('contracts.user_id', userId).eq('status', 'unread').order('trigger_date', { ascending: true }).limit(6),
    ])

    const stats = {
      total_contracts: totalResult.count ?? 0,
      active_contracts: activeResult.count ?? 0,
      expiring_soon: expiringSoonResult.count ?? 0,
      high_risk: highRiskResult.count ?? 0,
      pending_alerts: unreadAlertsResult.count ?? 0,
      overdue_obligations: overdueObligationsResult.count ?? 0,
    }

    const res = NextResponse.json({
      stats,
      contracts: contractsResult.data ?? [],
      alerts: alertsResult.data ?? [],
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('Unexpected error in GET /api/dashboard:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
