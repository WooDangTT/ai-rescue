import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSessionUserId } from "@/lib/session";
import { getUser, User } from "@/lib/db";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://example.com"),
  title: {
    default: "AI RESCUE - Code Maturity Assessment Tool",
    template: "%s | AI RESCUE",
  },
  description:
    "AI가 코드를 4가지 핵심 차원(확장성, 안정성, 유지보수성, 보안성)에서 분석하여 장기적 완성도를 평가합니다.",
  keywords: [
    "code analysis",
    "code maturity",
    "AI code review",
    "scalability",
    "stability",
    "maintainability",
    "security",
    "코드 분석",
    "코드 품질",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "AI RESCUE",
    title: "AI RESCUE - Code Maturity Assessment Tool",
    description:
      "AI가 코드를 4가지 핵심 차원에서 분석하여 장기적 완성도를 평가합니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI RESCUE - Code Maturity Assessment Tool",
    description:
      "AI가 코드를 4가지 핵심 차원에서 분석하여 장기적 완성도를 평가합니다.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="preload"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var l=document.createElement('link');
            l.rel='stylesheet';l.crossOrigin='anonymous';
            l.href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
            document.head.appendChild(l);
          })();
        `}} />
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
        'react.dev/errors/422', 'react.dev/errors/423',
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
      var filterKeywords = [
        'adsbygoogle', 'TagError', 'availableWidth', 'no_div',
        'googlesyndication', 'pagead',
        'hydration', 'Hydration', 'server rendered HTML', 'did not match',
        'crosspilot', 'Minified React error', 'react.dev/errors/'
      ];
      if (filterKeywords.some(function(kw) { return msg.includes(kw) || src.includes(kw); })) {
        return true;
      }
      return false;
    };
    window.addEventListener('error', function(e) {
      var msg = (e.message || '') + ' ' + (e.filename || '') + ' ' + ((e.error && e.error.stack) || '');
      var filterKeywords = [
        'adsbygoogle', 'googlesyndication', 'no_div',
        'hydration', 'Hydration', 'removeChild',
        'react.dev/errors/', 'Minified React error',
        '[Uncaught]'
      ];
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
      </head>
      <body>
        <Navbar user={user} />
        {children}
        <footer className="footer" data-testid="footer">
          AI RESCUE v1.0 &middot; Code Maturity Assessment Tool &middot;
          Powered by Claude AI
        </footer>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1568162576697577"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://logs.jan2s.ai/log-sdk.js"
          data-project-id="42"
          data-app="web"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
