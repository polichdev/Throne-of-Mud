import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-amber-300 p-6 z-50">
          <div className="max-w-md bg-slate-900 border border-amber-600/50 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 text-center">
            <div className="text-3xl">⚠️</div>
            <h2 className="text-base font-bold font-serif text-amber-200">Виникла помилка інтерфейсу</h2>
            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-left">
              {this.state.error?.message || 'Невідома помилка'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Перезапустити вигляд
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
