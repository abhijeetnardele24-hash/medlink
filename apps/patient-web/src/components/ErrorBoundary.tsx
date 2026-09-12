import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorFallbackProps {
  error: unknown;
  componentStack: string | null;
  eventId: string | null;
  resetError: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
      <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-neutral-400 mb-6 text-sm">
          We've been automatically notified and are looking into the issue. Please reload the application or try again later.
        </p>
        
        <div className="bg-black p-4 rounded-lg text-left mb-8 overflow-x-auto">
          <code className="text-red-400 text-xs">
            {errorMessage || 'Unknown error'}
          </code>
        </div>
        
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none py-3 px-6 rounded-full text-base font-medium cursor-pointer transition-colors"
        >
          <RefreshCcw size={18} />
          Reload Application
        </button>
      </div>
    </div>
  );
};

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={(props) => <ErrorFallback {...props} />} showDialog>
      {children}
    </Sentry.ErrorBoundary>
  );
};
