Based on my analysis of the changed files, here is the updated project structure document:

**Tech Stack**
- Python 3 (CLI tools: `analyzer.py`, `reporter.py`)
- Next.js 16 + React 19 + TypeScript (web service), SQLite via better-sqlite3 (persistence)
- Claude CLI for AI analysis (4 parallel subprocess calls)
- Next.js App Router with server-side rendering
- Playwright + TypeScript for E2E testing

**Key Modules**
- `analyzer.py` — Parallel Claude CLI calls across 4 dimensions (scalability, stability, maintainability, security)
- `reporter.py` — Graded text/JSON report generation (A+ to F scale)
- `web/src/app/` — Next.js App Router with API routes, mock OAuth, background job processing, Free/Pro plan tiers
- `web/src/lib/db.ts` — SQLite (better-sqlite3) persistence for users and jobs
- `web/src/lib/analyzer.ts` — Analysis logic (TypeScript)
- `web/src/lib/session.ts` — Session management
- `web/src/components/AdBanner.tsx` — Google AdSense component
- `web/src/utils/logger.ts` — Logger with ISO timestamps and log levels

**Directory Structure**
```
.
├── main.py                      # CLI entry point
├── analyzer.py                  # 4-dimension parallel Claude analysis
├── reporter.py                  # Graded report generation
├── playwright.config.ts         # Playwright config (port 5050, testDir: ./web/e2e, actionTimeout 15s, navigationTimeout 30s)
├── package.json
├── prompts/                     # Claude prompt templates
│   ├── scalability.txt
│   ├── stability.txt
│   ├── maintainability.txt
│   └── security.txt
├── web/                         # Next.js web service
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── requirements.txt
│   ├── public/                  # Static assets (SVGs)
│   └── src/
│       ├── app/                 # Next.js App Router
│       │   ├── layout.tsx       # Root layout with metadata, AdSense, error filtering
│       │   ├── page.tsx         # Home page
│       │   ├── globals.css
│       │   ├── error.tsx
│       │   ├── global-error.tsx
│       │   ├── sitemap.ts
│       │   ├── robots.ts
│       │   ├── dashboard/
│       │   │   ├── page.tsx
│       │   │   └── DashboardClient.tsx
│       │   ├── pricing/
│       │   │   ├── page.tsx
│       │   │   └── PricingClient.tsx
│       │   ├── report/[jobId]/
│       │   │   ├── page.tsx
│       │   │   └── ReportClient.tsx
│       │   └── api/
│       │       ├── analyze/route.ts
│       │       ├── job/[jobId]/route.ts
│       │       ├── plan/route.ts
│       │       └── auth/
│       │           ├── login/route.ts
│       │           └── logout/route.ts
│       ├── components/
│       │   ├── Navbar.tsx
│       │   └── AdBanner.tsx
│       ├── lib/
│       │   ├── db.ts            # SQLite (better-sqlite3) database
│       │   ├── analyzer.ts      # Analysis logic
│       │   ├── session.ts       # Session management
│       │   └── grades.ts        # Grading utilities
│       └── utils/
│           └── logger.ts        # Logger with ISO timestamps, 4 levels
└── e2e/                         # Playwright E2E tests
    ├── helpers/test-utils.ts    # Shared test helpers
    └── tests/home.spec.ts
```