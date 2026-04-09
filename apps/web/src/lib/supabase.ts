import { createClient } from '@supabase/supabase-js'

// =============================================================================
// Supabase client
// =============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_KEY!

/**
 * Singleton Supabase client.
 * Import and use this instance everywhere in the app — do not instantiate
 * a second client, as that would open unnecessary WebSocket connections.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// =============================================================================
// Domain interfaces
// =============================================================================

export interface Contract {
  id: string
  name: string
  type: string
  party_a: string
  party_b: string
  start_date: string
  end_date: string
  renewal_type: string
  notice_days: number
  risk_score: number
  status: 'active' | 'expired' | 'pending' | 'cancelled'
  file_url: string | null
  raw_text: string | null
  ai_summary: string | null
  created_at: string
  /** Eagerly loaded obligations (optional join) */
  obligations?: Obligation[]
  /** Eagerly loaded alerts (optional join) */
  alerts?: Alert[]
}

export interface Obligation {
  id: string
  contract_id: string
  description: string
  frequency: string
  next_due_date: string
  status: 'pending' | 'completed' | 'overdue'
  risk_level: 'low' | 'medium' | 'high'
}

export interface Alert {
  id: string
  contract_id: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  trigger_date: string
  status: 'unread' | 'read' | 'dismissed'
  created_at: string
}

export interface DashboardStats {
  /** Total contracts in the system */
  total_contracts: number
  /** Contracts whose status is 'active' */
  active_contracts: number
  /** Active contracts expiring within the next 30 days */
  expiring_soon: number
  /** Contracts with a risk_score >= 7 */
  high_risk: number
  /** Alerts whose status is 'unread' */
  pending_alerts: number
  /** Obligations whose status is 'overdue' */
  overdue_obligations: number
}

// =============================================================================
// Typed query helpers
// =============================================================================

/**
 * Fetch all contracts, optionally filtered by status.
 */
export async function getContracts(
  status?: Contract['status']
): Promise<Contract[]> {
  let query = supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`getContracts: ${error.message}`)
  }

  return (data ?? []) as Contract[]
}

/**
 * Fetch a single contract by ID with its obligations and alerts.
 */
export async function getContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, obligations(*), alerts(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`getContractById: ${error.message}`)
  }

  return data as Contract
}

/**
 * Fetch aggregated stats for the dashboard.
 * Runs four lightweight queries in parallel and assembles the result.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const in30Days = new Date(now)
  in30Days.setDate(in30Days.getDate() + 30)

  const [
    totalResult,
    activeResult,
    expiringSoonResult,
    highRiskResult,
    pendingAlertsResult,
    overdueResult,
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('end_date', in30Days.toISOString().split('T')[0])
      .gte('end_date', now.toISOString().split('T')[0]),
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .gte('risk_score', 7),
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unread'),
    supabase
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'overdue'),
  ])

  return {
    total_contracts:      totalResult.count       ?? 0,
    active_contracts:     activeResult.count      ?? 0,
    expiring_soon:        expiringSoonResult.count ?? 0,
    high_risk:            highRiskResult.count     ?? 0,
    pending_alerts:       pendingAlertsResult.count ?? 0,
    overdue_obligations:  overdueResult.count      ?? 0,
  }
}
