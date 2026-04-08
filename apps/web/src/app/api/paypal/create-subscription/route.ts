export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_API = process.env.PAYPAL_API_URL ?? 'https://api-m.sandbox.paypal.com'

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { planId, email } = (await request.json()) as { planId: string; email?: string }

    const ALLOWED_PLAN_IDS = [
      process.env.PAYPAL_STARTER_PLAN_ID,
      process.env.PAYPAL_PRO_PLAN_ID,
    ].filter(Boolean)

    if (!planId || !ALLOWED_PLAN_IDS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const accessToken = await getAccessToken()

    const subscriptionPayload: Record<string, unknown> = {
      plan_id: planId,
      application_context: {
        brand_name: 'ContractOS',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env.NEXTAUTH_URL ?? 'https://contract-os-app.netlify.app'}/api/paypal/success`,
        cancel_url: `${process.env.NEXTAUTH_URL ?? 'https://contract-os-app.netlify.app'}/login`,
      },
    }

    if (email) {
      subscriptionPayload.subscriber = { email_address: email }
    }

    const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(subscriptionPayload),
    })

    const subscription = await res.json()

    if (!res.ok) {
      console.error('PayPal subscription error:', subscription)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 502 })
    }

    const approvalLink = subscription.links?.find((l: { rel: string }) => l.rel === 'approve')?.href

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalLink,
    })
  } catch (err) {
    console.error('PayPal create-subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
