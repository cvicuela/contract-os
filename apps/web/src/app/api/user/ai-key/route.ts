export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { encrypt, decrypt } from '@/lib/encrypt'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

const VALID_PROVIDERS = ['anthropic', 'openai', 'gemini'] as const

export async function GET() {
  const { userId, isDemo, error: authError } = await requireAuth()
  if (authError) return authError
  if (isDemo) return NextResponse.json({ provider: null, keyHint: null })

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data } = await supabase
    .from('users')
    .select('ai_provider, ai_api_key_encrypted')
    .eq('id', userId)
    .single()

  if (!data?.ai_provider || !data?.ai_api_key_encrypted) {
    return NextResponse.json({ provider: null, keyHint: null })
  }

  try {
    const decrypted = decrypt(data.ai_api_key_encrypted)
    const keyHint = '...' + decrypted.slice(-6)
    return NextResponse.json({ provider: data.ai_provider, keyHint })
  } catch {
    return NextResponse.json({ provider: data.ai_provider, keyHint: '(error)' })
  }
}

export async function POST(request: NextRequest) {
  const { userId, isDemo, error: authError } = await requireAuth()
  if (authError) return authError
  if (isDemo) return NextResponse.json({ error: 'Demo mode cannot save keys' }, { status: 403 })

  const body = await request.json()
  const { provider, apiKey } = body as { provider?: string; apiKey?: string }

  if (!provider || !VALID_PROVIDERS.includes(provider as any)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 })
  }

  const encrypted = encrypt(apiKey.trim())

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { error } = await supabase
    .from('users')
    .update({ ai_provider: provider, ai_api_key_encrypted: encrypted })
    .eq('id', userId)

  if (error) {
    console.error('Failed to save AI key:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  const keyHint = '...' + apiKey.trim().slice(-6)
  return NextResponse.json({ success: true, provider, keyHint })
}

export async function DELETE() {
  const { userId, isDemo, error: authError } = await requireAuth()
  if (authError) return authError
  if (isDemo) return NextResponse.json({ error: 'Demo mode' }, { status: 403 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  await supabase
    .from('users')
    .update({ ai_provider: null, ai_api_key_encrypted: null })
    .eq('id', userId)

  return NextResponse.json({ success: true })
}
