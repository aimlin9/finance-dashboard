import { useEffect, useState } from 'react';

/** True once `active` has stayed true for `ms`, e.g. to explain a slow cold start. */
export default function useSlow(active, ms = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setSlow(true), ms);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, ms]);
  return active && slow;
}
