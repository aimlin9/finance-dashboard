import {
  Utensils, Bus, Zap, Home, GraduationCap, HeartPulse, ShoppingBag, Clapperboard,
  HandHeart, Receipt, Banknote, PiggyBank, ArrowDownLeft, CircleDashed,
} from 'lucide-react';

// Mirrors backend/apps/transactions/categories.py (served at
// /api/transactions/categories/). Keep the slugs and order in sync.
export const CATEGORIES = [
  { slug: 'food', name: 'Food & Groceries', icon: Utensils },
  { slug: 'transport', name: 'Transport', icon: Bus },
  { slug: 'utilities', name: 'Bills & Airtime', icon: Zap },
  { slug: 'housing', name: 'Rent & Housing', icon: Home },
  { slug: 'education', name: 'Education', icon: GraduationCap },
  { slug: 'health', name: 'Health', icon: HeartPulse },
  { slug: 'shopping', name: 'Shopping', icon: ShoppingBag },
  { slug: 'entertainment', name: 'Entertainment', icon: Clapperboard },
  { slug: 'giving', name: 'Church & Giving', icon: HandHeart },
  { slug: 'charges', name: 'Fees & Charges', icon: Receipt },
  { slug: 'cash', name: 'Cash Withdrawal', icon: Banknote },
  { slug: 'savings', name: 'Savings & Transfers', icon: PiggyBank },
  { slug: 'income', name: 'Income', icon: ArrowDownLeft },
  { slug: 'other', name: 'Other', icon: CircleDashed },
];

const BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

export function category(slug) {
  return BY_SLUG[slug] || { slug, name: slug ? slug[0].toUpperCase() + slug.slice(1) : 'Other', icon: CircleDashed };
}

export const SPENDING_CATEGORIES = CATEGORIES.filter((c) => c.slug !== 'income');
