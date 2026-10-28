import cn from '../../lib/cn';

const TONES = {
  neutral: 'bg-surface-2 text-ink-2 ring-line',
  accent: 'bg-accent-soft text-accent ring-transparent',
  gold: 'bg-gold-soft text-gold ring-transparent',
  warn: 'bg-warn-soft text-warn ring-transparent',
  neg: 'bg-neg-soft text-neg ring-transparent',
};

export default function Badge({ tone = 'neutral', icon: Icon, children, className }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset', TONES[tone], className)}>
      {Icon && <Icon size={12} strokeWidth={2.2} aria-hidden />}
      {children}
    </span>
  );
}
