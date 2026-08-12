<p align="center">
  <img src="docs/images/hero.svg" alt="HuntOS" width="120" />
</p>

<h1 align="center">HuntOS</h1>

<p align="center">
  <strong>Stop searching. Start hunting.</strong><br />
  Your personal operating system for getting hired — 100% local-first in your browser.
</p>

<p align="center">
  <a href="https://shubhransh-gupta.github.io/HuntOS/"><strong>Live Demo</strong></a>
  ·
  <a href="https://github.com/shubhransh-gupta/HuntOS">GitHub</a>
  ·
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/privacy-100%25%20local-brightgreen" alt="100% local" />
  <img src="https://img.shields.io/badge/stack-React%20%2B%20TypeScript-blue" alt="React + TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT License" />
</p>

<p align="center">
  <img src="docs/images/marketing.svg" alt="HuntOS marketing site" width="900" />
</p>

---

HuntOS collapses the entire job search loop — discover, evaluate, tailor, apply, track — into a single focused workspace. **All profile, resume, and application data stays in your browser by default** — no account, no cloud storage.

🔒 **Runs entirely in your browser.**

## Screenshots

### Welcome & onboarding
<p align="center">
  <img src="docs/images/onboarding.svg" alt="HuntOS welcome and onboarding" width="720" />
</p>

<p align="center"><em>Set up your master profile, upload a resume, and create your first hunt profile in minutes.</em></p>

### Dashboard
<p align="center">
  <img src="docs/images/dashboard.svg" alt="HuntOS dashboard with top matches and hunt summary" width="900" />
</p>

<p align="center"><em>Morning dashboard focused on top matches, not raw job counts — 500 discovered → 6 exceptional → 3 apply now.</em></p>

### Hunt & job discovery
<p align="center">
  <img src="docs/images/hunt.svg" alt="HuntOS hunt pipeline with multi-source discovery" width="900" />
</p>

<p align="center"><em>Run hunts across sample data, Greenhouse, Lever, public URLs, and manual imports.</em></p>

### Match analysis
<p align="center">
  <img src="docs/images/match.svg" alt="Explainable job match scoring" width="900" />
</p>

<p align="center"><em>Transparent matching engine with explainable scores — skills, experience, location, and salary fit.</em></p>

### Application tracker
<p align="center">
  <img src="docs/images/applications.svg" alt="Kanban application tracker" width="900" />
</p>

<p align="center"><em>Track every application from saved to offer with follow-up reminders and duplicate warnings.</em></p>

## Features

- ✓ Multi-source job discovery (sample data, Greenhouse, Lever, public URLs, manual import)
- ✓ Canonical deduplication across sources
- ✓ Transparent matching engine with explainable scores
- ✓ Hunt profiles with role, location, salary, and keyword filters
- ✓ Resume upload & AI parsing (PDF, DOCX, TXT, MD)
- ✓ Master resume as source of truth — AI never fabricates experience
- ✓ Tailored resume generation per job with ATS estimate
- ✓ Application Kanban tracker (Saved → Applied → Interview → Offer)
- ✓ Follow-up intelligence and browser notifications
- ✓ Command palette (⌘K) and keyboard shortcuts
- ✓ Export everything (JSON, CSV, PDF, DOCX)
- ✓ Pluggable AI providers: OpenAI, Anthropic, Ollama, OpenAI-compatible

## Privacy

**Your resume, jobs, and application history never leave your browser by default.**

- No account required
- IndexedDB storage — profile, jobs, and apps stored locally
- AI analysis only sends selected text to your configured provider
- Export or delete all data anytime from Settings
- Sources that block browser access fail gracefully — no CAPTCHA bypass

See [PRIVACY.md](./PRIVACY.md) for details.

## Quick Start

```bash
git clone https://github.com/shubhransh-gupta/HuntOS.git
cd HuntOS
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the marketing site, or [http://localhost:5173/app](http://localhost:5173/app) to launch the app.

## Usage

1. **Launch** the app and complete onboarding (resume → profile → hunt profile)
2. **Hunt** for jobs using sample data or live sources
3. **Review** top matches with explainable scoring
4. **Tailor** your resume for high-fit roles
5. **Track** applications on the Kanban board

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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run build:pages` | Build for GitHub Pages |
| `npm run test` | Run Vitest tests |
| `npm run typecheck` | TypeScript check |
| `npm run preview` | Preview production build |

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** — dark grid UI with glass panels
- **Dexie.js** — IndexedDB storage abstraction
- **Vitest** — matching, dedup, and source adapter tests
- **GitHub Pages** — automated deploy on `main` via Actions

## Project Structure

```text
src/
├── components/       # UI, layout, marketing, jobs
├── features/         # Hunt pipeline, settings
├── hooks/            # App state, keyboard shortcuts
├── pages/            # Marketing, dashboard, hunt, settings
├── services/
│   ├── ai/           # OpenAI, Anthropic, Ollama adapters
│   ├── matching/     # Scoring engine, dedup, freshness
│   ├── sources/      # Greenhouse, Lever, sample data, import
│   └── storage/      # Dexie / IndexedDB
└── types/
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for data flow, source adapters, and extension points.

## Contributing

`main` is protected — open a pull request instead of pushing directly.

```bash
git checkout -b feature/my-change
git commit -am "Describe your change"
git push -u origin feature/my-change
gh pr create
```

## License

MIT — see [LICENSE](./LICENSE).
