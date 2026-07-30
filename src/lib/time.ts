/** Render an epoch-ms timestamp as a compact "12s / 4m / 3h / 2d" label. */
export function formatRelativeTime(
  timestampMs: number,
  now: number = Date.now()
): string {
  const diffSec = Math.max(0, Math.round((now - timestampMs) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.round(diffHr / 24)}d`;
}
