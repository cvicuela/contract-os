export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { decrypt } from '@/lib/encrypt'
import { parseContractWithAI, type ParsedContractData, type AIProvider } from '@/lib/ai-providers'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

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

async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().replace(/^.*\./, '.')

  if (mimeType === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    return result.text.replace(/\s{2,}/g, ' ').trim()
  }

  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.replace(/\s{2,}/g, ' ').trim()
  }

  if (ext === '.doc' || mimeType === 'application/msword') {
    const WordExtractor = (await import('word-extractor')).default
    const extractor = new WordExtractor()
    const doc = await extractor.extract(buffer)
    return doc.getBody().replace(/\s{2,}/g, ' ').trim()
  }

  // .txt or other plain text
  return buffer.toString('utf8')
}

function extractBasicInfo(text: string, contractName: string): ParsedContractData {
  const snippet = text.slice(0, 15_000)
  const lower = snippet.toLowerCase()

  // ── Contract type detection (ES + EN) ──────────────────────────────────
  const typePatterns: [RegExp, string][] = [
    [/\b(arrendamiento|alquiler|renta|lease|rental)\b/i, 'Arrendamiento'],
    [/\b(servicio|servicios profesionales|service agreement)\b/i, 'Servicios'],
    [/\b(compraventa|compra[- ]?venta|purchase|sale agreement)\b/i, 'Compraventa'],
    [/\b(confidencialidad|nda|non[- ]?disclosure)\b/i, 'NDA'],
    [/\b(laboral|empleo|trabajo|employment)\b/i, 'Laboral'],
    [/\b(préstamo|prestamo|crédito|credito|loan)\b/i, 'Préstamo'],
    [/\b(licencia|uso de software|license|saas|subscription)\b/i, 'Licencia'],
    [/\b(suministro|supply|distribuci[oó]n|distribution)\b/i, 'Suministro'],
    [/\b(consultor[ií]a|consulting|asesor[ií]a|advisory)\b/i, 'Consultoría'],
  ]
  let type = 'General'
  for (const [pat, label] of typePatterns) {
    if (pat.test(lower)) { type = label; break }
  }

  // ── Date extraction (multiple formats) ──────────────────────────────────
  const dates: Date[] = []

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g
  let m
  while ((m = dmyRegex.exec(snippet)) !== null) {
    const [, a, b, y] = m
    const d = new Date(`${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`)
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) dates.push(d)
  }

  // YYYY-MM-DD (ISO format)
  const isoRegex = /(\d{4})-(\d{2})-(\d{2})/g
  while ((m = isoRegex.exec(snippet)) !== null) {
    const d = new Date(m[0])
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) dates.push(d)
  }

  // Written dates: "1 de enero de 2024", "January 1, 2024"
  const writtenEs = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/gi
  const esMonths: Record<string, number> = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 }
  while ((m = writtenEs.exec(snippet)) !== null) {
    const month = esMonths[m[2].toLowerCase()]
    if (month !== undefined) {
      const d = new Date(parseInt(m[3]), month, parseInt(m[1]))
      if (!isNaN(d.getTime())) dates.push(d)
    }
  }

  dates.sort((a, b) => a.getTime() - b.getTime())
  // Deduplicate by date string
  const uniqueDates = [...new Set(dates.map(d => d.toISOString().split('T')[0]))]
  const startDate = uniqueDates.length > 0 ? uniqueDates[0] : null
  const endDate = uniqueDates.length > 1 ? uniqueDates[uniqueDates.length - 1] : null

  // ── Party detection (ES + EN, multiple patterns) ───────────────────────
  let partyA = ''
  let partyB = ''

  // Pattern: "ENTRE: X ... Y: Z" / "between X and Z"
  const entreMatch = snippet.match(/(?:entre|between)[:\s]+([^,\n]{3,100})/i)
  if (entreMatch) partyA = entreMatch[1].trim()
  const yMatch = snippet.match(/(?:\by\b|\band\b)[:\s]+([^,\n]{3,100})/i)
  if (yMatch && yMatch.index && entreMatch?.index && yMatch.index > entreMatch.index) {
    partyB = yMatch[1].trim()
  }

  // Fallback: "Parte A:" / "Party A:" / "El arrendador:" / "El arrendatario:"
  if (!partyA) {
    const pA = snippet.match(/(?:parte\s*a|party\s*a|el\s+arrendador|the\s+landlord|el\s+proveedor|el\s+prestador)[:\s]+([^\n,]{3,100})/i)
    if (pA) partyA = pA[1].trim()
  }
  if (!partyB) {
    const pB = snippet.match(/(?:parte\s*b|party\s*b|el\s+arrendatario|the\s+tenant|el\s+cliente|the\s+client)[:\s]+([^\n,]{3,100})/i)
    if (pB) partyB = pB[1].trim()
  }

  // Fallback: company patterns (S.A., S.L., LLC, Inc, Corp, SRL)
  if (!partyA || !partyB) {
    const companyRegex = /([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s&.]+(?:S\.?A\.?|S\.?L\.?|SRL|LLC|Inc\.?|Corp\.?|Ltd\.?))/g
    const companies: string[] = []
    let cm
    while ((cm = companyRegex.exec(snippet)) !== null) {
      const name = cm[1].trim()
      if (name.length > 5 && !companies.includes(name)) companies.push(name)
      if (companies.length >= 2) break
    }
    if (!partyA && companies.length > 0) partyA = companies[0]
    if (!partyB && companies.length > 1) partyB = companies[1]
  }

  // ── Price / monetary value extraction ──────────────────────────────────
  let totalValue: number | undefined
  let pricePerUnit: number | undefined
  let unitType: string | undefined
  let escalationRate: number | undefined

  // Match monetary amounts: $1,234.56 or 1.234,56 EUR or USD 50,000
  const moneyRegex = /(?:\$|USD|EUR|€)\s?([\d.,]+)|(?:[\d.,]+)\s?(?:USD|EUR|€|\$|pesos|d[oó]lares|euros)/gi
  const amounts: number[] = []
  while ((m = moneyRegex.exec(snippet)) !== null) {
    const raw = m[1] || m[0].replace(/[^\d.,]/g, '')
    // Handle both 1,234.56 and 1.234,56 formats
    let num: number
    if (raw.includes(',') && raw.indexOf(',') > raw.lastIndexOf('.')) {
      num = parseFloat(raw.replace(/\./g, '').replace(',', '.'))
    } else {
      num = parseFloat(raw.replace(/,/g, ''))
    }
    if (!isNaN(num) && num > 0) amounts.push(num)
  }
  if (amounts.length > 0) {
    // Largest amount is likely total value, smallest recurring is likely unit price
    amounts.sort((a, b) => b - a)
    totalValue = amounts[0]
    if (amounts.length > 1 && amounts[amounts.length - 1] < totalValue * 0.5) {
      pricePerUnit = amounts[amounts.length - 1]
    }
  }

  // Unit type detection
  if (/\b(m2|m²|metro[s]?\s*cuadrado|square\s*(?:meter|foot|feet)|sqft|sq\s*ft)\b/i.test(lower)) {
    unitType = 'm2'
  } else if (/\b(usuario|user|licencia|license|seat)\b/i.test(lower)) {
    unitType = 'user'
  } else if (/\b(hora|hour|hr)\b/i.test(lower)) {
    unitType = 'hour'
  } else if (/\b(mes|month)\b/i.test(lower) && pricePerUnit) {
    unitType = 'month'
  }

  // Escalation rate
  const escMatch = snippet.match(/(?:escalaci[oó]n|incremento|aumento|escalation|increase|adjustment)[^.]{0,40}?(\d+(?:[.,]\d+)?)\s*%/i)
  if (escMatch) {
    escalationRate = parseFloat(escMatch[1].replace(',', '.'))
  }

  // ── Renewal type detection ─────────────────────────────────────────────
  let renewalType = 'none'
  if (/\b(renovaci[oó]n\s+autom[aá]tica|auto[- ]?renew|automatically\s+renew)\b/i.test(lower)) {
    renewalType = 'auto-renewal'
  } else if (/\b(renovaci[oó]n\s+manual|manual\s+renew)\b/i.test(lower)) {
    renewalType = 'manual'
  } else if (/\b(indefinid[oa]|evergreen|sin\s+(?:fecha|plazo)\s+(?:de\s+)?(?:vencimiento|t[eé]rmino))\b/i.test(lower)) {
    renewalType = 'evergreen'
  }

  // ── Notice days ────────────────────────────────────────────────────────
  let noticeDays = 30
  const noticeMatch = snippet.match(/(?:aviso|notificaci[oó]n|notice|preaviso)[^.]{0,30}?(\d+)\s*(?:d[ií]as|days)/i)
  if (noticeMatch) noticeDays = parseInt(noticeMatch[1])

  // ── Risk score heuristic ───────────────────────────────────────────────
  let riskScore = 5
  const riskUp = [/penalidad/i, /indemniz/i, /exclusiv/i, /irrevocable/i, /sin l[ií]mite/i, /responsabilidad ilimitada/i, /penalty/i, /unlimited liability/i]
  const riskDown = [/mediaci[oó]n/i, /arbitraje/i, /resoluci[oó]n de conflictos/i, /fuerza mayor/i, /seguro/i, /mediation/i, /force majeure/i, /insurance/i]
  for (const r of riskUp) if (r.test(lower)) riskScore = Math.min(10, riskScore + 1)
  for (const r of riskDown) if (r.test(lower)) riskScore = Math.max(1, riskScore - 1)

  // ── Status ─────────────────────────────────────────────────────────────
  let status: 'active' | 'expired' | 'pending' = 'active'
  if (endDate) {
    const end = new Date(endDate)
    if (end < new Date()) status = 'expired'
  }

  return {
    name: contractName,
    type,
    party_a: partyA,
    party_b: partyB,
    start_date: startDate ?? undefined,
    end_date: endDate ?? undefined,
    renewal_type: renewalType,
    notice_days: noticeDays,
    risk_score: riskScore,
    status,
    ai_summary: 'Análisis básico (sin IA). Configura tu clave de IA en Ajustes para un análisis completo.',
    improvement_tips: ['Configura tu clave de IA en Ajustes para obtener recomendaciones detalladas de mejora.'],
    obligations: [],
    ...(totalValue !== undefined && { total_value: totalValue }),
    ...(pricePerUnit !== undefined && { price_per_unit: pricePerUnit }),
    ...(unitType !== undefined && { unit_type: unitType }),
    ...(escalationRate !== undefined && { escalation_rate: escalationRate }),
  }
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

export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError, isDemo } = await requireAuth()
    if (authError) return authError

    // Demo mode cannot create contracts (blocks AI cost abuse)
    if (isDemo) {
      return NextResponse.json({ error: 'Demo mode is read-only' }, { status: 403 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
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

      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds 10MB limit' },
          { status: 413 }
        )
      }

      const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']
      const fileExt = file.name.toLowerCase().replace(/^.*(\.[^.]+)$/, '$1')
      if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
        return NextResponse.json(
          { error: 'Tipo de archivo no soportado. Usa PDF, DOC, DOCX o TXT.' },
          { status: 400 }
        )
      }

      contractName = nameField
        ? String(nameField)
        : file.name.replace(/\.[^/.]+$/, '')

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      contractText = await extractTextFromBuffer(buffer, file.type, file.name)

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

    // ── Fetch user's AI key ──────────────────────────────────────────────────
    let aiProvider: AIProvider | null = null
    let userApiKey: string | null = null
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('ai_provider, ai_api_key_encrypted')
        .eq('id', userId)
        .single()
      if (userData?.ai_provider && userData?.ai_api_key_encrypted) {
        aiProvider = userData.ai_provider as AIProvider
        userApiKey = decrypt(userData.ai_api_key_encrypted)
      }
    } catch {
      // Could not fetch user AI config — will use basic fallback
    }

    // ── Parse with AI or basic fallback ──────────────────────────────────────
    let parsed: ParsedContractData
    let aiFailed = false
    const basicInfo = extractBasicInfo(contractText, contractName)

    if (aiProvider && userApiKey) {
      try {
        parsed = await parseContractWithAI(contractText, contractName, aiProvider, userApiKey, basicInfo)
      } catch (aiErr) {
        const errMsg = aiErr instanceof Error ? `${aiErr.name}: ${aiErr.message}` : String(aiErr)
        console.error(`AI parsing error (${aiProvider}) — using basic fallback:`, errMsg)
        aiFailed = true
        parsed = basicInfo
        parsed.ai_summary = 'Error al analizar con IA. Verifica tu clave API en Ajustes.'
      }
    } else {
      parsed = basicInfo
      parsed.ai_summary = 'Análisis básico. Configura tu clave de IA en Ajustes para análisis completo con IA.'
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
      user_id: userId,
      total_value: parsed.total_value ?? null,
      price_per_unit: parsed.price_per_unit ?? null,
      unit_type: parsed.unit_type ?? null,
      escalation_rate: parsed.escalation_rate ?? null,
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
      {
        contract,
        obligations,
        alerts,
        aiProvider,
        ...(aiFailed && { warning: 'Error de IA — se guardó con análisis básico' }),
        ...(!aiProvider && { basicOnly: true, warning: 'Sin clave de IA configurada — análisis básico' }),
      },
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
