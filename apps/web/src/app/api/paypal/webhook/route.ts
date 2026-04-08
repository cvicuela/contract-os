export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!
const STARTER_PLAN_ID = process.env.PAYPAL_STARTER_PLAN_ID ?? 'P-48864583F3428854WNHLIZ2I'
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_API = process.env.PAYPAL_API_URL ?? 'https://api-m.sandbox.paypal.com'
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID ?? ''

async function verifyWebhookSignature(request: NextRequest, body: string): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) return true // Skip verification if no webhook ID configured

  const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const { access_token } = await tokenRes.json()

  const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      auth_algo: request.headers.get('paypal-auth-algo') ?? '',
      cert_url: request.headers.get('paypal-cert-url') ?? '',
      transmission_id: request.headers.get('paypal-transmission-id') ?? '',
      transmission_sig: request.headers.get('paypal-transmission-sig') ?? '',
      transmission_time: request.headers.get('paypal-transmission-time') ?? '',
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  })
  const verification = await verifyRes.json()
  return verification.verification_status === 'SUCCESS'
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify PayPal webhook signature
    const isValid = await verifyWebhookSignature(request, rawBody)
    if (!isValid) {
      console.error('PayPal webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event_type as string
    const resource = event.resource ?? {}

    console.log(`PayPal webhook: ${eventType}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    switch (eventType) {
      // Subscription activated (first payment successful)
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const email = resource.subscriber?.email_address
        const planId = resource.plan_id
        const subscriptionId = resource.id
        if (!email) break

        const plan = planId === STARTER_PLAN_ID ? 'starter' : 'professional'
        const limit = plan === 'starter' ? 10 : 25

        await supabase
          .from('users')
          .update({
            plan,
            plan_contract_limit: limit,
            paypal_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email)

        console.log(`Plan activated: ${plan} for ${email}`)
        break
      }

      // Subscription payment completed (recurring)
      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionId = resource.billing_agreement_id
        if (!subscriptionId) break

        // Update last payment date
        await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', subscriptionId)

        console.log(`Payment received for subscription ${subscriptionId}`)
        break
      }

      // Subscription cancelled
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const subscriptionId = resource.id
        if (!subscriptionId) break

        await supabase
          .from('users')
          .update({
            plan: 'trial',
            plan_contract_limit: 1,
            paypal_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)

        console.log(`Subscription ended: ${subscriptionId}`)
        break
      }

      // Subscription suspended (payment failed)
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = resource.id
        if (!subscriptionId) break

        await supabase
          .from('users')
          .update({
            plan: 'trial',
            plan_contract_limit: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)

        console.log(`Subscription suspended: ${subscriptionId}`)
        break
      }

      // Payment failed
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        console.log(`Payment failed for subscription: ${resource.id}`)
        break
      }

      default:
        console.log(`Unhandled PayPal event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('PayPal webhook error:', err)
    return NextResponse.json({ received: true })
  }
}
