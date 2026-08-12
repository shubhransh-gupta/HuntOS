import * as pdfjsLib from 'pdfjs-dist'

// pdfjs needs its worker resolved through the bundler. Configured here so the
// parser and the on-screen viewer share one setup.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export { pdfjsLib }
