'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(`[${new Date().toISOString()}] [ERROR] Unhandled error:`, error);
  }, [error]);

  return (
    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Something went wrong.</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error.message}</p>
      <button
        onClick={reset}
        className="btn btn-primary"
        data-testid="errorResetButton"
      >
        Try again
      </button>
    </div>
  );
}
