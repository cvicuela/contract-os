export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!
const STARTER_PLAN_ID = process.env.PAYPAL_STARTER_PLAN_ID ?? 'P-48864583F3428854WNHLIZ2I'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get('subscription_id')
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://contract-os-app.netlify.app'

  if (subscriptionId) {
    try {
      const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
      const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET!
      const PAYPAL_API = process.env.PAYPAL_API_URL ?? 'https://api-m.sandbox.paypal.com'

      // Get access token
      const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })
      const tokenData = await tokenRes.json()

      // Get subscription details
      const subRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      const subData = await subRes.json()

      const subscriberEmail = subData.subscriber?.email_address
      const planId = subData.plan_id
      const isStarter = planId === STARTER_PLAN_ID

      if (subscriberEmail) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        const plan = isStarter ? 'starter' : 'professional'
        const contractLimit = isStarter ? 10 : 25

        // Update user plan in database
        await supabase
          .from('users')
          .update({
            plan,
            plan_contract_limit: contractLimit,
            paypal_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('email', subscriberEmail)

        // If user doesn't exist yet, create them
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', subscriberEmail)
          .maybeSingle()

        if (!existing) {
          await supabase.from('users').insert({
            email: subscriberEmail,
            plan,
            plan_contract_limit: contractLimit,
            paypal_subscription_id: subscriptionId,
            trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }

      console.log(`Subscription ${subscriptionId} activated: ${subData.plan_id} for ${subscriberEmail}`)
    } catch (err) {
      console.error('PayPal success callback error:', err)
    }
  }

  // PayPal sends its own payment confirmation email to the subscriber
  // No need for a separate receipt — redirect to dashboard
  return NextResponse.redirect(`${baseUrl}/?subscription=success`)
}
