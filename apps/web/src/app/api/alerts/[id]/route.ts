import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, snoozed_until } = body as {
      status?: string
      snoozed_until?: string // YYYY-MM-DD
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Build the update payload
    const update: Record<string, string> = {}

    if (status) {
      const validStatuses = ['read', 'dismissed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `"status" must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      update.status = status
    }

    if (snoozed_until) {
      // Validate it's a real date
      const snoozeDate = new Date(snoozed_until)
      if (isNaN(snoozeDate.getTime())) {
        return NextResponse.json({ error: 'Invalid snoozed_until date' }, { status: 400 })
      }

      // Fetch the alert to verify snooze doesn't exceed the contract deadline
      const { data: alertRow } = await supabase
        .from('alerts')
        .select('contract_id, contracts(end_date)')
        .eq('id', id)
        .single()

      if (alertRow) {
        const contractData = alertRow.contracts as { end_date?: string } | null
        if (contractData?.end_date) {
          const deadline = new Date(contractData.end_date)
          if (snoozeDate > deadline) {
            return NextResponse.json(
              { error: 'Snooze date cannot exceed the contract end date' },
              { status: 422 }
            )
          }
        }
      }

      update.snoozed_until = snoozed_until
      // Keep status as unread so it re-surfaces after snooze lifts
      if (!status) update.status = 'read'
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('alerts')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      console.error('Supabase error updating alert:', error)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: data })
  } catch (err) {
    console.error('Unexpected error in PATCH /api/alerts/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
