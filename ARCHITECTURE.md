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
Modular job ingestion. Phase 5 adapters are stubbed; sample-data and manual-import are active.

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
