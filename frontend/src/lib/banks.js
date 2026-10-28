export const BANKS = {
  gcb: 'GCB Bank',
  ecobank: 'Ecobank',
  mtn_momo: 'MTN MoMo',
  absa: 'Absa',
  fidelity: 'Fidelity Bank',
  unknown: 'Other bank',
};

export const bankName = (slug) => BANKS[slug] || BANKS.unknown;
