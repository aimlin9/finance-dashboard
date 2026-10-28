import { useCallback } from 'react';
import useAuth from '../store/auth';
import { money } from '../lib/format';

/** money() bound to the signed-in user's display currency. */
export default function useMoney() {
  const currency = useAuth((s) => s.user?.currency) || 'GHS';
  return useCallback((value, options) => money(value, { currency, ...options }), [currency]);
}
