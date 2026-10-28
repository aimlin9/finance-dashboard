import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import useAuth from './store/auth';
import useTheme from './store/theme';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import { LogoMark } from './components/Logo';
import { PageSkeleton } from './components/ui';
import WakingNotice from './components/WakingNotice';
import useSlow from './hooks/useSlow';

const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Legal = lazy(() => import('./pages/Legal'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Upload = lazy(() => import('./pages/Upload'));
const Budget = lazy(() => import('./pages/Budget'));
const SavingsGoals = lazy(() => import('./pages/SavingsGoals'));
const Compare = lazy(() => import('./pages/Compare'));
const Recurring = lazy(() => import('./pages/Recurring'));
const Report = lazy(() => import('./pages/Report'));
const Statements = lazy(() => import('./pages/Statements'));
const Rules = lazy(() => import('./pages/Rules'));
const Settings = lazy(() => import('./pages/Settings'));

function Splash() {
  const slow = useSlow(true, 3500);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-8">
      <LogoMark size={44} className="animate-pulse" />
      <WakingNotice show={slow} className="max-w-xs" />
    </div>
  );
}

function Protected({ children }) {
  const status = useAuth((s) => s.status);
  const location = useLocation();
  if (status === 'checking') return <Splash />;
  if (status === 'out') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </AppShell>
  );
}

function PublicOnly({ children }) {
  const status = useAuth((s) => s.status);
  if (status === 'checking') return <Splash />;
  if (status === 'in') return <Navigate to="/dashboard" replace />;
  return children;
}

const app = [
  ['/dashboard', Dashboard],
  ['/transactions', Transactions],
  ['/upload', Upload],
  ['/budget', Budget],
  ['/savings', SavingsGoals],
  ['/compare', Compare],
  ['/recurring', Recurring],
  ['/report', Report],
  ['/statements', Statements],
  ['/rules', Rules],
  ['/settings', Settings],
];

export default function App() {
  const checkAuth = useAuth((s) => s.checkAuth);
  const theme = useTheme((s) => s.resolved);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          theme={theme}
          position="top-center"
          offset={{ top: 'max(16px, env(safe-area-inset-top))' }}
          toastOptions={{
            classNames: {
              toast: '!rounded-2xl !border !border-line !bg-surface !text-ink !shadow-md !font-sans',
              description: '!text-ink-3',
            },
          }}
        />
        <Suspense fallback={<Splash />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicOnly><Auth mode="login" /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Auth mode="register" /></PublicOnly>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Legal doc="privacy" />} />
            <Route path="/terms" element={<Legal doc="terms" />} />
            <Route path="/about" element={<About />} />
            {app.map(([path, Page]) => (
              <Route key={path} path={path} element={<Protected><Page /></Protected>} />
            ))}
            <Route path="/history" element={<Navigate to="/statements" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
