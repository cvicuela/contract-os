import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Obligation ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body as { status?: string }

    const validStatuses = ['pending', 'completed', 'overdue'] as const
    type ObligationStatus = (typeof validStatuses)[number]

    if (!status || !validStatuses.includes(status as ObligationStatus)) {
      return NextResponse.json(
        { error: `"status" must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data, error } = await supabase
      .from('obligations')
      .update({ status: status as ObligationStatus })
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
