import { useMemo } from 'react';
import useTheme from '../store/theme';

const VARS = {
  income: '--c-income', expense: '--c-expense', up: '--c-up', down: '--c-down', mid: '--c-mid',
  grid: '--c-grid', axis: '--c-axis', ink: '--ink', ink2: '--ink-2', ink3: '--ink-3',
  surface: '--surface', surface2: '--surface-2', accent: '--accent', line: '--line',
  seq0: '--seq-0', seq1: '--seq-1', seq2: '--seq-2', seq3: '--seq-3', seq4: '--seq-4', seq5: '--seq-5',
};

/** Resolved token colours for SVG charts; recomputed when the theme changes. */
export default function useChartColors() {
  const resolved = useTheme((s) => s.resolved);
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const out = { theme: resolved };
    for (const [k, v] of Object.entries(VARS)) out[k] = style.getPropertyValue(v).trim();
    out.seq = [out.seq0, out.seq1, out.seq2, out.seq3, out.seq4, out.seq5];
    return out;
  }, [resolved]);
}
