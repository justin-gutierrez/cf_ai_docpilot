import type { TextChunk } from './chunk-text'

const D1_BATCH_SIZE = 80

/** Stable D1 chunk id: same document + ordinal always matches. */
export function chunkRowId(documentId: string, ordinal: number): string {
  return `${documentId}:c:${ordinal.toString().padStart(8, '0')}`
}

/**
 * Removes existing chunks for the document, then inserts the new set (batched).
 */
export async function replaceDocumentChunks(
  db: D1Database,
  documentId: string,
  chunks: TextChunk[],
): Promise<void> {
  await db.prepare(`DELETE FROM chunks WHERE document_id = ?`).bind(documentId).run()

  for (let i = 0; i < chunks.length; i += D1_BATCH_SIZE) {
    const slice = chunks.slice(i, i + D1_BATCH_SIZE)
    const batch = slice.map((c) =>
      db
        .prepare(
          `INSERT INTO chunks (id, document_id, ordinal, text, start_char, end_char, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(chunkRowId(documentId, c.ordinal), documentId, c.ordinal, c.text, c.startChar, c.endChar),
    )
    await db.batch(batch)
  }
}
