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
