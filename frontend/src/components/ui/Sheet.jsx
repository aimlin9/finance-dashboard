import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import cn from '../../lib/cn';

/**
 * One dialog component for every screen size: a swipe-to-dismiss bottom
 * sheet on phones (feels native on iOS and Android), a side panel on desktop.
 */
export default function Sheet({ open, onOpenChange, title, description, children, footer, size = 'md' }) {
  const desktop = useIsDesktop();
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={desktop ? 'right' : 'bottom'}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-[rgb(10_11_9/0.45)] backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            'fixed z-50 flex flex-col bg-surface outline-none',
            desktop
              ? cn('inset-y-3 right-3 rounded-2xl border border-line shadow-lg', size === 'lg' ? 'w-[560px]' : 'w-[440px]')
              : 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[22px] border-t border-line shadow-lg',
          )}
        >
          {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden />}
          <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              <Drawer.Title className="display text-[22px] font-medium leading-tight text-ink">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-1 text-sm text-ink-3">{description}</Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">{title}</Drawer.Description>
              )}
            </div>
            <Drawer.Close
              className="-mr-2 -mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-3 hover:bg-surface-2 hover:text-ink"
              aria-label="Close"
            >
              <X size={19} />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2 sm:px-6">{children}</div>
          {footer && (
            <div className="flex shrink-0 gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </div>
          )}
          {!footer && <div className="pb-safe" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
