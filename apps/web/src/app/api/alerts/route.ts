export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

interface Alert {
  id: string
  contract_id: string
  message: string
  severity: string
  trigger_date: string | null
  status: 'unread' | 'read' | 'dismissed'
  snoozed_until: string | null
  is_snoozed: boolean
  deadline: string | null
  created_at: string
  contract_name?: string | null
}

export async function GET() {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data, error } = await supabase
      .from('alerts')
      .select(`id, contract_id, message, severity, trigger_date, status, snoozed_until, created_at, contracts(name, end_date)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    const alerts: Alert[] = (data ?? []).map((row: Record<string, unknown>) => {
      const contractRelation = row.contracts as { name?: string; end_date?: string } | null
      const snoozedUntil = row.snoozed_until as string | null
      return {
        id: row.id as string,
        contract_id: row.contract_id as string,
        message: row.message as string,
        severity: row.severity as string,
        trigger_date: row.trigger_date as string | null,
        status: row.status as 'unread' | 'read' | 'dismissed',
        snoozed_until: snoozedUntil,
        // isSnoozed = snoozed_until is today or in the future
        is_snoozed: !!(snoozedUntil && snoozedUntil >= today),
        deadline: contractRelation?.end_date ?? null,
        created_at: row.created_at as string,
        contract_name: contractRelation?.name ?? null,
      }
    })

    const res = NextResponse.json({ alerts })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('Unexpected error in GET /api/alerts:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const { id, status } = body as { id?: string; status?: string }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: '"id" is required and must be a string' },
        { status: 400 }
      )
    }

    const validStatuses = ['read', 'dismissed'] as const
    type PatchStatus = (typeof validStatuses)[number]

    if (!status || !validStatuses.includes(status as PatchStatus)) {
      return NextResponse.json(
        { error: '"status" must be one of: read, dismissed' },
        { status: 400 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data, error } = await supabase
      .from('alerts')
      .update({ status: status as PatchStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      console.error('Supabase error updating alert:', error)
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ alert: data as Alert })
  } catch (err) {
    console.error('Unexpected error in PATCH /api/alerts:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
