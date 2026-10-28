import useMoney from '../../hooks/useMoney';
import cn from '../../lib/cn';

/** An amount with tabular figures; tone colours credits/debits by meaning. */
export default function Money({ value, type, sign, compact, className, tone = true }) {
  const format = useMoney();
  const signed = type === 'debit' ? -Math.abs(value) : type === 'credit' ? Math.abs(value) : value;
  const text = format(signed, { compact, sign: sign ?? (type ? 'always' : 'negative') });
  return (
    <span className={cn('num whitespace-nowrap', tone && type === 'credit' && 'text-pos', className)}>
      {text}
    </span>
  );
}
