import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const stale = /dynamically imported module|Failed to fetch/i.test(String(this.state.error?.message));
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="eyebrow">Something broke</p>
        <h1 className="display mt-3 text-3xl text-ink">
          {stale ? 'A newer version is available' : 'This page hit an error'}
        </h1>
        <p className="mt-3 max-w-sm text-sm text-ink-3">
          {stale ? 'Reload to get the latest FinTrack.' : 'Your data is safe. Reloading usually fixes it.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 h-11 rounded-xl bg-accent px-5 text-sm font-medium text-accent-ink"
        >
          Reload
        </button>
      </div>
    );
  }
}
