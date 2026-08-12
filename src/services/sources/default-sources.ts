/**
 * Sources a new hunt starts with. The live feeds need no configuration, so a
 * first hunt returns real postings; the ATS adapters sit ready for whichever
 * company boards the user adds in Settings.
 *
 * Kept apart from the registry so storage can read it without pulling every
 * adapter into the main bundle.
 */
export const DEFAULT_HUNT_SOURCES = [
  'remotive',
  'arbeitnow',
  'jobicy',
  'remoteok',
  'greenhouse',
  'lever',
  'ashby',
  'company-careers',
  'public-pages',
  'manual-import',
  'browser-import',
]
