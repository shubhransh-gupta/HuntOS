# HuntOS

**Your personal operating system for getting hired.**

Stop searching. Start hunting.

HuntOS is a local-first, AI-powered job hunting platform for personal use. It helps you discover jobs, score them against your profile, tailor your resume, and track applications — all stored locally in your browser.

## Features

- Resume upload & AI parsing (PDF, DOCX, TXT, MD)
- Master resume & editable profile
- Multiple hunt profiles
- Structured matching engine with explainable scores
- Job deduplication across sources
- Resume gap analysis & tailored resume generation
- Application tracker (Kanban)
- Follow-up message generation
- Command palette (Cmd/Ctrl+K)
- Export data (JSON, CSV, PDF, DOCX)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and complete onboarding.

**Live demo:** https://shubhransh-gupta.github.io/HuntOS/

## Configure AI Provider

1. Go to **Settings**
2. Choose provider (OpenAI, Anthropic, Ollama, OpenAI-compatible)
3. Enter model and API key (stored locally in IndexedDB)
4. Click **Test Connection**

Without an API key, HuntOS uses a mock provider for offline development.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest tests |
| `npm run preview` | Preview production build |

## Sample Data

Run a **Hunt** to load jobs from configured sources. Sample data works offline; live sources use public Greenhouse/Lever APIs configured in **Settings → Live Job Sources**.

## Privacy

All data stays local. See [PRIVACY.md](./PRIVACY.md).

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## License

MIT
