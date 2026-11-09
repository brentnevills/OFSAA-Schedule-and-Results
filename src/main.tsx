import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Caught by Boundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b2341] text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white text-slate-800 rounded-2xl p-6 shadow-2xl border-t-4 border-sky-400 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-sky-50 rounded-full flex items-center justify-center border border-sky-200">
              <img
                src="./favicon.png"
                alt="OFSAA Logo"
                className="w-10 h-10 object-contain drop-shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <h2 className="text-xl font-black text-[#0b2341] mb-2">
              OFSAA Volleyball Championship
            </h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              The tournament portal encountered a momentary display issue. Click below to refresh the live tournament schedule and standings.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-[#0b2341] hover:bg-sky-950 text-white font-bold text-sm rounded-xl transition shadow-xs cursor-pointer"
              >
                Reload Live Tournament
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Clear Local Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
