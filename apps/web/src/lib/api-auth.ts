import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Require an authenticated session for API routes.
 * Returns the session if valid, or a 401 JSON response.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, error: null }
}

/**
 * Sanitize search input to prevent PostgREST filter injection.
 * Strips characters that could manipulate .or() filter syntax.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,.()"'\\%]/g, '').trim()
}
