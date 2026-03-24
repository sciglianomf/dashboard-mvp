export function formatARS(value) {
  if (!value && value !== 0) return '-';
  const millions = value / 1_000_000;
  if (Math.abs(millions) >= 1) {
    return `$${millions.toFixed(1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}K`;
}

export function formatPct(value) {
  if (!value && value !== 0) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-AR').format(Math.round(value));
}

export function formatARSFull(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}
