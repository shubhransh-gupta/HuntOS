/**
 * Turning job posting markup into readable text.
 *
 * Boards differ in how they hand over descriptions. Greenhouse escapes its
 * markup, so a description arrives as `&lt;p&gt;...&lt;/p&gt;` and a plain
 * tag-stripping pass finds no tags to strip, leaving the escaped markup and
 * its CSS class names sitting in the text. Others send ordinary HTML.
 *
 * Line structure matters as much as the characters: requirements are read back
 * out line by line, so paragraphs and list items have to survive as newlines.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  trade: '™', reg: '®', copy: '©', deg: '°', euro: '€', pound: '£',
}

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (match, body: string) => {
    if (body.startsWith('#')) {
      const code = body[1] === 'x' || body[1] === 'X'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

/** Markup that arrived escaped, e.g. `&lt;div` or `&lt;/p`. */
const ESCAPED_MARKUP = /&lt;\/?[a-z][a-z0-9]*/i

export function htmlToText(input: string): string {
  if (!input) return ''

  // Only unescape ahead of tag removal when the tags themselves are escaped,
  // so a genuine `&lt;` in prose ("latency &lt; 100ms") is not mistaken for
  // the start of a tag.
  let text = ESCAPED_MARKUP.test(input) ? decodeHtmlEntities(input) : input

  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    // The opening <li> already began the line; closing it must not add another.
    .replace(/<\/li\s*>/gi, '')
    .replace(/<\/(p|div|section|article|header|footer|tr|blockquote|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return decodeHtmlEntities(text)
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[•\s]+$/gm, '')
    .trim()
}

/** Same conversion, flattened — for fields that must stay on one line. */
export function htmlToLine(input: string): string {
  return htmlToText(input).replace(/\s+/g, ' ').trim()
}

/**
 * Whether a string reads like a tag rather than a sentence. Requirement
 * bullets and skill names share a field, so the long ones are filtered out
 * before anything is rendered as a chip.
 */
export function isTagLike(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0 || trimmed.length > 28) return false
  if (/[\n<>{}]/.test(trimmed)) return false
  if (/[.;:]$/.test(trimmed)) return false
  return trimmed.split(/\s+/).length <= 4
}
