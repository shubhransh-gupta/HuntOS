# HuntOS Architecture

## Overview

HuntOS is a local-first React SPA. All user data lives in IndexedDB via Dexie.js.

## Layers

```
UI (pages, components)
    ↓
Features (hunt, matching, resume, applications)
    ↓
Services (storage, ai, parser, matching, sources, export)
    ↓
IndexedDB (Dexie)
```

## Key Abstractions

### StorageRepository
Swappable interface over Dexie. Tables: profile, masterResume, resumeVersions, huntProfiles, jobs, applications, huntRuns, settings, notes.

### AIProvider
Pluggable AI with OpenAI, Anthropic, Ollama, and OpenAI-compatible adapters. API keys stored locally only.

### JobSource
Modular job ingestion via adapters in `src/services/sources/`:

| Adapter | Method | Notes |
|---------|--------|-------|
| `sample-data` | Bundled JSON | Offline demo data |
| `greenhouse` | Public API | `boards-api.greenhouse.io` |
| `lever` | Public API | `api.lever.co/v0/postings` |
| `company-careers` | URL detection | Maps career pages to Greenhouse/Lever APIs |
| `public-pages` | URL fetch | Greenhouse/Lever/JSON URLs only |
| `manual-import` | User JSON | Queued in settings |
| `browser-import` | HTML snapshot | Paste from browser |

Sources that block browser requests fail gracefully with **Import from this source** guidance. No CAPTCHA bypass or stealth scraping.

### Matching Engine
Deterministic scoring across 7 factors (skills, experience, responsibilities, industry, location, seniority, salary). AI provides parsing and suggestions only — not the final score.

## Hunt Pipeline

1. Search configured JobSources
2. Normalize RawJob → Job
3. Deduplicate (title, company, URL, description similarity)
4. Score against profile + hunt profile
5. Persist jobs + hunt run stats

## Extension Points

- Add new JobSource in `src/services/sources/`
- Replace StorageRepository implementation
- Add AIProvider adapter in `src/services/ai/`

## Data Provenance

Every job tracks `discoveryMethod`: discovered | imported | fetched | user_added
