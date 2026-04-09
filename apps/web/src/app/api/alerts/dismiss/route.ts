export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

export async function PATCH(request: NextRequest) {
  try {
    const { userId, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const { alertId } = body as { alertId?: string }

    if (!alertId || typeof alertId !== 'string') {
      return NextResponse.json({ error: '"alertId" is required' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Verify the alert belongs to the user
    const { data: alertCheck } = await supabase
      .from('alerts')
      .select('id, contracts!inner(user_id)')
      .eq('id', alertId)
      .eq('contracts.user_id', userId)
      .single()

    if (!alertCheck) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('alerts')
      .update({ status: 'dismissed' })
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error dismissing alert:', error)
      return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: data })
  } catch (err) {
    console.error('Unexpected error in PATCH /api/alerts/dismiss:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
