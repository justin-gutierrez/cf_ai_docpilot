import type { DocumentRow } from '../types'

export async function listDocuments(db: D1Database): Promise<DocumentRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, r2_key, mime_type, byte_size, status, error, chunk_count, created_at, updated_at
       FROM documents
       ORDER BY datetime(created_at) DESC`,
    )
    .all<DocumentRow>()

  return results ?? []
}

export async function getDocumentById(db: D1Database, id: string): Promise<DocumentRow | null> {
  const row = await db
    .prepare(
      `SELECT id, title, r2_key, mime_type, byte_size, status, error, chunk_count, created_at, updated_at
       FROM documents
       WHERE id = ?`,
    )
    .bind(id)
    .first<DocumentRow>()

  return row ?? null
}

export type NewDocumentInput = {
  id: string
  title: string | null
  r2Key: string
  mimeType: string
  byteSize: number
}

export async function insertPendingDocument(db: D1Database, input: NewDocumentInput): Promise<void> {
  await db
    .prepare(
      `INSERT INTO documents (id, title, r2_key, mime_type, byte_size, status, chunk_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', 0, datetime('now'), datetime('now'))`,
    )
    .bind(input.id, input.title, input.r2Key, input.mimeType, input.byteSize)
    .run()
}

export async function markDocumentProcessing(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `UPDATE documents
       SET status = 'processing', error = NULL, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(id)
    .run()
}

export async function markDocumentReady(db: D1Database, id: string, chunkCount: number): Promise<void> {
  await db
    .prepare(
      `UPDATE documents
       SET status = 'ready', error = NULL, chunk_count = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(chunkCount, id)
    .run()
}

export async function markDocumentFailed(db: D1Database, id: string, error: string): Promise<void> {
  await db
    .prepare(
      `UPDATE documents
       SET status = 'failed', error = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(error, id)
    .run()
}
