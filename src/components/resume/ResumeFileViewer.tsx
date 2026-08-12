import { useEffect, useRef, useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import type { StoredResumeFile } from '@/types'
import { Button } from '@/components/ui/button'

function isPdf(file: StoredResumeFile): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function downloadOriginal(file: StoredResumeFile): void {
  const url = URL.createObjectURL(new Blob([file.data], { type: file.type }))
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PdfPages({ file }: { file: StoredResumeFile }) {
  const container = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const host = container.current
    if (!host) return

    async function render() {
      try {
        const { pdfjsLib } = await import('@/services/parser/pdf-worker')
        // pdfjs takes ownership of the buffer it is given, so hand it a copy
        // and keep the stored bytes intact for re-renders and downloads.
        const pdf = await pdfjsLib.getDocument({ data: file.data.slice(0) }).promise
        if (cancelled || !host) return

        host.replaceChildren()

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber)
          if (cancelled) return

          const width = host.clientWidth || 800
          const unscaled = page.getViewport({ scale: 1 })
          // Render above CSS size so the page stays sharp on high-density screens.
          const scale = (width / unscaled.width) * Math.min(window.devicePixelRatio || 1, 2)
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.className = 'rounded-lg border border-[var(--color-border)] bg-white shadow-sm'

          const context = canvas.getContext('2d')
          if (!context) continue

          host.appendChild(canvas)
          await page.render({ canvas, canvasContext: context, viewport }).promise
        }

        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [file])

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Rendering your resume...
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-[var(--color-danger)]">
          This PDF could not be displayed. You can still download the original below.
        </p>
      )}
      <div ref={container} className="space-y-4" />
    </div>
  )
}

export function ResumeFileViewer({ file }: { file: StoredResumeFile }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <FileText className="h-4 w-4" />
          {file.name} · {formatSize(file.size)}
        </p>
        <Button variant="outline" size="sm" onClick={() => downloadOriginal(file)}>
          <Download className="mr-2 h-4 w-4" />
          Download original
        </Button>
      </div>

      {isPdf(file) ? (
        <PdfPages file={file} />
      ) : (
        <p className="rounded-lg border border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">
          {file.name.split('.').pop()?.toUpperCase()} files cannot be displayed in the browser.
          Download the original above, or read the extracted text.
        </p>
      )}
    </div>
  )
}
