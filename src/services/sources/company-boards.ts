/**
 * Company boards hunted by default.
 *
 * The ATS adapters only ever searched boards the user had typed into Settings,
 * which meant a fresh install searched nothing at all. These are real, public,
 * browser-reachable boards that give a new user actual employers to match
 * against on their first hunt. Anything the user configures replaces this list
 * rather than adding to it, so their own choices stay in control.
 *
 * Every slug here was checked against its live API.
 */
export const DEFAULT_GREENHOUSE_BOARDS = [
  'stripe',
  'airbnb',
  'robinhood',
  'databricks',
  'figma',
  'discord',
  'gitlab',
  'coinbase',
  'reddit',
  'cloudflare',
  'pinterest',
  'duolingo',
]

export const DEFAULT_LEVER_COMPANIES = ['spotify', 'palantir']

export const DEFAULT_ASHBY_BOARDS = ['ramp', 'linear', 'notion', 'replit', 'cursor']
