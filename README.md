# HuntOS

**Your personal operating system for getting hired.**

Stop searching. Start hunting.

[![Live Demo](https://img.shields.io/badge/demo-live-8b5cf6?style=for-the-badge)](https://shubhransh-gupta.github.io/HuntOS/)
[![License: MIT](https://img.shields.io/badge/license-MIT-18181b?style=for-the-badge)](LICENSE)

HuntOS is a **local-first**, AI-powered job hunting platform built for one person: you. It collapses the entire job search loop — discover, evaluate, tailor, apply, track — into a single focused workspace. No job board noise. No accounts. No cloud storage by default.

**Live app:** https://shubhransh-gupta.github.io/HuntOS/

---

## Why HuntOS

Most job tools optimize for *volume*. HuntOS optimizes for **high-quality applications**.

```text
500 discovered  →  72 relevant  →  18 strong  →  6 exceptional  →  3 apply now
```

Open HuntOS in the morning and see what actually matters — not another endless feed.

---

## Features

### Hunt & Match
- Multi-source job discovery (sample data, Greenhouse, Lever, public URLs, manual import)
- Canonical deduplication across sources
- Transparent matching engine with explainable scores
- Hunt profiles with role, location, salary, and keyword filters
- Dashboard focused on top matches, not raw job counts

### Resume Intelligence
- Resume upload & AI parsing (PDF, DOCX, TXT, MD)
- Master resume as source of truth — AI never fabricates experience
- Tailored resume generation per job
- Gap analysis, ATS estimate, and improvement suggestions (approve before save)

### Application OS
- Kanban tracker (Saved → Applied → Interview → Offer)
- Duplicate application warnings
- Follow-up message drafts after 7+ days
- Browser notifications for exceptional matches

### Developer Experience
- Command palette (`Cmd/Ctrl+K`) and keyboard shortcuts
- Dark-first UI with local IndexedDB storage
- Export everything (JSON, CSV, PDF, DOCX)
- Pluggable AI providers: OpenAI, Anthropic, Ollama, OpenAI-compatible

---

## Quick Start

```bash
git clone https://github.com/shubhransh-gupta/HuntOS.git
cd HuntOS
npm install
npm run dev
```

Open http://localhost:5173 → complete onboarding → click **Hunt**.

### Configure AI (optional)

1. **Settings → AI Provider**
2. Choose provider and model
3. Enter API key (stored locally in IndexedDB only)
4. **Test Connection**

Without an API key, HuntOS uses a mock provider for offline development.

### Configure Live Sources

1. **Settings → Live Job Sources**
2. Add Greenhouse board slugs (e.g. `figma`) or Lever companies (e.g. `netflix`)
3. Enable sources in your **Hunt Profile**
4. Run a **Hunt**

Sources that block browser access fail gracefully — use **Import** instead. HuntOS never bypasses CAPTCHA, auth, or anti-bot protections.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run build:pages` | Build for GitHub Pages |
| `npm run test` | Run Vitest tests |
| `npm run typecheck` | TypeScript check |
| `npm run preview` | Preview production build |

---

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** — dark, purple-accented UI
- **Dexie.js** — IndexedDB storage abstraction
- **Vitest** — matching, dedup, and source adapter tests
- **GitHub Pages** — automated deploy on `main` via Actions

---

## Architecture

Local-first SPA with swappable layers:

```text
UI  →  Features (hunt, matching, resume, applications)
     →  Services (storage, AI, sources, parser)
     →  IndexedDB
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for data flow, source adapters, and extension points.

---

## Privacy

All profile, resume, job, and application data stays in your browser. See [PRIVACY.md](./PRIVACY.md).

---

## Contributing

`main` is protected — open a pull request instead of pushing directly.

```bash
git checkout -b feature/my-change
git commit -am "Describe your change"
git push -u origin feature/my-change
gh pr create
```

---

## License

MIT — see [LICENSE](./LICENSE).
