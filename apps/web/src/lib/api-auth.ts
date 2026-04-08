import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Require an authenticated session or demo mode for API routes.
 * Returns the session if valid, or a 401 JSON response.
 * Demo mode users get a null session but no error.
 */
export async function requireAuth() {
  const session = await auth()
  if (session?.user?.id) {
    return { session, error: null, isDemo: false }
  }

  // Allow demo mode access
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_mode')?.value === '1'
  if (isDemo) {
    return { session: null, error: null, isDemo: true }
  }

  return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), isDemo: false }
}

/**
 * Sanitize search input to prevent PostgREST filter injection.
 * Strips characters that could manipulate .or() filter syntax.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,.()"'\\%]/g, '').trim()
}
