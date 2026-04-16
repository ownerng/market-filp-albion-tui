export function formatSilver(value: number): string {
  if (value === 0) return "—";
  return value.toLocaleString("en-US");
}

export function formatAge(timestampMs: number | null): string {
  if (!timestampMs) return "—";
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
