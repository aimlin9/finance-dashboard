var CURRENCY_SYMBOLS = {
  GHS: 'GHS',
  USD: '$',
  GBP: '\u00A3',
  EUR: '\u20AC',
  NGN: '\u20A6',
  KES: 'KES',
  ZAR: 'R',
};

var EXCHANGE_RATES = {
  GHS: 1,
  USD: 0.065,
  GBP: 0.052,
  EUR: 0.060,
  NGN: 10.2,
  KES: 8.4,
  ZAR: 1.18,
};

export function formatCurrency(amount, currency) {
  var c = currency || 'GHS';
  var symbol = CURRENCY_SYMBOLS[c] || c;
  var num = parseFloat(amount) || 0;

  if (c !== 'GHS') {
    var rate = EXCHANGE_RATES[c] || 1;
    num = num * rate;
  }

  return symbol + ' ' + num.toFixed(2);
}

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency || 'GHS';
}
