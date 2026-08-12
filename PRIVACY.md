# HuntOS Privacy Policy

## Local-First

HuntOS stores all data locally in your browser using **IndexedDB** (database name: `HuntOS`):

- Resume files and extracted text
- Profile and master resume
- Job listings and match analysis
- Application history
- Hunt profiles, settings, and API keys

HuntOS does **not** require an account. There is **no HuntOS server** and no server-side storage of your data.

## Who Can Access Your Data

Your data is scoped to **this browser on this device** for the HuntOS website origin (for example `localhost:5173` or `shubhransh-gupta.github.io/HuntOS`).

- Other websites cannot read your HuntOS data
- Other browser profiles or incognito windows have separate storage
- Anyone using the **same browser profile** on the same computer could access the same local data (same as any local app data)

## Resume Upload

When you upload a resume during onboarding:

1. The file is read **only in your browser** (PDF/DOCX/TXT parsing runs locally)
2. Extracted text and profile fields are saved to **IndexedDB**
3. **Nothing is uploaded to HuntOS servers**

By default, profile fields are filled using **local parsing only**. AI parsing is optional and only runs if you explicitly opt in during onboarding and have configured an AI provider.

## AI Provider Data

When you configure an AI provider and use AI features (optional AI parsing, tailored resumes, resume suggestions, follow-up drafts), selected text may be sent to:

- OpenAI, Anthropic, or your OpenAI-compatible endpoint (when you provide an API key)
- Ollama on your machine (local inference at `localhost:11434`)

API keys are stored locally in IndexedDB and are **redacted from JSON exports**.

## Notifications

Browser notifications are local only. No email infrastructure.

## Your Controls

- **Export all data** — download a JSON backup (API key redacted)
- **Delete all local data** — wipe IndexedDB and reset the app

## No Scraping

HuntOS does not bypass CAPTCHA, authentication, or anti-bot protections. Job sources use sample data, manual import, and permitted methods only.
