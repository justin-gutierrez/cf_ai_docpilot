/** Row from D1 `chunks` for vector indexing. */
export type ChunkRow = {
  id: string
  document_id: string
  ordinal: number
  text: string
  start_char: number | null
  end_char: number | null
}

export async function listChunksForDocument(
  db: D1Database,
  documentId: string,
): Promise<ChunkRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, document_id, ordinal, text, start_char, end_char
       FROM chunks
       WHERE document_id = ?
       ORDER BY ordinal ASC`,
    )
    .bind(documentId)
    .all<ChunkRow>()

  return results ?? []
}
