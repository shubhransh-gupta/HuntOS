import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

import { groupItemsIntoLines, type PositionedTextItem } from './pdf-text-layout'

export { parseProfileLocally } from './local-profile-parser'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'pdf':
      return extractFromPdf(file)
    case 'docx':
      return extractFromDocx(file)
    case 'txt':
    case 'md':
      return file.text()
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

async function extractFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    const positioned: PositionedTextItem[] = content.items.flatMap((item) =>
      'str' in item
        ? [{
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width ?? 0,
            height: item.height ?? 0,
          }]
        : [],
    )

    pages.push(groupItemsIntoLines(positioned).join('\n'))
  }

  return pages.join('\n')
}

async function extractFromDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

export function buildResumeSections(rawText: string): Record<string, string> {
  const sections: Record<string, string> = { full: rawText }
  const headers = ['experience', 'education', 'skills', 'projects', 'certifications', 'summary']
  const lines = rawText.split('\n')
  let current = 'summary'
  let buffer: string[] = []

  for (const line of lines) {
    const lower = line.toLowerCase().trim()
    const header = headers.find((h) => lower.startsWith(h))
    if (header) {
      if (buffer.length) sections[current] = buffer.join('\n').trim()
      current = header
      buffer = []
    } else {
      buffer.push(line)
    }
  }
  if (buffer.length) sections[current] = buffer.join('\n').trim()
  return sections
}
