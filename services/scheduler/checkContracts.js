import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Returns a date string (YYYY-MM-DD) N days from today (UTC).
 * @param {number} days
 * @returns {string}
 */
function futureDateISO(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Returns today's date string (YYYY-MM-DD) in UTC.
 * @returns {string}
 */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns the number of days between today and a future date string.
 * @param {string} dateStr
 * @returns {number}
 */
function daysUntil(dateStr) {
  const todayMs = Date.UTC(
    ...new Date().toISOString().split('T')[0].split('-').map(Number)
  );
  const targetMs = Date.UTC(...dateStr.split('-').map(Number));
  return Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));
}

/**
 * Determines which alert thresholds apply to a given number of days remaining.
 * Returns an array of threshold objects that haven't been sent yet.
 *
 * Thresholds: 90 days → info, 60 days → info, 30 days → warning, 7 days → critical
 *
 * @param {number} daysLeft
 * @returns {Array<{threshold: number, severity: string}>}
 */
function getApplicableThresholds(daysLeft) {
  const thresholds = [
    { threshold: 90, severity: 'info' },
    { threshold: 60, severity: 'info' },
    { threshold: 30, severity: 'warning' },
    { threshold: 7, severity: 'critical' },
  ];
  // A threshold is applicable if daysLeft is at or below the threshold
  return thresholds.filter((t) => daysLeft <= t.threshold);
}

/**
 * Checks whether an alert already exists for a given contract + threshold.
 * @param {string} contractId
 * @param {number} threshold
 * @returns {Promise<boolean>}
 */
async function alertExists(contractId, threshold) {
  const { data, error } = await supabase
    .from('alerts')
    .select('id')
    .eq('contract_id', contractId)
    .eq('threshold_days', threshold)
    .eq('alert_type', 'expiry')
    .maybeSingle();

  if (error) {
    console.error(
      `Error checking alert existence for contract ${contractId}, threshold ${threshold}:`,
      error.message
    );
    return false;
  }
  return data !== null;
}

/**
 * Inserts a new alert record into the alerts table.
 * @param {Object} alertData
 * @returns {Promise<Object|null>}
 */
async function insertAlert(alertData) {
  const { data, error } = await supabase.from('alerts').insert(alertData).select().single();
  if (error) {
    console.error('Error inserting alert:', error.message, alertData);
    return null;
  }
  return data;
}

/**
 * Checks all active contracts expiring within 90 days and creates
 * threshold-based alerts (90/60/30/7 days), avoiding duplicates.
 *
 * @returns {Promise<{checked: number, created: number, errors: number}>}
 */
async function checkExpiringContracts() {
  const today = todayISO();
  const cutoff = futureDateISO(90);

  console.log(`[checkExpiringContracts] Checking contracts expiring between ${today} and ${cutoff}...`);

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('id, title, end_date, party_a, party_b')
    .eq('status', 'active')
    .gte('end_date', today)
    .lte('end_date', cutoff)
    .order('end_date', { ascending: true });

  if (error) {
    console.error('[checkExpiringContracts] Query failed:', error.message);
    return { checked: 0, created: 0, errors: 1 };
  }

  if (!contracts || contracts.length === 0) {
    console.log('[checkExpiringContracts] No expiring contracts found.');
    return { checked: 0, created: 0, errors: 0 };
  }

  console.log(`[checkExpiringContracts] Found ${contracts.length} contract(s) expiring within 90 days.`);

  let created = 0;
  let errors = 0;

  for (const contract of contracts) {
    const daysLeft = daysUntil(contract.end_date);
    const applicableThresholds = getApplicableThresholds(daysLeft);

    for (const { threshold, severity } of applicableThresholds) {
      try {
        const exists = await alertExists(contract.id, threshold);
        if (exists) {
          console.log(
            `  [SKIP] Contract ${contract.id} already has a ${threshold}-day alert.`
          );
          continue;
        }

        const alertData = {
          contract_id: contract.id,
          alert_type: 'expiry',
          severity,
          threshold_days: threshold,
          message: `Contract "${contract.title || contract.id}" expires in ${daysLeft} day(s) (threshold: ${threshold} days).`,
          days_remaining: daysLeft,
          end_date: contract.end_date,
          created_at: new Date().toISOString(),
          status: 'unread',
        };

        const inserted = await insertAlert(alertData);
        if (inserted) {
          created++;
          console.log(
            `  [CREATED] ${severity.toUpperCase()} alert for contract ${contract.id} (${threshold}-day threshold, ${daysLeft} days left).`
          );
        } else {
          errors++;
        }
      } catch (err) {
        console.error(
          `  [ERROR] Failed to process alert for contract ${contract.id}, threshold ${threshold}:`,
          err.message
        );
        errors++;
      }
    }
  }

  const summary = { checked: contracts.length, created, errors };
  console.log('[checkExpiringContracts] Done.', summary);
  return summary;
}

/**
 * Checks all pending obligations that are overdue and creates alerts for each.
 * Avoids duplicate alerts for the same obligation.
 *
 * @returns {Promise<{checked: number, created: number, errors: number}>}
 */
async function checkOverdueObligations() {
  const now = new Date().toISOString();
  console.log(`[checkOverdueObligations] Checking obligations overdue as of ${now}...`);

  const { data: obligations, error } = await supabase
    .from('obligations')
    .select('id, contract_id, description, next_due_date, risk_level, frequency')
    .eq('status', 'pending')
    .lt('next_due_date', now)
    .order('next_due_date', { ascending: true });

  if (error) {
    console.error('[checkOverdueObligations] Query failed:', error.message);
    return { checked: 0, created: 0, errors: 1 };
  }

  if (!obligations || obligations.length === 0) {
    console.log('[checkOverdueObligations] No overdue obligations found.');
    return { checked: 0, created: 0, errors: 0 };
  }

  console.log(`[checkOverdueObligations] Found ${obligations.length} overdue obligation(s).`);

  let created = 0;
  let errors = 0;

  for (const obligation of obligations) {
    try {
      // Check if an overdue alert already exists for this obligation
      const { data: existing, error: checkError } = await supabase
        .from('alerts')
        .select('id')
        .eq('obligation_id', obligation.id)
        .eq('alert_type', 'obligation_overdue')
        .maybeSingle();

      if (checkError) {
        console.error(
          `  [ERROR] Checking existing alert for obligation ${obligation.id}:`,
          checkError.message
        );
        errors++;
        continue;
      }

      if (existing) {
        console.log(`  [SKIP] Obligation ${obligation.id} already has an overdue alert.`);
        continue;
      }

      const dueDate = new Date(obligation.next_due_date);
      const overdueDays = Math.round((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Map risk_level to alert severity
      const severityMap = { high: 'critical', medium: 'warning', low: 'info' };
      const severity = severityMap[obligation.risk_level] ?? 'warning';

      const alertData = {
        contract_id: obligation.contract_id,
        obligation_id: obligation.id,
        alert_type: 'obligation_overdue',
        severity,
        message: `Obligation overdue by ${overdueDays} day(s): "${obligation.description}". Was due on ${obligation.next_due_date}.`,
        overdue_days: overdueDays,
        due_date: obligation.next_due_date,
        created_at: new Date().toISOString(),
        status: 'unread',
      };

      const inserted = await insertAlert(alertData);
      if (inserted) {
        created++;
        console.log(
          `  [CREATED] ${severity.toUpperCase()} alert for obligation ${obligation.id} (overdue by ${overdueDays} day(s)).`
        );
      } else {
        errors++;
      }
    } catch (err) {
      console.error(
        `  [ERROR] Failed to process obligation ${obligation.id}:`,
        err.message
      );
      errors++;
    }
  }

  const summary = { checked: obligations.length, created, errors };
  console.log('[checkOverdueObligations] Done.', summary);
  return summary;
}

// --- Main block: run directly ---
// Detects if this file is the entry point via import.meta.url comparison
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('checkContracts.js') ||
    process.argv[1].replace(/\\/g, '/').endsWith('scheduler/checkContracts.js'));

if (isMain) {
  (async () => {
    console.log('===== Contract Scheduler Starting =====');
    try {
      const [expiryResult, obligationResult] = await Promise.all([
        checkExpiringContracts(),
        checkOverdueObligations(),
      ]);

      console.log('\n===== Scheduler Run Complete =====');
      console.log('Expiring Contracts:', expiryResult);
      console.log('Overdue Obligations:', obligationResult);

      const totalCreated = expiryResult.created + obligationResult.created;
      const totalErrors = expiryResult.errors + obligationResult.errors;
      console.log(`\nSummary: ${totalCreated} alert(s) created, ${totalErrors} error(s).`);
    } catch (err) {
      console.error('Fatal error during scheduler run:', err.message);
      process.exit(1);
    }
  })();
}

export { checkExpiringContracts, checkOverdueObligations };
