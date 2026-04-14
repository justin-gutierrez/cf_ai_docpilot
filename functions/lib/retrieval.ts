import type { ChunkRow } from './chunk-rows'
import { ollamaEmbed } from './ollama'

export type ChunkRowWithEmbedding = ChunkRow & {
  embedding_json: string | null
}

export type RetrievedChunk = {
  id: string
  document_id: string
  ordinal: number
  text: string
  score: number
}

function parseEmbeddingJson(raw: string | null): number[] | null {
  if (raw === null || raw === '') return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const nums = parsed.map((v) => Number(v))
    if (nums.some((n) => !Number.isFinite(n))) return null
    return nums
  } catch {
    return null
  }
}

/** Cosine similarity in [ -1, 1 ] (typically positive for normalized embeddings). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Load chunks that have stored embeddings, score by cosine similarity to the query embedding, return top-K.
 */
export async function retrieveTopKChunks(
  db: D1Database,
  queryEmbedding: number[],
  topK: number,
  options: { documentId?: string } = {},
): Promise<RetrievedChunk[]> {
  const { documentId } = options
  const sql = documentId
    ? `SELECT id, document_id, ordinal, text, start_char, end_char, embedding_json
       FROM chunks
       WHERE embedding_json IS NOT NULL AND embedding_json != '' AND document_id = ?`
    : `SELECT id, document_id, ordinal, text, start_char, end_char, embedding_json
       FROM chunks
       WHERE embedding_json IS NOT NULL AND embedding_json != ''`

  const stmt = documentId
    ? db.prepare(sql).bind(documentId)
    : db.prepare(sql)

  const { results } = await stmt.all<ChunkRowWithEmbedding>()
  const rows = results ?? []

  const scored: RetrievedChunk[] = []
  for (const row of rows) {
    const vec = parseEmbeddingJson(row.embedding_json)
    if (!vec) continue
    const score = cosineSimilarity(queryEmbedding, vec)
    scored.push({
      id: row.id,
      document_id: row.document_id,
      ordinal: row.ordinal,
      text: row.text,
      score,
    })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, Math.max(0, topK))
}

/**
 * Embed the user query with Ollama, then rank stored chunk embeddings (D1) by cosine similarity.
 */
export async function retrieveWithOllamaQuery(
  db: D1Database,
  ollamaBaseUrl: string,
  embedModel: string,
  query: string,
  topK: number,
  options: { documentId?: string } = {},
  fetcher: typeof fetch = fetch,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await ollamaEmbed(ollamaBaseUrl, embedModel, query, fetcher)
  return retrieveTopKChunks(db, queryEmbedding, topK, options)
}
