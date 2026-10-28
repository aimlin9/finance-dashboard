import cn from '../../lib/cn';

export default function Card({ title, eyebrow, action, children, className, bodyClassName, as: Tag = 'section', ...props }) {
  return (
    <Tag className={cn('card min-w-0 overflow-hidden', className)} {...props}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('px-5 pb-5 pt-4 sm:px-6', !(title || eyebrow || action) && 'pt-5', bodyClassName)}>{children}</div>
    </Tag>
  );
}
