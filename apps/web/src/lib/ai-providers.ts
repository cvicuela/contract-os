const EXTRACT_PROMPT = `Eres un analista de contratos. Responde SOLO con un objeto JSON válido — sin markdown, sin explicación. IMPORTANTE: ai_summary, improvement_tips y obligations DEBEN estar en español.

Schema:
{"name":string,"type":string,"party_a":string,"party_b":string,"start_date":"YYYY-MM-DD|null","end_date":"YYYY-MM-DD|null","renewal_type":"auto-renewal|manual|evergreen|none","notice_days":integer,"risk_score":1-10,"status":"active|expired|pending|cancelled","ai_summary":"2-3 oraciones en español","improvement_tips":["string (consejo accionable en español)"],"obligations":[{"title":string,"description":string,"responsible_party":string,"due_date":"YYYY-MM-DD|null","next_due_date":"YYYY-MM-DD|null","frequency":"one-time|monthly|quarterly|annually|null","status":"pending|completed|overdue"}]}

Reglas: null para strings desconocidos, 0 para números desconocidos. risk_score: considera exposición financiera, sensibilidad de datos, complejidad de terminación.
improvement_tips: proporciona 4-7 puntos específicos y accionables EN ESPAÑOL que harían este contrato un 10/10 perfecto. Cada tip debe identificar una brecha o debilidad concreta encontrada en este contrato y explicar exactamente cómo corregirla (ej. "Agregar una cláusula de fuerza mayor que cubra pandemia, desastre natural y ciberataques" no "Agregar cláusulas faltantes"). Enfócate en: cláusulas protectoras faltantes, lenguaje vago, brechas de responsabilidad, propiedad intelectual, privacidad de datos, resolución de disputas, derechos de terminación, indemnización y términos de renovación.`

export interface ParsedContractData {
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
  total_value?: number
  price_per_unit?: number
  unit_type?: string
  escalation_rate?: number
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

export function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

function repairTruncatedJson(json: string): string {
  let fixed = json.replace(/,\s*$/, '')
  const openBrackets = (fixed.match(/\[/g) || []).length - (fixed.match(/\]/g) || []).length
  const openBraces = (fixed.match(/\{/g) || []).length - (fixed.match(/\}/g) || []).length
  fixed += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces))
  return fixed
}

export type AIProvider = 'anthropic' | 'openai' | 'gemini'

export async function parseContractWithAI(
  text: string,
  contractName: string,
  provider: AIProvider,
  apiKey: string,
  basicInfo: ParsedContractData
): Promise<ParsedContractData> {
  const userMessage = `Pre-extracted data (fix errors, fill gaps, add obligations and improvement_tips):\n${JSON.stringify(basicInfo)}\n\nContract text:\n${text.slice(0, 12_000)}`

  switch (provider) {
    case 'anthropic': return parseWithAnthropic(userMessage, apiKey)
    case 'openai': return parseWithOpenAI(userMessage, apiKey)
    case 'gemini': return parseWithGemini(userMessage, apiKey)
  }
}

async function parseWithAnthropic(userMessage: string, apiKey: string): Promise<ParsedContractData> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: EXTRACT_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })
  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  let json = stripFences(raw)
  if (msg.stop_reason === 'max_tokens') json = repairTruncatedJson(json)
  return JSON.parse(json)
}

async function parseWithOpenAI(userMessage: string, apiKey: string): Promise<ParsedContractData> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey })
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'user', content: userMessage },
    ],
  })
  const raw = res.choices[0]?.message?.content ?? '{}'
  let json = stripFences(raw)
  if (res.choices[0]?.finish_reason === 'length') json = repairTruncatedJson(json)
  return JSON.parse(json)
}

async function parseWithGemini(userMessage: string, apiKey: string): Promise<ParsedContractData> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
    systemInstruction: EXTRACT_PROMPT,
  })
  const result = await model.generateContent(userMessage)
  const raw = result.response.text()
  const json = stripFences(raw)
  return JSON.parse(json)
}
