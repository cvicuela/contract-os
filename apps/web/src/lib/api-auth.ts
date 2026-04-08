import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Require an authenticated session or demo mode for API routes.
 * Returns userId for data isolation — all queries should filter by this.
 * Demo users get the demo UUID, real users get their session ID.
 */
export async function requireAuth() {
  const session = await auth()
  if (session?.user?.id) {
    return { session, userId: session.user.id, error: null, isDemo: false }
  }

  // Allow demo mode access
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_mode')?.value === '1'
  if (isDemo) {
    return { session: null, userId: DEMO_USER_ID, error: null, isDemo: true }
  }

  return { session: null, userId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), isDemo: false }
}

/**
 * Sanitize search input to prevent PostgREST filter injection.
 * Strips characters that could manipulate .or() filter syntax.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,.()"'\\%]/g, '').trim()
}
