export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

interface ObligationRow {
  id: string
  contract_id: string
  description: string
  frequency: string
  next_due_date: string
  status: string
  risk_level: string
  contracts: { name: string } | null
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('obligations')
      .select(`
        id,
        contract_id,
        description,
        frequency,
        next_due_date,
        status,
        risk_level,
        contracts (
          name
        )
      `)
      .lt('next_due_date', now)
      .eq('status', 'pending')
      .order('next_due_date', { ascending: true })

    if (error) {
      console.error('Supabase error fetching overdue obligations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch overdue obligations' },
        { status: 500 }
      )
    }

    const obligations = (data as unknown as ObligationRow[]).map((row) => ({
      id: row.id,
      contract_id: row.contract_id,
      description: row.description,
      frequency: row.frequency,
      next_due_date: row.next_due_date,
      status: row.status,
      risk_level: row.risk_level ?? 'low',
      contract_name: row.contracts?.name ?? null,
    }))

    return NextResponse.json({ obligations })
  } catch (err) {
    console.error('Unexpected error in GET /api/obligations/overdue:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
