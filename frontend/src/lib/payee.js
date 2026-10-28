// Mirrors payee_name() in backend/apps/analytics/utils.py so the UI can
// name the payee a rule will be learned from.
const NOISE = new Set([
  'pos', 'purchase', 'payment', 'pmt', 'to', 'from', 'ref', 'trf', 'trx', 'txn', 'transfer', 'debit', 'credit',
  'card', 'visa', 'mastercard', 'momo', 'mobile', 'money', 'online', 'web', 'via', 'for', 'at', 'the', 'and',
  'acct', 'account', 'branch', 'gh', 'ghs', 'accra', 'kumasi', 'ltd', 'limited', 'send',
]);

export function payeeName(description) {
  // Keep E-levy whole: split on the hyphen it would lose its "E".
  const text = (description || '').toLowerCase().replace(/\be[-\s]?levy\b/g, 'e‑levy');
  const words = text.replace(/[_/*#:.,-]+/g, ' ').split(/\s+/);
  const kept = words.filter((w) => w.length > 1 && !NOISE.has(w) && !/\d/.test(w));
  if (!kept.length) return null;
  return kept.slice(0, 3).map((w) => (w === 'e‑levy' ? 'E‑Levy' : w[0].toUpperCase() + w.slice(1))).join(' ');
}
