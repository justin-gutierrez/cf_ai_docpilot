import type { ChunkRow } from './chunk-rows'

export type VectorizeChunkMetadata = {
  documentId: string
  chunkId: string
  ordinal: number
  title: string | null
  startChar: number | null
  endChar: number | null
}

export type VectorCleanupInfo = {
  /** v1: no pre-delete; upsert replaces vectors with the same id. Stale higher ordinals after shrink re-ingest deferred. */
  status: 'skipped'
  detail: string
}

export const V1_CLEANUP_SKIPPED: VectorCleanupInfo = {
  status: 'skipped',
  detail:
    'Vectorize delete skipped in v1: upsert overwrites vectors with the same id; stale ordinals after a smaller re-ingest are not removed yet',
}

function toVectorMetadata(m: VectorizeChunkMetadata): Record<string, string | number | boolean> {
  return {
    documentId: m.documentId,
    chunkId: m.chunkId,
    ordinal: m.ordinal,
    title: m.title ?? '',
    startChar: m.startChar ?? -1,
    endChar: m.endChar ?? -1,
  }
}

const UPSERT_BATCH = 100

export type VectorUpsertRow = {
  id: string
  values: number[]
  metadata: Record<string, string | number | boolean>
}

/** Build one upsert batch; throws if a vector is missing or non-finite. */
export function buildUpsertBatch(
  slice: ChunkRow[],
  vecSlice: number[][],
  documentId: string,
  title: string | null,
): VectorUpsertRow[] {
  if (slice.length !== vecSlice.length) {
    throw new Error(`upsert batch slice mismatch: ${slice.length} chunks vs ${vecSlice.length} vectors`)
  }
  return slice.map((row, j) => {
    const values = vecSlice[j]
    if (!values?.length) {
      throw new Error(`missing vector for chunk ${row.id}`)
    }
    for (let k = 0; k < values.length; k++) {
      if (!Number.isFinite(values[k])) {
        throw new Error(`non-finite value in vector for chunk ${row.id} at ${k}`)
      }
    }
    return {
      id: row.id,
      values,
      metadata: toVectorMetadata({
        documentId,
        chunkId: row.id,
        ordinal: row.ordinal,
        title,
        startChar: row.start_char,
        endChar: row.end_char,
      }),
    }
  })
}

/**
 * Upsert pre-validated embeddings. Vector ids match D1 chunk ids.
 */
export async function upsertChunkVectors(params: {
  index: VectorizeIndex
  documentId: string
  title: string | null
  chunks: ChunkRow[]
  vectors: number[][]
}): Promise<void> {
  const { index, documentId, title, chunks, vectors } = params
  if (chunks.length !== vectors.length) {
    throw new Error(`chunks vs vectors length mismatch: ${chunks.length} vs ${vectors.length}`)
  }
  if (chunks.length === 0) return

  for (let i = 0; i < chunks.length; i += UPSERT_BATCH) {
    const slice = chunks.slice(i, i + UPSERT_BATCH)
    const vecSlice = vectors.slice(i, i + UPSERT_BATCH)
    const batch = buildUpsertBatch(slice, vecSlice, documentId, title)
    await index.upsert(batch)
  }
}
