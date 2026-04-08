import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/encrypt'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, refreshToken, accessToken } = body as {
      userId: string
      email: string
      refreshToken: string
      accessToken: string
    }

    if (!userId || !email || !refreshToken || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, refreshToken, accessToken' },
        { status: 400 }
      )
    }

    const encryptedRefreshToken = encrypt(refreshToken)

    const now = new Date()
    const tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000) // now + 1 hour

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { error } = await supabase.from('user_tokens').upsert(
      {
        user_id: userId,
        email,
        refresh_token: encryptedRefreshToken,
        token_expiry: tokenExpiry.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      console.error('Supabase upsert error in save-token:', error)
      return NextResponse.json(
        { error: 'Failed to save token' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in POST /api/auth/save-token:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
