'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>Something went wrong!</h1>
        <p>{error.message}</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
