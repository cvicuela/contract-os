import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// =============================================================================
// Tailwind class merging
// =============================================================================

/**
 * Merge Tailwind CSS class names, resolving conflicts via tailwind-merge.
 * Accepts any mix of strings, arrays, and conditional objects (clsx syntax).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'bg-red-500')
 * // → 'px-4 py-2 bg-red-500'  (tailwind-merge resolves the bg conflict)
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes))
}

// =============================================================================
// Date helpers
// =============================================================================

/**
 * Format an ISO date string (or Date-compatible string) into a human-readable
 * format, e.g. "Apr 7, 2026".
 *
 * Returns "—" for falsy / invalid input so UI components never display "Invalid Date".
 */
export function formatDate(date: string): string {
  if (!date) return '—'

  const parsed = new Date(date)

  if (isNaN(parsed.getTime())) return '—'

  return parsed.toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    // Interpret plain YYYY-MM-DD strings as UTC so timezone offsets don't
    // shift the displayed day.
    timeZone: date.length === 10 ? 'UTC' : undefined,
  })
}

/**
 * Compute the number of calendar days between today and the given end date.
 * Negative values indicate the contract has already expired.
 *
 * @param end_date - ISO date string (YYYY-MM-DD or full ISO-8601)
 */
export function getDaysUntilExpiry(end_date: string): number {
  if (!end_date) return 0

  const end   = new Date(end_date)
  const today = new Date()

  // Strip time component so we count full days only
  end.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffMs   = end.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

// =============================================================================
// Risk helpers
// =============================================================================

/**
 * Map a 0–10 risk score to a Tailwind text-color class.
 *
 * - 0–3   → green  (low risk)
 * - 4–6   → yellow (medium risk)
 * - 7–10  → red    (high risk)
 */
export function getRiskColor(score: number): string {
  if (score <= 3) return 'text-green-600'
  if (score <= 6) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Map a 0–10 risk score to a human-readable label.
 */
export function getRiskBadge(score: number): 'Low' | 'Medium' | 'High' {
  if (score <= 3) return 'Low'
  if (score <= 6) return 'Medium'
  return 'High'
}

// =============================================================================
// Status helpers
// =============================================================================

/**
 * Map a contract status string to a Tailwind text-color class for inline text.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600'
    case 'pending':
      return 'text-blue-600'
    case 'expired':
      return 'text-gray-500'
    case 'cancelled':
      return 'text-red-600'
    default:
      return 'text-gray-400'
  }
}

/**
 * Map a contract status string to Tailwind badge classes (background + text).
 * Useful for pill/badge UI components.
 *
 * @example
 * <span className={getStatusBadgeClasses(contract.status)}>
 *   {contract.status}
 * </span>
 */
export function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-blue-100 text-blue-800'
    case 'expired':
      return 'bg-gray-100 text-gray-600'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}
