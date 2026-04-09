export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

const DEMO_CONTRACTS = [
  {
    user_id: DEMO_USER_ID,
    name: 'Contrato de Arrendamiento — Oficina Central',
    type: 'Arrendamiento',
    party_a: 'Inmobiliaria Torres S.A.',
    party_b: 'TechStart SRL',
    start_date: '2024-03-01',
    end_date: '2027-02-28',
    renewal_type: 'auto-renewal',
    notice_days: 90,
    risk_score: 4,
    status: 'active',
    ai_summary: 'Contrato de arrendamiento comercial por 3 años para oficina de 120m² en zona empresarial. Incluye cláusula de escalación anual del 3%, opción de renovación automática y depósito de 2 meses. Riesgo moderado por falta de cláusula de terminación anticipada.',
    improvement_tips: ['Agregar cláusula de terminación anticipada con 60 días de aviso', 'Incluir límite máximo de escalación anual (cap del 5%)', 'Definir responsabilidades de mantenimiento estructural vs. cosmético', 'Agregar cláusula de fuerza mayor que cubra pandemias y desastres naturales'],
    raw_text: 'Contrato de arrendamiento entre Inmobiliaria Torres S.A. y TechStart SRL para el uso de oficina comercial ubicada en Av. Principal 456, Piso 3.',
    total_value: 216000,
    price_per_unit: 50,
    unit_type: 'm2',
    escalation_rate: 3,
  },
  {
    user_id: DEMO_USER_ID,
    name: 'NDA — Proyecto Alpha',
    type: 'NDA',
    party_a: 'TechStart SRL',
    party_b: 'DataVault Corp',
    start_date: '2025-01-15',
    end_date: '2026-01-14',
    renewal_type: 'none',
    notice_days: 30,
    risk_score: 6,
    status: 'active',
    ai_summary: 'Acuerdo de confidencialidad bilateral para intercambio de información técnica en el Proyecto Alpha. Vigencia de 1 año sin renovación automática. Riesgo moderado-alto por la amplitud de la definición de información confidencial y penalidades poco específicas.',
    improvement_tips: ['Definir con mayor precisión qué constituye "información confidencial"', 'Especificar montos de penalidad por incumplimiento', 'Agregar cláusula de devolución o destrucción de materiales al término', 'Incluir jurisdicción específica para resolución de disputas', 'Limitar el alcance temporal de la obligación de confidencialidad post-terminación'],
    raw_text: 'Acuerdo de confidencialidad entre TechStart SRL y DataVault Corp para el intercambio de información relacionada con el Proyecto Alpha.',
  },
  {
    user_id: DEMO_USER_ID,
    name: 'Licencia de Software — ERP Cloud',
    type: 'Licencia',
    party_a: 'CloudSoft International',
    party_b: 'TechStart SRL',
    start_date: '2024-06-01',
    end_date: '2025-05-31',
    renewal_type: 'auto-renewal',
    notice_days: 60,
    risk_score: 7,
    status: 'expiring',
    ai_summary: 'Licencia SaaS para sistema ERP con 25 usuarios. Renovación automática anual con incremento del 8%. Riesgo alto por cláusula de lock-in de datos, SLA sin penalidades concretas y escalación de precio agresiva sin tope máximo.',
    improvement_tips: ['Negociar un tope máximo de escalación anual (cap del 5%)', 'Exigir cláusula de portabilidad de datos en formato estándar', 'Agregar SLA con penalidades específicas (créditos por downtime)', 'Incluir derecho de auditoría sobre prácticas de seguridad del proveedor', 'Definir proceso de transición al finalizar el contrato'],
    raw_text: 'Contrato de licencia de software entre CloudSoft International y TechStart SRL para el uso del sistema ERP Cloud, modalidad SaaS.',
    total_value: 45000,
    price_per_unit: 150,
    unit_type: 'user',
    escalation_rate: 8,
  },
]

const DEMO_OBLIGATIONS = [
  { description: 'Pago mensual de arrendamiento — $6,000/mes', frequency: 'monthly', status: 'pending', risk_level: 'medium' },
  { description: 'Revisión anual de condiciones del inmueble', frequency: 'annually', status: 'pending', risk_level: 'low' },
  { description: 'Entrega de reporte trimestral de uso de datos', frequency: 'quarterly', status: 'pending', risk_level: 'medium' },
  { description: 'Renovación de licencias de usuario — revisar antes del 1 de abril', frequency: 'annually', status: 'overdue', risk_level: 'high' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedDemoData(supabase: any) {
  // Check if demo contracts already exist
  const { count } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', DEMO_USER_ID)

  if (count && count > 0) return // Demo data already exists

  // Ensure demo user exists
  await supabase
    .from('users')
    .upsert({
      id: DEMO_USER_ID,
      email: 'demo@contractos.app',
      google_id: 'demo',
      plan: 'pro',
      trial_ends_at: '2099-12-31T00:00:00Z',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email', ignoreDuplicates: true })

  // Insert demo contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .insert(DEMO_CONTRACTS)
    .select('id')

  if (!contracts || contracts.length === 0) return

  // Insert obligations for first and third contracts
  const obligationInserts = [
    { contract_id: contracts[0].id, ...DEMO_OBLIGATIONS[0], next_due_date: getNextMonthDate() },
    { contract_id: contracts[0].id, ...DEMO_OBLIGATIONS[1], next_due_date: getNextYearDate() },
    { contract_id: contracts[1].id, ...DEMO_OBLIGATIONS[2], next_due_date: getNextQuarterDate() },
    { contract_id: contracts[2].id, ...DEMO_OBLIGATIONS[3], next_due_date: getPastDate(15) },
  ]
  await supabase.from('obligations').insert(obligationInserts)

  // Insert alerts
  const alertInserts = [
    { contract_id: contracts[2].id, message: 'Licencia ERP Cloud expira en 60 días', severity: 'warning', trigger_date: getDateDaysFromNow(-60), status: 'unread' },
    { contract_id: contracts[2].id, message: 'Licencia ERP Cloud expira en 30 días — acción requerida', severity: 'critical', trigger_date: getDateDaysFromNow(-30), status: 'unread' },
    { contract_id: contracts[0].id, message: 'Revisión anual de arrendamiento en 90 días', severity: 'info', trigger_date: getDateDaysFromNow(90), status: 'unread' },
  ]
  await supabase.from('alerts').insert(alertInserts)
}

function getNextMonthDate() {
  const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]
}
function getNextQuarterDate() {
  const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]
}
function getNextYearDate() {
  const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]
}
function getPastDate(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0]
}
function getDateDaysFromNow(offsetDays: number) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString().split('T')[0]
}

export async function POST() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Seed demo data if missing
  try {
    await seedDemoData(supabase)
  } catch (err) {
    console.error('Failed to seed demo data:', err)
    // Non-fatal — continue setting cookie even if seed fails
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('demo_mode', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
    sameSite: 'strict',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('demo_mode')
  return response
}
