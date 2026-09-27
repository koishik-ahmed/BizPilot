import React from 'react';
import { AlertCircle, RefreshCw, LogOut, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleLogout = () => {
    localStorage.removeItem('bizpilot_token');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-6 selection:bg-brand-500 selection:text-white">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-card border border-rose-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              We encountered an unexpected error while displaying this page. Your data is secure.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-left text-xs font-mono text-rose-700 break-words max-h-28 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-600 text-white font-bold text-xs shadow-md hover:bg-brand-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

