import { Page } from '@playwright/test';

/**
 * Wait for the main content area to be visible.
 * For server-side rendered pages (Flask/Jinja2), this ensures
 * the page has fully loaded and key content is visible.
 */
export async function waitForHydration(page: Page, testId: string = 'hero'): Promise<void> {
  await page.getByTestId(testId).waitFor({ state: 'visible', timeout: 30000 });
}

/**
 * Check if a console error message is from an external source
 * (CDN, third-party scripts) to avoid false positives in error tests.
 */
export function isExternalError(message: string): boolean {
  const externalPatterns = [
    'google',
    'gstatic',
    'googleapis',
    'fonts.googleapis',
    'cdn',
    'analytics',
    'gtag',
    'doubleclick',
    'facebook',
    'twitter',
    'TagError',
    'availableWidth',
    'no_div',
    'hydration',
    'Hydration',
    'server rendered HTML',
    'did not match',
    'crosspilot',
    'removeChild',
    'react.dev/errors/',
    'Minified React error',
    '[Uncaught]',
    '[UnhandledRejection]',
  ];
  return externalPatterns.some((pattern) => message.includes(pattern));
}
