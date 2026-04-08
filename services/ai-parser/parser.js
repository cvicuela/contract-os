import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const MODEL = 'claude-opus-4-6';

const client = new Anthropic({ apiKey: CLAUDE_API_KEY });

const SYSTEM_PROMPT = `You are a senior contract analyst. Extract ALL structured information from this contract. Return ONLY valid JSON with no markdown, no explanation.`;

const USER_PROMPT_TEMPLATE = (contractText) => `
Analyze the following contract and return a JSON object with this exact structure:

{
  "contract_type": "string",
  "party_a": "string (first party name)",
  "party_b": "string (second party name)",
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "renewal_type": "automatic|manual|none",
  "notice_period_days": number,
  "risk_score": number (0-10, based on penalties, ambiguous terms, one-sided clauses),
  "ai_summary": "2-3 sentence plain English summary",
  "obligations": [
    {
      "description": "string",
      "frequency": "once|monthly|quarterly|annually|on_event",
      "next_due_date": "YYYY-MM-DD or null",
      "risk_level": "low|medium|high"
    }
  ],
  "key_risks": ["string array of identified risks"],
  "key_events": ["string array of important dates/milestones"]
}

CONTRACT TEXT:
${contractText}
`;

/**
 * Strips markdown code fences from a string if present.
 * @param {string} text
 * @returns {string}
 */
function stripMarkdown(text) {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/**
 * Parses a contract text using Claude and returns structured JSON.
 * @param {string} contractText - The full text of the contract.
 * @returns {Promise<Object>} Structured contract data.
 */
async function parseContract(contractText) {
  if (!contractText || typeof contractText !== 'string' || contractText.trim().length === 0) {
    throw new Error('contractText must be a non-empty string');
  }

  let rawContent;
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: USER_PROMPT_TEMPLATE(contractText),
        },
      ],
    });

    rawContent = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  } catch (error) {
    throw new Error(`Claude API request failed: ${error.message}`);
  }

  // Strip markdown fences if Claude wrapped the JSON
  const cleaned = stripMarkdown(rawContent);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    throw new Error(
      `Failed to parse Claude response as JSON: ${parseError.message}\nRaw response: ${rawContent.slice(0, 500)}`
    );
  }

  // Validate and normalise critical fields with sensible defaults
  const result = {
    contract_type: parsed.contract_type ?? 'unknown',
    party_a: parsed.party_a ?? null,
    party_b: parsed.party_b ?? null,
    start_date: parsed.start_date ?? null,
    end_date: parsed.end_date ?? null,
    renewal_type: ['automatic', 'manual', 'none'].includes(parsed.renewal_type)
      ? parsed.renewal_type
      : 'none',
    notice_period_days:
      typeof parsed.notice_period_days === 'number' ? parsed.notice_period_days : 0,
    risk_score:
      typeof parsed.risk_score === 'number'
        ? Math.min(10, Math.max(0, parsed.risk_score))
        : 5,
    ai_summary: parsed.ai_summary ?? '',
    obligations: Array.isArray(parsed.obligations) ? parsed.obligations : [],
    key_risks: Array.isArray(parsed.key_risks) ? parsed.key_risks : [],
    key_events: Array.isArray(parsed.key_events) ? parsed.key_events : [],
  };

  return result;
}

/**
 * Calculates the number of days from today until the contract end date.
 * @param {Object|string} contractOrEndDate - Parsed contract object OR an end_date string.
 * @returns {number|null} Days until expiry (negative = already expired), or null if no end date.
 */
function calculateDaysToExpiry(contractOrEndDate) {
  const endDateStr =
    typeof contractOrEndDate === 'string'
      ? contractOrEndDate
      : contractOrEndDate?.end_date;

  if (!endDateStr) return null;

  const endDate = new Date(endDateStr);
  if (isNaN(endDate.getTime())) return null;

  const now = new Date();
  // Zero out time portion for day-level comparison
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const endMs = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return Math.round((endMs - todayMs) / (1000 * 60 * 60 * 24));
}

/**
 * Generates an array of alert objects for a parsed contract.
 * Alerts are based on end_date proximity and risk_score.
 *
 * @param {Object} contract - A parsed contract object (output of parseContract).
 * @returns {Array<Object>} Array of alert objects.
 */
function generateAlerts(contract) {
  if (!contract || typeof contract !== 'object') {
    throw new Error('contract must be a valid object');
  }

  const alerts = [];
  const daysToExpiry = calculateDaysToExpiry(contract);

  // --- Expiry-based alerts ---
  if (daysToExpiry !== null) {
    if (daysToExpiry < 0) {
      alerts.push({
        type: 'expiry',
        severity: 'critical',
        message: `Contract expired ${Math.abs(daysToExpiry)} day(s) ago.`,
        days_to_expiry: daysToExpiry,
        triggered_at: new Date().toISOString(),
      });
    } else if (daysToExpiry <= 7) {
      alerts.push({
        type: 'expiry',
        severity: 'critical',
        message: `Contract expires in ${daysToExpiry} day(s). Immediate action required.`,
        days_to_expiry: daysToExpiry,
        triggered_at: new Date().toISOString(),
      });
    } else if (daysToExpiry <= 30) {
      alerts.push({
        type: 'expiry',
        severity: 'warning',
        message: `Contract expires in ${daysToExpiry} day(s). Review renewal options.`,
        days_to_expiry: daysToExpiry,
        triggered_at: new Date().toISOString(),
      });
    } else if (daysToExpiry <= 60) {
      alerts.push({
        type: 'expiry',
        severity: 'info',
        message: `Contract expires in ${daysToExpiry} day(s). Plan for renewal or termination.`,
        days_to_expiry: daysToExpiry,
        triggered_at: new Date().toISOString(),
      });
    } else if (daysToExpiry <= 90) {
      alerts.push({
        type: 'expiry',
        severity: 'info',
        message: `Contract expires in ${daysToExpiry} day(s). Early notice window.`,
        days_to_expiry: daysToExpiry,
        triggered_at: new Date().toISOString(),
      });
    }
  }

  // --- Notice period warning ---
  if (
    daysToExpiry !== null &&
    contract.notice_period_days > 0 &&
    daysToExpiry > 0 &&
    daysToExpiry <= contract.notice_period_days
  ) {
    alerts.push({
      type: 'notice_period',
      severity: 'warning',
      message: `Notice period of ${contract.notice_period_days} day(s) is active. Deadline to notify: ${contract.notice_period_days - daysToExpiry >= 0 ? 'past due' : `${daysToExpiry} day(s) remaining`}.`,
      days_to_expiry: daysToExpiry,
      notice_period_days: contract.notice_period_days,
      triggered_at: new Date().toISOString(),
    });
  }

  // --- Risk score alerts ---
  const riskScore = contract.risk_score ?? 0;
  if (riskScore >= 8) {
    alerts.push({
      type: 'risk',
      severity: 'critical',
      message: `High risk contract (score ${riskScore}/10). Legal review strongly recommended.`,
      risk_score: riskScore,
      triggered_at: new Date().toISOString(),
    });
  } else if (riskScore >= 6) {
    alerts.push({
      type: 'risk',
      severity: 'warning',
      message: `Elevated risk contract (score ${riskScore}/10). Consider legal review.`,
      risk_score: riskScore,
      triggered_at: new Date().toISOString(),
    });
  } else if (riskScore >= 4) {
    alerts.push({
      type: 'risk',
      severity: 'info',
      message: `Moderate risk contract (score ${riskScore}/10). Monitor key obligations.`,
      risk_score: riskScore,
      triggered_at: new Date().toISOString(),
    });
  }

  // --- Overdue obligations ---
  const today = new Date();
  const obligations = Array.isArray(contract.obligations) ? contract.obligations : [];
  for (const obligation of obligations) {
    if (!obligation.next_due_date) continue;
    const dueDate = new Date(obligation.next_due_date);
    if (isNaN(dueDate.getTime())) continue;

    if (dueDate < today) {
      const overdueDays = Math.round(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        type: 'obligation_overdue',
        severity: obligation.risk_level === 'high' ? 'critical' : 'warning',
        message: `Obligation overdue by ${overdueDays} day(s): ${obligation.description}`,
        obligation,
        overdue_days: overdueDays,
        triggered_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

export { parseContract, calculateDaysToExpiry, generateAlerts };
