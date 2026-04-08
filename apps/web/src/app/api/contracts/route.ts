export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, sanitizeSearch } from '@/lib/api-auth'

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

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('contracts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      const s = sanitizeSearch(search)
      if (s) {
        query = query.or(
          `name.ilike.%${s}%,party_a.ilike.%${s}%,party_b.ilike.%${s}%`
        )
      }
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error fetching contracts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contracts' },
        { status: 500 }
      )
    }

    const res = NextResponse.json({
      contracts: (data as Contract[]) ?? [],
      total: count ?? 0,
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('Unexpected error in GET /api/contracts:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
