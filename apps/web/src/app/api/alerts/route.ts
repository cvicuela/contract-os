import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

interface Alert {
  id: string
  contract_id: string
  message: string
  severity: string
  trigger_date: string | null
  status: 'unread' | 'read' | 'dismissed'
  created_at: string
  contract_name?: string | null
  user_id?: string
}

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data, error } = await supabase
      .from('alerts')
      .select(`id, contract_id, message, severity, trigger_date, status, created_at, contracts(name)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    // Flatten the joined contract name into the alert object
    const alerts: Alert[] = (data ?? []).map((row: Record<string, unknown>) => {
      const contractRelation = row.contracts as { name?: string } | null
      return {
        id: row.id as string,
        contract_id: row.contract_id as string,
        message: row.message as string,
        severity: row.severity as string,
        trigger_date: row.trigger_date as string | null,
        status: row.status as 'unread' | 'read' | 'dismissed',
        created_at: row.created_at as string,
        contract_name: contractRelation?.name ?? null,
      }
    })

    return NextResponse.json({ alerts })
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
