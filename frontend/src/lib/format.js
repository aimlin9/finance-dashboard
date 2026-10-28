import { format as fmt, parseISO, isValid } from 'date-fns';

// Statements are in Ghana cedis. Other currencies are a convenience view
// using indicative rates, so converted amounts are always marked with "≈".
export const CURRENCIES = {
  GHS: { symbol: 'GH₵', rate: 1, label: 'Ghana cedi' },
  USD: { symbol: '$', rate: 0.065, label: 'US dollar' },
  GBP: { symbol: '£', rate: 0.052, label: 'British pound' },
  EUR: { symbol: '€', rate: 0.06, label: 'Euro' },
  NGN: { symbol: '₦', rate: 100, label: 'Nigerian naira' },
  KES: { symbol: 'KSh', rate: 8.4, label: 'Kenyan shilling' },
  ZAR: { symbol: 'R', rate: 1.18, label: 'South African rand' },
};
export const RATES_NOTE = 'Indicative rates for viewing only — your statements stay in cedis.';

const formatters = new Map();
function numberFormat(decimals) {
  const key = decimals;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }));
  }
  return formatters.get(key);
}

export function toNumber(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * money(1234.5) -> "GH₵ 1,234.50"
 * options: currency, compact (GH₵ 12.4k), sign ('always' | 'negative' | 'none'), decimals
 */
export function money(value, { currency = 'GHS', compact = false, sign = 'negative', decimals } = {}) {
  const info = CURRENCIES[currency] || CURRENCIES.GHS;
  const raw = toNumber(value) * info.rate;
  const abs = Math.abs(raw);
  let body;
  if (compact && abs >= 1000) {
    const units = [[1e9, 'bn'], [1e6, 'm'], [1e3, 'k']];
    const [div, suffix] = units.find(([d]) => abs >= d);
    body = numberFormat(abs / div >= 100 ? 0 : 1).format(abs / div) + suffix;
  } else {
    body = numberFormat(decimals ?? (compact && abs >= 100 ? 0 : 2)).format(abs);
  }
  const prefix = raw < 0 && sign !== 'none' ? '−' : raw > 0 && sign === 'always' ? '+' : '';
  const approx = currency !== 'GHS' ? '≈ ' : '';
  return `${approx}${prefix}${info.symbol} ${body}`;
}

export function percent(value, decimals = 0) {
  return `${numberFormat(decimals).format(toNumber(value))}%`;
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  // 'YYYY-MM-DD' parsed as local date, not UTC midnight (which shows the
  // previous day for anyone west of Greenwich).
  const d = parseISO(String(value));
  return isValid(d) ? d : null;
}

export function date(value, pattern = 'd MMM yyyy') {
  const d = parseDate(value);
  return d ? fmt(d, pattern) : '—';
}

/** '2026-03' or '2026-03-01' -> 'March 2026' */
export function monthLabel(value, pattern = 'MMMM yyyy') {
  if (!value) return '';
  return date(String(value).slice(0, 7) + '-01', pattern);
}

export function monthKey(value) {
  return value ? String(value).slice(0, 7) : '';
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName) {
  return (fullName || '').trim().split(/\s+/)[0] || 'there';
}

export function plural(n, word, pluralWord) {
  return `${numberFormat(0).format(n)} ${n === 1 ? word : pluralWord || word + 's'}`;
}
