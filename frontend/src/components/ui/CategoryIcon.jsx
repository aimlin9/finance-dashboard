import { category } from '../../lib/categories';
import cn from '../../lib/cn';

export default function CategoryIcon({ slug, size = 36, className }) {
  const { icon: Icon, name } = category(slug);
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[11px] bg-surface-2 text-ink-2 ring-1 ring-inset ring-line', className)}
      style={{ width: size, height: size }}
      title={name}
    >
      <Icon size={Math.round(size * 0.47)} strokeWidth={1.7} aria-hidden />
    </span>
  );
}

export function CategoryPill({ slug, className, onClick }) {
  const { icon: Icon, name } = category(slug);
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line',
        onClick && 'transition-colors hover:bg-surface-3 hover:text-ink',
        className,
      )}
    >
      <Icon size={13} strokeWidth={1.9} aria-hidden className="shrink-0" />
      <span className="truncate">{name}</span>
    </Tag>
  );
}
