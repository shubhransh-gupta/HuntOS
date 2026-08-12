import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export function exportResumePdf(content: string, filename: string) {
  const doc = new jsPDF()
  const lines = doc.splitTextToSize(content, 180)
  doc.text(lines, 10, 10)
  doc.save(filename)
}

export async function exportResumeDocx(content: string, filename: string) {
  const paragraphs = content.split('\n').map(
    (line) => new Paragraph({ children: [new TextRun(line)] }),
  )
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
