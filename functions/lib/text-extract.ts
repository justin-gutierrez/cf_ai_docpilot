import type { DocumentRow } from '../types'

/**
 * TODO (next phase): PDF text extraction (e.g. WASM/pdf.js or external pipeline).
 * This phase returns a structured error only.
 */
export class PdfIngestNotSupportedError extends Error {
  readonly code = 'pdf_ingest_not_supported' as const
  constructor() {
    super('PDF ingestion is not implemented yet; use .txt or .md for now')
    this.name = 'PdfIngestNotSupportedError'
  }
}

export class UnsupportedTextFormatError extends Error {
  readonly code = 'unsupported_text_format' as const
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedTextFormatError'
  }
}

function r2KeyLower(doc: DocumentRow): string {
  return doc.r2_key.toLowerCase()
}

export function isPdfDocument(doc: DocumentRow): boolean {
  const mime = doc.mime_type?.toLowerCase() ?? ''
  if (mime.includes('pdf')) return true
  return r2KeyLower(doc).endsWith('.pdf')
}

export function isTextBasedDocument(doc: DocumentRow): boolean {
  const mime = doc.mime_type?.toLowerCase().split(';')[0]?.trim() ?? ''
  if (mime === 'text/plain' || mime === 'text/markdown') return true
  const key = r2KeyLower(doc)
  return key.endsWith('.txt') || key.endsWith('.md') || key.endsWith('.markdown')
}

/**
 * Decode UTF-8 bytes for supported plain-text documents. PDF throws PdfIngestNotSupportedError.
 */
export function extractPlainText(bytes: ArrayBuffer, doc: DocumentRow): string {
  if (isPdfDocument(doc)) {
    throw new PdfIngestNotSupportedError()
  }
  if (!isTextBasedDocument(doc)) {
    throw new UnsupportedTextFormatError(
      'only .txt, .md, and .markdown are supported in this ingestion phase',
    )
  }
  return new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(bytes)
}
