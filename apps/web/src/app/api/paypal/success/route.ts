export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get('subscription_id')
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://contract-os-app.netlify.app'

  if (subscriptionId) {
    // Fetch subscription details from PayPal to get plan info
    try {
      const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
      const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET!
      const PAYPAL_API = 'https://api-m.paypal.com'

      const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })
      const tokenData = await tokenRes.json()

      const subRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      })
      const subData = await subRes.json()

      if (subData.subscriber?.email_address) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        const planId = subData.plan_id
        const plan = planId === process.env.PAYPAL_STARTER_PLAN_ID ? 'starter' : 'professional'

        await supabase
          .from('users')
          .update({
            plan,
            paypal_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('email', subData.subscriber.email_address)
      }
    } catch (err) {
      console.error('PayPal success callback error:', err)
    }
  }

  return NextResponse.redirect(`${baseUrl}/?subscription=success`)
}
