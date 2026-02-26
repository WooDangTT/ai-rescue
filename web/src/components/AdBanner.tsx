'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdBannerProps {
  testId?: string;
}

export default function AdBanner({ testId = 'adBanner' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const insEl = adRef.current;
    if (!insEl) return;

    function tryPush() {
      if (!insEl) return;

      const status = insEl.getAttribute('data-adsbygoogle-status');
      if (status === 'done') return;

      const rect = insEl.getBoundingClientRect();
      if (rect.width === 0) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense errors handled by layout.tsx error filter
      }
    }

    let retryCount = 0;
    const maxRetries = 10;

    function attemptPush() {
      const rect = insEl!.getBoundingClientRect();
      if (rect.width > 0) {
        rafRef.current = requestAnimationFrame(tryPush);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptPush, 200);
      }
    }

    attemptPush();

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const adStatus =
    typeof document !== 'undefined'
      ? adRef.current?.getAttribute('data-ad-status')
      : null;
  const showPlaceholder = adStatus !== 'filled';

  return (
    <div
      style={{
        position: 'relative',
        maxHeight: '280px',
        overflow: 'hidden',
        clipPath: 'inset(0)',
        zIndex: 5,
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          minWidth: '300px',
          width: '100%',
          maxHeight: '280px',
          overflow: 'hidden',
        }}
        data-ad-client="ca-pub-1568162576697577"
        data-ad-slot="9297599929"
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-testid={testId}
      />
      {showPlaceholder && (
        <div
          data-testid={`${testId}-placeholder`}
          style={{
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary, #faf8f5)',
            border: '1px dashed var(--border, #eee8e0)',
            borderRadius: '8px',
            color: 'var(--text-muted, #a09aae)',
            fontSize: '0.8rem',
          }}
        >
          Advertisement
        </div>
      )}
    </div>
  );
}
