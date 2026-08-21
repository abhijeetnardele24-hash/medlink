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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#171717',
        border: '1px solid #ef444433',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '32rem',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          backgroundColor: '#ef44441a',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <AlertTriangle size={32} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#a3a3a3', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          We've been automatically notified and are looking into the issue. Please reload the application or try again later.
        </p>
        
        <div style={{
          backgroundColor: '#000',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'left',
          marginBottom: '2rem',
          overflowX: 'auto'
        }}>
          <code style={{ color: '#f87171', fontSize: '0.85rem' }}>
            {errorMessage || 'Unknown error'}
          </code>
        </div>
        
        <button
          onClick={resetError}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#423FDE',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3b38c6')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#423FDE')}
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
