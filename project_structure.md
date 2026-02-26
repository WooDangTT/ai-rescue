The `project_structure.md` has been generated at the project root. Here's a summary of what was captured:

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

**Directory Structure** — Covers CLI entry point, prompt templates, Flask web service, static assets, Jinja2 templates, and Playwright E2E tests with shared helpers.