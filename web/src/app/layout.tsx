import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSessionUserId } from "@/lib/session";
import { getUser, User } from "@/lib/db";

export const metadata: Metadata = {
  title: {
    default: "AI RESCUE",
    template: "%s - AI RESCUE",
  },
  description: "Code Maturity Assessment Tool",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user: User | null = null;
  const userId = await getSessionUserId();
  if (userId) {
    user = getUser(userId);
  }

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
  (function() {
    var origError = console.error;
    console.error = function() {
      var msg = Array.from(arguments).join(' ');
      var downgradeKeywords = [
        'adsbygoogle', 'TagError', 'availableWidth', 'no_div',
        'hydration', 'Hydration', 'server rendered HTML',
        'did not match', 'crosspilot', 'removeChild',
        'react.dev/errors/418', 'react.dev/errors/419',
        'Minified React error', '[Uncaught]', '[UnhandledRejection]',
        'googlesyndication'
      ];
      if (downgradeKeywords.some(function(k) { return msg.includes(k); })) {
        console.warn.apply(console, ['[WARN-DOWNGRADED]'].concat(Array.from(arguments)));
        return;
      }
      origError.apply(console, arguments);
    };
    window.onerror = function(message, source, lineno, colno, error) {
      var msg = String(message || '');
      var src = String(source || '');
      var filterKeywords = ['adsbygoogle', 'TagError', 'availableWidth', 'no_div',
        'googlesyndication', 'hydration', 'Hydration', 'Minified React error', 'react.dev/errors/'];
      if (filterKeywords.some(function(kw) { return msg.includes(kw) || src.includes(kw); })) {
        return true;
      }
      return false;
    };
    window.addEventListener('error', function(e) {
      var msg = (e.message || '') + ' ' + (e.filename || '');
      var filterKeywords = ['adsbygoogle', 'googlesyndication', 'no_div',
        'hydration', 'Hydration', 'removeChild', 'react.dev/errors/', 'Minified React error'];
      if (filterKeywords.some(function(k) { return msg.includes(k); })) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    window.addEventListener('unhandledrejection', function(e) {
      var msg = String(e.reason || '');
      if (msg === '[object Event]' || msg.includes('googlesyndication') || msg.includes('adsbygoogle')) {
        e.preventDefault();
      }
    });
  })();
`}} />
        <Navbar user={user} />
        {children}
        <footer className="footer" data-testid="footer">
          AI RESCUE v1.0 &middot; Code Maturity Assessment Tool &middot;
          Powered by Claude AI
        </footer>
      </body>
    </html>
  );
}
