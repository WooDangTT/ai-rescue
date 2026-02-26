**Tech Stack**
- Python 3 + Flask (web service), SQLite (persistence)
- Claude CLI for AI analysis (4 parallel subprocess calls)
- Jinja2 server-side rendered templates
- Playwright + TypeScript for E2E testing

**Key Modules**
- `analyzer.py` — Parallel Claude CLI calls across 4 dimensions (scalability, stability, maintainability, security)
- `reporter.py` — Graded text/JSON report generation (A+ to F scale)
- `web/app.py` — Flask SaaS with mock OAuth, zip upload, background job processing, Free/Pro plan tiers
- `web/database.py` — SQLite persistence for users and jobs

**Directory Structure**
```
.
├── main.py                      # CLI entry point
├── analyzer.py                  # 4-dimension parallel Claude analysis
├── reporter.py                  # Graded report generation
├── playwright.config.ts         # Playwright config (port 5050, actionTimeout 15s, navigationTimeout 30s)
├── package.json
├── prompts/                     # Claude prompt templates
│   ├── scalability.txt
│   ├── stability.txt
│   ├── maintainability.txt
│   └── security.txt
├── web/                         # Flask web service
│   ├── app.py
│   ├── database.py
│   ├── requirements.txt
│   ├── static/css/style.css
│   └── templates/               # Jinja2 templates
│       ├── base.html
│       ├── index.html
│       ├── dashboard.html
│       ├── pricing.html
│       └── report.html
├── e2e/                         # Playwright E2E tests
│   ├── helpers/test-utils.ts    # Shared test helpers
│   └── tests/home.spec.ts
└── maestro/                     # Maestro mobile test directory
    └── tests/                   # Maestro YAML test files
```