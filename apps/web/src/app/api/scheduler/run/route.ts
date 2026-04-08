import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

async function checkContracts() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const now = new Date()
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const nowISO = now.toISOString()

  // Fetch active contracts expiring within 90 days
  const { data: expiringContracts, error: contractsError } = await supabase
    .from('contracts')
    .select('id, name, end_date, notice_days')
    .eq('status', 'active')
    .lte('end_date', in90Days)
    .gte('end_date', nowISO)

  if (contractsError) {
    throw new Error(`Failed to fetch expiring contracts: ${contractsError.message}`)
  }

  const alertsCreated: number[] = []

  for (const contract of expiringContracts ?? []) {
    const daysLeft = Math.ceil(
      (new Date(contract.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    const severity =
      daysLeft <= 14 ? 'critical' : daysLeft <= 30 ? 'warning' : 'info'

    // Check if a similar alert already exists to avoid duplicates
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('contract_id', contract.id)
      .eq('status', 'unread')
      .ilike('message', `%expiring in ${daysLeft}%`)
      .maybeSingle()

    if (!existingAlert) {
      const { error: insertError } = await supabase.from('alerts').insert({
        contract_id: contract.id,
        message: `"${contract.name}" is expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        severity,
        trigger_date: nowISO,
        status: 'unread',
      })

      if (!insertError) alertsCreated.push(daysLeft)
    }
  }

  // Mark overdue obligations
  const { data: overdueObligations, error: obError } = await supabase
    .from('obligations')
    .select('id')
    .lt('next_due_date', nowISO)
    .eq('status', 'pending')

  if (!obError && overdueObligations && overdueObligations.length > 0) {
    await supabase
      .from('obligations')
      .update({ status: 'overdue' })
      .in(
        'id',
        overdueObligations.map((o) => o.id)
      )
  }

  return {
    expiringContractsChecked: (expiringContracts ?? []).length,
    alertsCreated: alertsCreated.length,
    overdueObligationsMarked: (overdueObligations ?? []).length,
  }
}

export async function GET() {
  try {
    const result = await checkContracts()

    return NextResponse.json({
      success: true,
      message: 'Contract checks completed',
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Unexpected error in GET /api/scheduler/run:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}
