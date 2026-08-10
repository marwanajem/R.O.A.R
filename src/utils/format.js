/**
 * Shared formatting helpers used across multiple pages.
 */

/** Format a date string or Date to a readable Malaysian date (e.g. "21 Nov 2026") */
export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format a number as MYR currency string (e.g. "MYR 3,180") */
export function formatMYR(amount) {
  return `MYR ${Number(amount).toLocaleString('en-MY')}`
}

/** Mask an IC number — show only the last 4 digits (e.g. "••••••-••-5521") */
export function maskIC(ic) {
  if (!ic) return '—'
  const last4 = ic.replace(/\D/g, '').slice(-4)
  return `••••••-••-${last4}`
}
