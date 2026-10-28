import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Monitor, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import api, { downloadFile, errorMessage } from '../lib/api';
import { CURRENCIES, RATES_NOTE, date } from '../lib/format';
import useAuth from '../store/auth';
import useTheme from '../store/theme';
import { Button, Card, ConfirmSheet, Input, PageHeader, Segmented, Select } from '../components/ui';

function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || 'GHS');
  const [saving, setSaving] = useState(false);
  const dirty = name !== user?.full_name || currency !== user?.currency;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: name.trim(), currency });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card eyebrow="Profile" title="You">
      <form onSubmit={save} className="space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoComplete="name" />
        <Input label="Email" value={user?.email || ''} disabled hint={`Member since ${date(user?.created_at, 'MMMM yyyy')}`} />
        <Select label="Show amounts in" value={currency} onChange={(e) => setCurrency(e.target.value)} hint={currency !== 'GHS' ? RATES_NOTE : undefined}>
          {Object.entries(CURRENCIES).map(([code, c]) => <option key={code} value={code}>{c.symbol} · {c.label}</option>)}
        </Select>
        <Button type="submit" loading={saving} disabled={!dirty}>Save profile</Button>
      </form>
    </Card>
  );
}

function Security() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) {
      setErrors({ confirm: "The new passwords don't match." });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await api.post('/auth/password/change/', { current_password: current, new_password: next });
      toast.success('Password changed');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      const data = err.response?.data || {};
      setErrors({ current: data.current_password?.[0], next: data.new_password?.[0] });
      if (!data.current_password && !data.new_password) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card eyebrow="Security" title="Change password">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} required />
        <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} hint="At least 8 characters, not all numbers." required minLength={8} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} required />
        <Button type="submit" loading={saving} disabled={!current || !next}>Update password</Button>
      </form>
    </Card>
  );
}

function Appearance() {
  const { preference, setPreference } = useTheme();
  return (
    <Card eyebrow="Appearance" title="Theme">
      <Segmented
        label="Theme"
        value={preference}
        onChange={setPreference}
        options={[
          { value: 'system', label: 'Match device', icon: Monitor },
          { value: 'light', label: 'Light', icon: Sun },
          { value: 'dark', label: 'Dark', icon: Moon },
        ]}
      />
    </Card>
  );
}

function DataControls() {
  const reset = useAuth((s) => s.reset);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const destroy = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/delete-account/', { password });
      reset();
      toast.success('Your account and all its data were deleted');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.password?.[0] || errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card eyebrow="Your data" title="Export or delete">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">Download every transaction as a CSV you can open in Excel or Google Sheets.</p>
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => toast.promise(downloadFile('/transactions/export/', 'fintrack_transactions_all.csv'), { loading: 'Preparing…', success: 'CSV downloaded', error: 'Export failed' })}
          >
            Export all
          </Button>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">Permanently delete your account, statements, transactions, budgets and goals.</p>
          <Button variant="danger-ghost" onClick={() => setOpen(true)}>Delete account</Button>
        </div>
      </div>
      <ConfirmSheet
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) { setPassword(''); setError(''); } }}
        title="Delete your account?"
        description="Everything is erased immediately. This can't be undone."
        confirmLabel="Delete everything"
        loading={busy}
        onConfirm={destroy}
      >
        <Input label="Enter your password to confirm" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
      </ConfirmSheet>
    </Card>
  );
}

export default function Settings() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Manage" title="Settings" />
      <div className="space-y-5">
        <Profile />
        <Appearance />
        <Security />
        <DataControls />
      </div>
    </div>
  );
}
