export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Obligation ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, snoozed_until } = body as {
      status?: string
      snoozed_until?: string // YYYY-MM-DD
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const update: Record<string, string> = {}

    if (status) {
      const validStatuses = ['pending', 'completed', 'overdue'] as const
      type ObligationStatus = (typeof validStatuses)[number]
      if (!validStatuses.includes(status as ObligationStatus)) {
        return NextResponse.json(
          { error: `"status" must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      update.status = status
    }

    if (snoozed_until) {
      const snoozeDate = new Date(snoozed_until)
      if (isNaN(snoozeDate.getTime())) {
        return NextResponse.json({ error: 'Invalid snoozed_until date' }, { status: 400 })
      }

      // Fetch the obligation to validate against its own deadline (next_due_date)
      const { data: obRow } = await supabase
        .from('obligations')
        .select('next_due_date')
        .eq('id', id)
        .single()

      if (obRow?.next_due_date) {
        const deadline = new Date(obRow.next_due_date)
        if (snoozeDate > deadline) {
          return NextResponse.json(
            { error: 'Snooze date cannot exceed the obligation due date' },
            { status: 422 }
          )
        }
      }

      update.snoozed_until = snoozed_until
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('obligations')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
      }
      console.error('Supabase error updating obligation:', error)
      return NextResponse.json(
        { error: 'Failed to update obligation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ obligation: data })
  } catch (err) {
    console.error('Unexpected error in PATCH /api/obligations/[id]:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
