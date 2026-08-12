/**
 * PDF text comes back as loose positioned fragments with no line structure.
 * Resume parsing is line-based — a name, a title, a section heading — so the
 * fragments have to be grouped back into visual lines before anything can be
 * read out of them.
 */
export interface PositionedTextItem {
  str: string
  /** Horizontal offset of the fragment's left edge. */
  x: number
  /** Vertical offset of the baseline. Larger values sit higher on the page. */
  y: number
  width: number
  height: number
}

/** Fragments whose baselines differ by less than this belong to one line. */
function lineTolerance(height: number): number {
  return Math.max(2, height * 0.5)
}

/** A horizontal gap wider than this implies a space the PDF didn't encode. */
function impliesSpace(gap: number, height: number): boolean {
  return gap > Math.max(1, height * 0.2)
}

function joinRow(row: PositionedTextItem[]): string {
  const ordered = [...row].sort((a, b) => a.x - b.x)

  let text = ''
  let previousEnd: number | null = null

  for (const item of ordered) {
    if (
      previousEnd !== null &&
      !text.endsWith(' ') &&
      !item.str.startsWith(' ') &&
      impliesSpace(item.x - previousEnd, item.height)
    ) {
      text += ' '
    }
    text += item.str
    previousEnd = item.x + item.width
  }

  return text.replace(/\s+/g, ' ').trim()
}

export function groupItemsIntoLines(items: PositionedTextItem[]): string[] {
  const usable = items.filter((item) => item.str.trim().length > 0)
  if (usable.length === 0) return []

  // Top of the page downwards, then left to right within each line.
  const ordered = [...usable].sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: string[] = []
  let row: PositionedTextItem[] = []
  let rowY = ordered[0].y

  for (const item of ordered) {
    if (row.length > 0 && Math.abs(item.y - rowY) > lineTolerance(item.height)) {
      lines.push(joinRow(row))
      row = []
      rowY = item.y
    }
    row.push(item)
  }
  if (row.length > 0) lines.push(joinRow(row))

  return lines.filter(Boolean)
}
