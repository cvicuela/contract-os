export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const { alertId, days } = body as { alertId?: string; days?: number }

    if (!alertId || typeof alertId !== 'string') {
      return NextResponse.json({ error: '"alertId" is required' }, { status: 400 })
    }

    if (!days || typeof days !== 'number' || days < 1 || days > 365) {
      return NextResponse.json({ error: '"days" must be a number between 1 and 365' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Verify the alert belongs to the user and get contract deadline
    const { data: alertCheck } = await supabase
      .from('alerts')
      .select('id, contract_id, contracts!inner(user_id, end_date)')
      .eq('id', alertId)
      .eq('contracts.user_id', userId)
      .single()

    if (!alertCheck) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const snoozeUntil = new Date(Date.now() + days * 86_400_000)
    const contractData = alertCheck.contracts as { end_date?: string } | null

    if (contractData?.end_date) {
      const deadline = new Date(contractData.end_date)
      if (snoozeUntil > deadline) {
        return NextResponse.json(
          { error: 'Snooze date cannot exceed the contract end date' },
          { status: 422 }
        )
      }
    }

    const { data, error } = await supabase
      .from('alerts')
      .update({
        snoozed_until: snoozeUntil.toISOString().split('T')[0],
        status: 'read',
      })
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error snoozing alert:', error)
      return NextResponse.json({ error: 'Failed to snooze alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: data })
  } catch (err) {
    console.error('Unexpected error in POST /api/alerts/snooze:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
