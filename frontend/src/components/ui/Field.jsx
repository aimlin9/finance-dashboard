import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import cn from '../../lib/cn';

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 ' +
  'transition-[border-color,box-shadow] outline-none hover:border-line-strong ' +
  'focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)] ' +
  'aria-[invalid=true]:border-neg disabled:opacity-60';

export function Field({ label, hint, error, children, className, htmlFor, optional }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[13px] font-medium text-ink-2">
          {label}
          {optional && <span className="text-xs font-normal text-ink-3">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[13px] text-neg">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, hint, error, className, prefix, optional, ...props }, ref) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={props.id || id} className={className} optional={optional}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-ink-3">{prefix}</span>
        )}
        <input
          ref={ref}
          id={props.id || id}
          aria-invalid={error ? true : undefined}
          className={cn(control, 'h-12', prefix && 'pl-12')}
          {...props}
        />
      </div>
    </Field>
  );
});

export function Select({ label, hint, error, className, children, selectClassName, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={props.id || id} className={className}>
      <div className="relative">
        <select
          id={props.id || id}
          className={cn(control, 'h-12 appearance-none pr-10', selectClassName)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
      </div>
    </Field>
  );
}

export function Textarea({ label, hint, error, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={props.id || id} className={className}>
      <textarea id={props.id || id} className={cn(control, 'min-h-24 py-3 leading-relaxed')} {...props} />
    </Field>
  );
}
