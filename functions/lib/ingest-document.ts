import { chunkText } from './chunk-text'
import { replaceDocumentChunks } from './chunks'
import {
  getDocumentById,
  markDocumentFailed,
  markDocumentProcessing,
  markDocumentReady,
} from './documents'
import { getRawObjectBytes } from './r2-storage'
import {
  extractPlainText,
  isPdfDocument,
  PdfIngestNotSupportedError,
  UnsupportedTextFormatError,
} from './text-extract'

export type IngestSuccess = {
  ok: true
  documentId: string
  chunkCount: number
}

export type IngestFailure = {
  ok: false
  httpStatus: number
  error: string
  detail?: string
  documentUpdated: boolean
}

type IngestEnv = {
  DB: D1Database
  DOCS_BUCKET: R2Bucket
}

/**
 * Loads R2 bytes, extracts text, chunks, replaces chunk rows, updates document status.
 * PDFs return 400 without mutating the document row.
 */
export async function ingestDocumentById(env: IngestEnv, documentId: string): Promise<IngestSuccess | IngestFailure> {
  const doc = await getDocumentById(env.DB, documentId)
  if (!doc) {
    return { ok: false, httpStatus: 404, error: 'document not found', documentUpdated: false }
  }

  if (isPdfDocument(doc)) {
    return {
      ok: false,
      httpStatus: 400,
      error: 'pdf_ingest_not_supported',
      detail: new PdfIngestNotSupportedError().message,
      documentUpdated: false,
    }
  }

  const bytes = await getRawObjectBytes(env.DOCS_BUCKET, doc.r2_key)
  if (!bytes) {
    await markDocumentFailed(env.DB, documentId, 'file not found in object storage')
    return {
      ok: false,
      httpStatus: 502,
      error: 'storage_miss',
      detail: 'object missing in R2 for r2_key',
      documentUpdated: true,
    }
  }

  let text: string
  try {
    text = extractPlainText(bytes, doc)
  } catch (err) {
    if (err instanceof PdfIngestNotSupportedError) {
      return {
        ok: false,
        httpStatus: 400,
        error: err.code,
        detail: err.message,
        documentUpdated: false,
      }
    }
    if (err instanceof UnsupportedTextFormatError) {
      await markDocumentFailed(env.DB, documentId, err.message)
      return {
        ok: false,
        httpStatus: 415,
        error: err.code,
        detail: err.message,
        documentUpdated: true,
      }
    }
    const message = err instanceof Error ? err.message : 'text extraction failed'
    await markDocumentFailed(env.DB, documentId, message)
    return {
      ok: false,
      httpStatus: 500,
      error: 'ingest_failed',
      detail: message,
      documentUpdated: true,
    }
  }

  await markDocumentProcessing(env.DB, documentId)

  const chunks = chunkText(text)

  try {
    await replaceDocumentChunks(env.DB, documentId, chunks)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to store chunks'
    await markDocumentFailed(env.DB, documentId, message)
    return {
      ok: false,
      httpStatus: 500,
      error: 'chunk_persist_failed',
      detail: message,
      documentUpdated: true,
    }
  }

  await markDocumentReady(env.DB, documentId, chunks.length)

  return { ok: true, documentId, chunkCount: chunks.length }
}
