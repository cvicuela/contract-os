import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!

interface Contract {
  id: string
  name: string
  type: string
  party_a: string
  party_b: string
  start_date: string
  end_date: string
  renewal_type: string
  notice_days: number
  risk_score: number
  status: 'active' | 'expired' | 'pending' | 'cancelled'
  file_url: string | null
  raw_text: string | null
  ai_summary: string | null
  created_at: string
}

interface Obligation {
  id: string
  contract_id: string
  title: string
  description: string | null
  responsible_party: string | null
  due_date: string | null
  next_due_date: string | null
  frequency: string | null
  status: 'pending' | 'completed' | 'overdue'
  created_at: string
}

interface Alert {
  id: string
  contract_id: string
  type: string
  message: string
  due_date: string | null
  status: 'unread' | 'read' | 'dismissed'
  created_at: string
}

interface ParsedContractData {
  name?: string
  type?: string
  party_a?: string
  party_b?: string
  start_date?: string
  end_date?: string
  renewal_type?: string
  notice_days?: number
  risk_score?: number
  status?: 'active' | 'expired' | 'pending' | 'cancelled'
  ai_summary?: string
  improvement_tips?: string[]
  obligations?: Array<{
    title: string
    description?: string
    responsible_party?: string
    due_date?: string
    next_due_date?: string
    frequency?: string
    status?: 'pending' | 'completed' | 'overdue'
  }>
}

const EXTRACT_PROMPT = `You are a contract analyst. Return ONLY a valid JSON object — no markdown, no explanation.

Schema:
{"name":string,"type":string,"party_a":string,"party_b":string,"start_date":"YYYY-MM-DD|null","end_date":"YYYY-MM-DD|null","renewal_type":"auto-renewal|manual|evergreen|none","notice_days":integer,"risk_score":1-10,"status":"active|expired|pending|cancelled","ai_summary":"2-3 sentences","improvement_tips":["string (actionable tip)"],"obligations":[{"title":string,"description":string,"responsible_party":string,"due_date":"YYYY-MM-DD|null","next_due_date":"YYYY-MM-DD|null","frequency":"one-time|monthly|quarterly|annually|null","status":"pending|completed|overdue"}]}

Rules: null for unknown strings, 0 for unknown numbers. risk_score: consider financial exposure, data sensitivity, termination complexity.
improvement_tips: provide 4-7 specific, actionable bullet points that would make this contract a perfect 10/10. Each tip must identify a concrete gap or weakness found in this contract and explain exactly how to fix it (e.g. "Add a force majeure clause covering pandemic, natural disaster, and cyber-attack scenarios" not "Add missing clauses"). Focus on: missing protective clauses, vague language, liability gaps, IP ownership, data privacy, dispute resolution, termination rights, indemnification, and renewal terms.`

const VERIFY_PROMPT = `You are a contract data validator. You will receive a JSON object extracted from a contract by another AI, plus a short snippet of the original contract text.

Your job: fix any errors in the JSON — wrong dates, swapped parties, missed fields, bad risk_score — and return the corrected JSON.

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- Keep the exact same schema
- If a field looks correct, keep it as-is
- Fix dates to YYYY-MM-DD format if malformed
- risk_score must be 1-10 integer`

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    // Dynamically import to avoid Next.js bundler issues with pdfjs-dist
    const { PDFParse } = await import('pdf-parse') as unknown as { PDFParse: new (opts: { data: Uint8Array }) => { getText(): Promise<{ text: string }> } }
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    return result.text.replace(/\s{2,}/g, ' ').trim()
  }
  return buffer.toString('utf8')
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

async function parseContractWithClaude(
  text: string,
  contractName: string
): Promise<ParsedContractData> {
  const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY })

  // Step 1: Haiku extracts the full JSON (fast)
  const haikusMsg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: EXTRACT_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Contract name: "${contractName}"\n\n${text.slice(0, 30_000)}`,
      },
    ],
  })

  const haikuRaw = haikusMsg.content[0].type === 'text' ? haikusMsg.content[0].text : ''
  const haikuJson = stripFences(haikuRaw)

  // Step 2: Sonnet verifies Haiku's JSON against a short contract snippet (fast — only sees JSON + 3k chars)
  const verifyMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: VERIFY_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extracted JSON:\n${haikuJson}\n\nOriginal contract snippet (first 3000 chars):\n${text.slice(0, 3_000)}`,
      },
    ],
  })

  const verifyRaw = verifyMsg.content[0].type === 'text' ? verifyMsg.content[0].text : haikuJson
  const finalJson = stripFences(verifyRaw)

  const parsed: ParsedContractData = JSON.parse(finalJson)
  return parsed
}

function buildAlerts(
  contractId: string,
  endDate: string | undefined | null
): Array<{ contract_id: string; message: string; severity: string; trigger_date: string; status: string }> {
  if (!endDate) return []

  const end = new Date(endDate)
  if (isNaN(end.getTime())) return []

  const now = new Date()
  const alerts: Array<{ contract_id: string; message: string; severity: string; trigger_date: string; status: string }> = []

  const thresholds = [
    { days: 90, label: '90 days', severity: 'info' },
    { days: 60, label: '60 days', severity: 'info' },
    { days: 30, label: '30 days', severity: 'warning' },
  ]

  for (const { days, label, severity } of thresholds) {
    const threshold = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    if (now <= threshold) {
      alerts.push({
        contract_id: contractId,
        message: `Contract expires in ${label} (${endDate})`,
        severity,
        trigger_date: threshold.toISOString().split('T')[0],
        status: 'unread',
      })
    }
  }

  return alerts
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  try {
    // AUTH CHECK — temporarily bypassed for local testing
    // Re-enable once Google OAuth redirect URI is configured for the active port
    // const session = await auth()
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // ── Demo mode: skip trial checks ────────────────────────────────────────
    const cookieHeader = request.headers.get('cookie') ?? ''
    const isDemo = cookieHeader.includes('demo_mode=1')

    // ── Trial enforcement (for real users) ──────────────────────────────────
    if (!isDemo) {
      // TODO: replace with real session user email once auth is re-enabled
      // For now, trial check is skipped for direct API access
    }
    const contentType = request.headers.get('content-type') ?? ''

    let contractText = ''
    let contractName = 'Untitled Contract'
    let fileUrl: string | null = null
    let webViewLink: string | null = null

    // ── Determine input mode ──────────────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const nameField = formData.get('name')

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided in multipart form' },
          { status: 400 }
        )
      }

      contractName = nameField
        ? String(nameField)
        : file.name.replace(/\.[^/.]+$/, '')

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      contractText = await extractTextFromBuffer(buffer, file.type)

      if (!contractText || contractText.trim().length < 20) {
        return NextResponse.json(
          { error: 'Could not extract readable text from the uploaded file' },
          { status: 422 }
        )
      }
    } else {
      // JSON body: { text: string, name: string, driveFileId?: string, webViewLink?: string }
      const body = await request.json()
      const { text, name } = body as {
        text?: string
        name?: string
        driveFileId?: string
        webViewLink?: string
      }

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body must include a non-empty "text" field' },
          { status: 400 }
        )
      }

      contractText = text.trim()
      contractName = name?.trim() || 'Untitled Contract'

      // Use Drive file URL if provided
      if (body.driveFileId && body.webViewLink) {
        webViewLink = body.webViewLink
        fileUrl = webViewLink
      }
    }

    // ── Parse with Claude ─────────────────────────────────────────────────────
    let parsed: ParsedContractData
    try {
      parsed = await parseContractWithClaude(contractText, contractName)
    } catch (claudeErr) {
      const errMsg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr)
      console.error('Claude parsing error:', errMsg)
      return NextResponse.json(
        { error: `Failed to parse contract with AI: ${errMsg}` },
        { status: 502 }
      )
    }

    // ── Insert contract ───────────────────────────────────────────────────────
    const contractInsert = {
      name: parsed.name ?? contractName,
      type: parsed.type ?? 'Unknown',
      party_a: parsed.party_a ?? '',
      party_b: parsed.party_b ?? '',
      start_date: parsed.start_date ?? null,
      end_date: parsed.end_date ?? null,
      renewal_type: parsed.renewal_type ?? 'none',
      notice_days: parsed.notice_days ?? 0,
      risk_score: parsed.risk_score ?? 0,
      status: parsed.status ?? 'active',
      file_url: fileUrl,
      raw_text: contractText,
      ai_summary: parsed.ai_summary ?? null,
      improvement_tips: parsed.improvement_tips ?? [],
      user_id: isDemo ? DEMO_USER_ID : null,
    }

    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .insert(contractInsert)
      .select()
      .single()

    if (contractError || !contractData) {
      console.error('Supabase contract insert error:', contractError)
      return NextResponse.json(
        { error: 'Failed to store contract in database' },
        { status: 500 }
      )
    }

    const contract = contractData as Contract

    // ── Insert obligations ────────────────────────────────────────────────────
    let obligations: Obligation[] = []
    if (parsed.obligations && parsed.obligations.length > 0) {
      const obligationInserts = parsed.obligations.map((o) => ({
        contract_id: contract.id,
        description: o.title + (o.description ? ': ' + o.description : ''),
        next_due_date: o.next_due_date ?? o.due_date ?? null,
        frequency: o.frequency ?? null,
        status: (o.status === 'overdue' ? 'overdue' : o.status === 'completed' ? 'completed' : 'pending') as 'pending' | 'completed' | 'overdue',
        risk_level: 'low' as const,
      }))

      const { data: obligationData, error: obligationError } = await supabase
        .from('obligations')
        .insert(obligationInserts)
        .select()

      if (obligationError) {
        console.error('Supabase obligations insert error:', obligationError)
        // Non-fatal — continue without obligations
      } else {
        obligations = (obligationData as Obligation[]) ?? []
      }
    }

    // ── Insert alerts ─────────────────────────────────────────────────────────
    let alerts: Alert[] = []
    const alertInserts = buildAlerts(contract.id, contract.end_date)

    if (alertInserts.length > 0) {
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .insert(alertInserts)
        .select()

      if (alertError) {
        console.error('Supabase alerts insert error:', alertError)
        // Non-fatal — continue without alerts
      } else {
        alerts = (alertData as Alert[]) ?? []
      }
    }

    return NextResponse.json(
      { contract, obligations, alerts },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error in POST /api/contracts/upload:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
