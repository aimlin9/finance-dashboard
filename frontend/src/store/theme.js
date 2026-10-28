import { create } from 'zustand';

const THEME_COLORS = { light: '#f5f3ee', dark: '#0d0e0c' };
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function read() {
  try {
    return localStorage.getItem('theme') || 'system';
  } catch {
    return 'system';
  }
}

function resolve(pref) {
  if (pref === 'system') return media?.matches ? 'dark' : 'light';
  return pref;
}

function apply(pref) {
  const resolved = resolve(pref);
  document.documentElement.dataset.theme = resolved;
  // Colours the browser chrome / status bar on Android and iOS
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[resolved]));
  return resolved;
}

const initial = read();

const useTheme = create((set, get) => ({
  preference: initial, // 'system' | 'light' | 'dark'
  resolved: typeof document !== 'undefined' ? apply(initial) : 'light',

  setPreference(preference) {
    try {
      localStorage.setItem('theme', preference);
    } catch {
      // Private mode: theme still applies for this visit
    }
    set({ preference, resolved: apply(preference) });
  },

  toggle() {
    get().setPreference(get().resolved === 'dark' ? 'light' : 'dark');
  },
}));

media?.addEventListener('change', () => {
  const { preference } = useTheme.getState();
  if (preference === 'system') useTheme.setState({ resolved: apply('system') });
});

export default useTheme;
