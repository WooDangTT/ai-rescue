'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    try {
      const val = localStorage.getItem('betaBannerDismissed');
      if (val === 'true') setDismissed(true);
    } catch (error) {
      logger.warn('Failed to read localStorage for betaBannerDismissed', error);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(
      '--beta-banner-height',
      mounted && !dismissed ? '44px' : '0px'
    );
    return () => {
      document.documentElement.style.setProperty('--beta-banner-height', '0px');
    };
  }, [dismissed, mounted]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('betaBannerDismissed', 'true');
    } catch (error) {
      logger.warn('Failed to save betaBannerDismissed to localStorage', error);
    }
  };

  if (!mounted || dismissed) return null;

  return (
    <div data-testid="betaBanner" className="beta-banner">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="beta-banner-icon"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span data-testid="betaBannerMessage" className="beta-banner-message">
        현재 베타 서비스 운영 중입니다. 일부 기능이 변경되거나 불안정할 수 있습니다.
      </span>
      <button
        data-testid="betaBannerClose"
        onClick={handleDismiss}
        aria-label="배너 닫기"
        className="beta-banner-close"
      >
        ×
      </button>
    </div>
  );
}
