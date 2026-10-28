import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import useAuth from '../store/auth';
import Logo from '../components/Logo';
import { Button, CategoryPill, Input, Sheet } from '../components/ui';

const DEMO = [
  ['POS PURCHASE SHOPRITE ACHIMOTA 0029384', 'food', '−245.50'],
  ['BOLT TRIP 7F2KQ ACCRA', 'transport', '−38.00'],
  ['ECG PREPAID 39201 TOKEN', 'utilities', '−150.00'],
  ['E-LEVY CHARGE REF 88213', 'charges', '−3.75'],
  ['SALARY OCT 2026 EMPLOYER', 'income', '+4,200.00'],
  ['TITHE PAYMENT ICGC', 'giving', '−200.00'],
];

function Demo() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setShown((n) => (n >= DEMO.length + 3 ? 0 : n + 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <ul className="space-y-2.5">
      {DEMO.map(([desc, slug, amount], i) => (
        <li key={desc} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-[#8f9187]">{desc}</p>
            <div className="mt-1.5 h-7">
              <AnimatePresence>
                {shown > i && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <CategoryPill slug={slug} className="!bg-white/[0.07] !text-[#ecebe4] !ring-white/10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <span className={`num font-mono text-sm ${amount.startsWith('+') ? 'text-[#4cc38a]' : 'text-[#ecebe4]'}`}>{amount}</span>
        </li>
      ))}
    </ul>
  );
}

function ForgotPassword({ open, onOpenChange, initialEmail }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [sent, setSent] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/password-reset/', { email: email.trim() });
      setSent(res.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSent(null); }} title="Reset your password" description={sent ? undefined : "We'll email you a link to choose a new one."}>
      {sent ? (
        <div className="py-4 text-center">
          <MailCheck size={32} className="mx-auto text-accent" />
          <p className="mt-4 text-sm leading-relaxed text-ink-2">{sent.message}</p>
          {sent.reset_url && (
            <a href={sent.reset_url} className="mt-4 inline-block text-sm font-medium text-accent underline">Development link: open reset page</a>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" className="w-full" size="lg" loading={loading}>Send reset link</Button>
        </form>
      )}
    </Sheet>
  );
}

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', fullName: '', password: '', passwordConfirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!isLogin && form.password !== form.passwordConfirm) {
      setErrors({ passwordConfirm: "Passwords don't match." });
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back');
      } else {
        await register(form);
        toast.success('Account created');
      }
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data || {};
      if (isLogin && err.response?.status === 401) {
        setErrors({ password: 'That email and password don’t match.' });
      } else if (data.email || data.password || data.full_name || data.password_confirm) {
        setErrors({ email: data.email?.[0], password: data.password?.[0], fullName: data.full_name?.[0], passwordConfirm: data.password_confirm?.[0] });
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 pb-8 pt-safe sm:px-10">
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink"><ArrowLeft size={15} /> Home</Link>
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <p className="eyebrow">{isLogin ? 'Welcome back' : 'Create your account'}</p>
            <h1 className="display mt-3 text-[34px] leading-[1.05] text-ink sm:text-[40px]">
              {isLogin ? 'Sign in to FinTrack' : 'Start with one statement'}
            </h1>
            <p className="mt-3 text-[15px] text-ink-2">
              {isLogin ? 'Pick up where you left off.' : 'Free. No bank login, no card needed.'}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4" noValidate={false}>
              {!isLogin && (
                <Input label="Full name" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} required placeholder="Ama Owusu" />
              )}
              <Input label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} error={errors.email} required placeholder="you@example.com" />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  hint={!isLogin ? 'At least 8 characters, not all numbers.' : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-[30px] flex h-10 w-10 items-center justify-center rounded-lg text-ink-3 hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {!isLogin && (
                <Input label="Confirm password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.passwordConfirm} onChange={set('passwordConfirm')} error={errors.passwordConfirm} required />
              )}
              {isLogin && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setForgotOpen(true)} className="text-sm font-medium text-accent hover:underline">Forgot password?</button>
                </div>
              )}
              <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={ArrowRight}>
                {isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-3">
              {isLogin ? 'New here? ' : 'Already have an account? '}
              <Link to={isLogin ? '/register' : '/login'} className="font-medium text-accent hover:underline">
                {isLogin ? 'Create an account' : 'Sign in'}
              </Link>
            </p>
            {!isLogin && (
              <p className="mt-4 text-center text-xs leading-relaxed text-ink-3">
                By continuing you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy policy</Link>.
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-[#121411] p-12 text-[#ecebe4] lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8f9187]">What FinTrack does</p>
          <h2 className="display mt-4 max-w-md text-[40px] leading-[1.05]">Cryptic statement lines, sorted into a month you can read.</h2>
        </div>
        <div className="my-10 max-w-lg"><Demo /></div>
        <p className="max-w-md text-sm leading-relaxed text-[#8f9187]">
          Categories come from about 200 Ghanaian merchants and keywords, plus the rules you teach it. Anything uncertain is marked “Other”, never guessed.
        </p>
      </aside>

      <ForgotPassword open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={form.email} />
    </div>
  );
}
