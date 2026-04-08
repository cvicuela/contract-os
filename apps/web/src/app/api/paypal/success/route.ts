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
      const accessToken = tokenData.access_token

      // Get subscription details
      const subRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      })
      const subData = await subRes.json()

      const subscriberEmail = subData.subscriber?.email_address
      const planId = subData.plan_id

      if (subscriberEmail) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        const plan = planId === 'P-9WS98349S69474714NHLHRGY' ? 'starter' : 'professional'
        const contractLimit = plan === 'starter' ? 10 : 25

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

        // Send receipt via PayPal invoice
        try {
          const today = new Date()
          const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          const amount = plan === 'starter' ? 29 : 79

          // Create invoice
          const invoiceRes = await fetch(`${PAYPAL_API}/v2/invoicing/invoices`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              detail: {
                invoice_number: `COS-${Date.now()}`,
                invoice_date: today.toISOString().split('T')[0],
                payment_term: { due_date: dueDate.toISOString().split('T')[0] },
                currency_code: 'USD',
                note: `Thank you for subscribing to ContractOS ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
                memo: `PayPal Subscription: ${subscriptionId}`,
              },
              invoicer: {
                name: { given_name: 'ContractOS', surname: 'Platform' },
                email_address: 'carlos@mynameisaro.com',
              },
              primary_recipients: [
                { billing_info: { email_address: subscriberEmail } },
              ],
              items: [
                {
                  name: `ContractOS ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
                  description: `Monthly subscription - ${contractLimit} contracts/month`,
                  quantity: '1',
                  unit_amount: { currency_code: 'USD', value: String(amount) },
                  unit_of_measure: 'QUANTITY',
                },
              ],
            }),
          })

          if (invoiceRes.ok) {
            const invoiceData = await invoiceRes.json()
            const invoiceId = invoiceData.href?.split('/').pop() ?? invoiceData.id

            if (invoiceId) {
              // Record payment on invoice
              await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${invoiceId}/payments`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  method: 'PAYPAL',
                  amount: { currency_code: 'USD', value: String(amount) },
                  date: today.toISOString().split('T')[0],
                }),
              })

              // Send invoice as receipt to subscriber
              await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${invoiceId}/send`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  send_to_invoicer: true,
                  send_to_recipient: true,
                }),
              })
            }
          }
        } catch (receiptErr) {
          console.error('Receipt send error (non-fatal):', receiptErr)
        }
      }
    } catch (err) {
      console.error('PayPal success callback error:', err)
    }
  }

  return NextResponse.redirect(`${baseUrl}/?subscription=success`)
}
