import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, OctagonAlert } from 'lucide-react';
import cn from '../../lib/cn';
import { statusFor } from '../../lib/budget';

const STATUS = {
  ok: { bar: 'bg-accent', text: 'text-ink-3', icon: CheckCircle2, word: 'On track' },
  warning: { bar: 'bg-warn', text: 'text-warn', icon: AlertTriangle, word: 'Close to limit' },
  exceeded: { bar: 'bg-neg', text: 'text-neg', icon: OctagonAlert, word: 'Over budget' },
};

export default function Meter({ value, status, className, height = 8, showStatus = false, color }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const s = STATUS[status || statusFor(value)];
  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-full bg-surface-3"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(value || 0)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={cn('h-full rounded-full', !color && s.bar)}
          style={color ? { background: color } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showStatus && (
        <p className={cn('mt-1.5 inline-flex items-center gap-1 text-xs font-medium', s.text)}>
          <s.icon size={13} aria-hidden /> {s.word}
        </p>
      )}
    </div>
  );
}
