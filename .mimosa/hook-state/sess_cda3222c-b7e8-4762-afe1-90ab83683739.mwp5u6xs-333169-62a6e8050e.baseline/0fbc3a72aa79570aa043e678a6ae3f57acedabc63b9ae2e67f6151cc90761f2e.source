// Retry schedule for payment jobs. Pure, no imports.

const DELAYS_SECONDS = [60, 300, 900, 3600, 21600];

/** Seconds to wait before the next try after `attempts` failed tries; null when the job should be marked failed. */
export function nextRunDelaySeconds(attempts: number): number | null {
  if (!Number.isInteger(attempts) || attempts < 0) return null;
  return DELAYS_SECONDS[attempts] ?? null;
}
