/**
 * Persist embedding vector on a chunk row (JSON in D1).
 */
export async function updateChunkEmbeddingJson(
  db: D1Database,
  chunkId: string,
  embedding: number[],
  model: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE chunks
       SET embedding_json = ?, embedding_model = ?, embedded_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(JSON.stringify(embedding), model, chunkId)
    .run()
}
