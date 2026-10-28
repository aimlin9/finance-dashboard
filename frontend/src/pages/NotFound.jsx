import { Button } from '../components/ui';
import { LogoMark } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark size={40} />
      <p className="display num mt-8 text-[96px] leading-none tracking-[-0.04em] text-ink sm:text-[128px]">404</p>
      <p className="mt-4 text-lg text-ink-2">This page isn’t in the ledger.</p>
      <div className="mt-8 flex gap-3">
        <Button to="/">Go home</Button>
        <Button to="/dashboard" variant="secondary">Dashboard</Button>
      </div>
    </div>
  );
}
