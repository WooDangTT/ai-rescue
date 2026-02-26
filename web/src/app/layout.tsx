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
