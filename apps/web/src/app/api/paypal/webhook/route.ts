export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!
const STARTER_PLAN_ID = process.env.PAYPAL_STARTER_PLAN_ID ?? 'P-48864583F3428854WNHLIZ2I'

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()
    const eventType = event.event_type as string
    const resource = event.resource ?? {}

    console.log(`PayPal webhook: ${eventType}`, resource.id)

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
            plan_contract_limit: 3,
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
            plan_contract_limit: 3,
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
