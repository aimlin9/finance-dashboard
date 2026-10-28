import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { Sheet, Segmented } from '../ui';
import { NAV_SECTIONS } from './nav';
import useAuth from '../../store/auth';
import useTheme from '../../store/theme';
import cn from '../../lib/cn';

export default function MoreSheet({ open, onOpenChange }) {
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={user?.full_name || 'Menu'} description={user?.email}>
      <div className="space-y-5 pb-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="eyebrow mb-2">{section.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) => cn(
                    'flex h-14 items-center gap-3 rounded-2xl border px-3.5 text-sm font-medium transition-colors',
                    isActive ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line bg-surface-2/50 text-ink active:bg-surface-2',
                  )}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="leading-tight">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="eyebrow mb-2">Appearance</p>
          <Segmented
            label="Theme"
            className="w-full"
            value={preference}
            onChange={setPreference}
            options={[
              { value: 'system', label: 'Auto', icon: Monitor },
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
            ]}
          />
        </div>

        <button
          type="button"
          onClick={() => { logout(); navigate('/login'); }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-sm font-medium text-neg active:bg-neg-soft"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </Sheet>
  );
}
