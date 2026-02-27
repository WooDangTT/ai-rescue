import '@testing-library/jest-dom';

// REQUIRED: Mock Next.js next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// REQUIRED: Mock next/image using React.createElement (no JSX in setup.ts)
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const React = require('react');
    return React.createElement('img', props);
  },
}));

// REQUIRED: Isolate localStorage/sessionStorage between tests
beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
});

// REQUIRED: Mock global fetch to prevent "fetch is not defined" warnings
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response)
  );
}
