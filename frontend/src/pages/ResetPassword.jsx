import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import Logo from '../components/Logo';
import { Button, Input } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get('uid');
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/password-reset/confirm/', { uid, token, new_password: password });
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.new_password?.[0];
      if (msg) setError(msg);
      else toast.error(errorMessage(err, 'This reset link is invalid or has expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-safe sm:px-10">
      <div className="flex h-16 items-center"><Logo /></div>
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center pb-16">
        {!uid || !token ? (
          <div className="text-center">
            <LinkIcon size={30} className="mx-auto text-ink-3" />
            <h1 className="display mt-4 text-3xl text-ink">This link is incomplete</h1>
            <p className="mt-2 text-sm text-ink-3">Open the link from your email again, or request a new one.</p>
            <Button className="mt-6" to="/login">Back to sign in</Button>
          </div>
        ) : done ? (
          <div className="text-center">
            <CheckCircle2 size={34} className="mx-auto text-accent" />
            <h1 className="display mt-4 text-3xl text-ink">Password updated</h1>
            <p className="mt-2 text-sm text-ink-3">You can sign in with your new password now.</p>
            <Button className="mt-6" onClick={() => navigate('/login')}>Sign in</Button>
          </div>
        ) : (
          <>
            <p className="eyebrow">Account recovery</p>
            <h1 className="display mt-3 text-[36px] leading-tight text-ink">Choose a new password</h1>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters, not all numbers." required minLength={8} autoFocus />
              <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={error} required />
              <Button type="submit" size="lg" className="w-full" loading={loading}>Update password</Button>
            </form>
            <p className="mt-6 text-center text-sm text-ink-3"><Link to="/login" className="text-accent hover:underline">Back to sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
