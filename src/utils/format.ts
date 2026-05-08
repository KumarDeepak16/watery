// display formatting

export const mlToLiters = (ml: number, digits = 2): number => {
  if (!Number.isFinite(ml) || ml <= 0) return 0;
  const v = ml / 1000;
  const factor = Math.pow(10, digits);
  return Math.round(v * factor) / factor;
};

export const formatMl = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0ml';
  if (n >= 1000) {
    const liters = n / 1000;
    // strip trailing zero for whole liters
    const fixed = liters >= 10 ? liters.toFixed(1) : liters.toFixed(2);
    return `${parseFloat(fixed)}L`;
  }
  return `${Math.round(n)}ml`;
};

export const formatPercent = (n: number, digits = 0): string => {
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(digits)}%`;
};

export const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
};

export const formatStreak = (days: number): string => {
  if (days <= 0) return 'No streak yet';
  if (days === 1) return '1 day';
  return `${days} days`;
};
