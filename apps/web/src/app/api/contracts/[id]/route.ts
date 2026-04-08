import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

interface Contract {
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
}

interface Obligation {
  id: string
  contract_id: string
  title: string
  description: string | null
  responsible_party: string | null
  due_date: string | null
  next_due_date: string | null
  frequency: string | null
  status: 'pending' | 'completed' | 'overdue'
  created_at: string
}

interface Alert {
  id: string
  contract_id: string
  type: string
  message: string
  due_date: string | null
  status: 'unread' | 'read' | 'dismissed'
  created_at: string
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Fetch contract, obligations, and alerts in parallel
    const [contractResult, obligationsResult, alertsResult] = await Promise.all([
      supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('obligations')
        .select('*')
        .eq('contract_id', id)
        .order('next_due_date', { ascending: true }),
      supabase
        .from('alerts')
        .select('*')
        .eq('contract_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (contractResult.error) {
      if (contractResult.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }
      console.error('Supabase error fetching contract:', contractResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch contract' },
        { status: 500 }
      )
    }

    const contract = contractResult.data as Contract
    const obligations = (obligationsResult.data as Obligation[]) ?? []
    const alerts = (alertsResult.data as Alert[]) ?? []

    return NextResponse.json({
      contract: {
        ...contract,
        obligations,
        alerts,
      },
    })
  } catch (err) {
    console.error('Unexpected error in GET /api/contracts/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Delete the contract — cascade should handle obligations and alerts
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase error deleting contract:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete contract' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in DELETE /api/contracts/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
