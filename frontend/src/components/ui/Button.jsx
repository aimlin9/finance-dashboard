import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import cn from '../../lib/cn';
import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2 shadow-sm',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface-2',
  danger: 'bg-neg text-white hover:opacity-90',
  'danger-ghost': 'text-neg hover:bg-neg-soft',
  ink: 'bg-ink text-bg hover:opacity-90',
};

const SIZES = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-[10px]',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, className, to, href, children, disabled, ...props },
  ref,
) {
  const classes = cn(
    'relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
    'transition-[background-color,border-color,color,transform,opacity] duration-150 active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  const content = (
    <>
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={1.9} aria-hidden />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 15 : 17} strokeWidth={1.9} aria-hidden />}
    </>
  );
  if (to) return <Link ref={ref} to={to} className={classes} {...props}>{content}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...props}>{content}</a>;
  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});

export default Button;

export function IconButton({ icon: Icon, label, className, size = 40, iconSize = 18, badge, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink active:scale-95',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={1.8} aria-hidden />
      {badge ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neg px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
