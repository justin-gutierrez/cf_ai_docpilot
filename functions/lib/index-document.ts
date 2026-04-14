import {
  BGE_BASE_EN_DIMS,
  embedTextsBatched,
  validateEmbeddingDimensions,
} from './embeddings'
import { getDocumentById } from './documents'
import { listChunksForDocument } from './chunk-rows'
import { upsertChunkVectors, V1_CLEANUP_SKIPPED, type VectorCleanupInfo } from './vector-index'

export type IndexVectorsEnv = {
  DB: D1Database
  AI: Ai
  VECTOR_INDEX: VectorizeIndex
}

export type IndexFailureStage =
  | 'load_document_failed'
  | 'document_not_ready'
  | 'load_chunks_failed'
  | 'embeddings_failed'
  | 'invalid_embedding_shape'
  | 'vector_upsert_failed'

export type IndexVectorsOptions = {
  /** When set, only the first N chunks are embedded and upserted (debug). */
  chunkLimit?: number
}

export type IndexVectorsResult =
  | {
      ok: true
      documentId: string
      indexed: number
      vectorCleanup: VectorCleanupInfo
      /** Present when `?limit=` was used on the request. */
      limitedTo?: number
    }
  | {
      ok: false
      httpStatus: number
      error: string
      detail?: string
      stage: IndexFailureStage
    }

function logIndex(fields: Record<string, unknown>): void {
  console.log(`[cf_ai_docpilot:index] ${JSON.stringify(fields)}`)
}

export async function indexDocumentVectors(
  env: IndexVectorsEnv,
  documentId: string,
  options: IndexVectorsOptions = {},
): Promise<IndexVectorsResult> {
  const { chunkLimit } = options

  logIndex({
    event: 'start',
    documentId,
    chunkLimit: chunkLimit ?? null,
  })

  const doc = await getDocumentById(env.DB, documentId)
  if (!doc) {
    logIndex({ event: 'load_document_failed', documentId, reason: 'not_found' })
    return {
      ok: false,
      httpStatus: 404,
      error: 'document not found',
      stage: 'load_document_failed',
    }
  }

  if (doc.status !== 'ready') {
    logIndex({
      event: 'document_not_ready',
      documentId,
      status: doc.status,
    })
    return {
      ok: false,
      httpStatus: 400,
      error: 'document not ready',
      detail: `status is "${doc.status}"; run ingest first`,
      stage: 'document_not_ready',
    }
  }

  let chunks
  try {
    chunks = await listChunksForDocument(env.DB, documentId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'd1 query failed'
    logIndex({
      event: 'load_chunks_failed',
      documentId,
      detail: message,
    })
    return {
      ok: false,
      httpStatus: 500,
      error: 'load_chunks_failed',
      detail: message,
      stage: 'load_chunks_failed',
    }
  }

  if (chunks.length === 0 && doc.chunk_count > 0) {
    logIndex({
      event: 'load_chunks_failed',
      documentId,
      reason: 'chunk_count_mismatch',
      chunk_count: doc.chunk_count,
    })
    return {
      ok: false,
      httpStatus: 500,
      error: 'chunk mismatch',
      detail: 'document.chunk_count > 0 but no chunk rows found',
      stage: 'load_chunks_failed',
    }
  }

  const chunksToIndex = chunkLimit !== undefined ? chunks.slice(0, chunkLimit) : chunks

  const first = chunksToIndex[0]
  logIndex({
    event: 'chunks_ready',
    documentId,
    totalChunksInDb: chunks.length,
    chunkCountAttempted: chunksToIndex.length,
    firstChunkId: first?.id ?? null,
    firstChunkTextLength: first ? first.text.length : null,
  })

  if (chunksToIndex.length === 0) {
    logIndex({ event: 'no_chunks_to_index', documentId })
    return {
      ok: true,
      documentId,
      indexed: 0,
      vectorCleanup: V1_CLEANUP_SKIPPED,
      ...(chunkLimit !== undefined ? { limitedTo: chunkLimit } : {}),
    }
  }

  let vectors: number[][]
  try {
    const texts = chunksToIndex.map((c) => c.text)
    vectors = await embedTextsBatched(env.AI, texts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'embedding request failed'
    logIndex({
      event: 'embeddings_failed',
      documentId,
      chunkCountAttempted: chunksToIndex.length,
      detail: message,
    })
    return {
      ok: false,
      httpStatus: 500,
      error: 'embeddings_failed',
      detail: message,
      stage: 'embeddings_failed',
    }
  }

  logIndex({
    event: 'embeddings_ok',
    documentId,
    embeddingCountReturned: vectors.length,
    firstVectorDim: vectors[0]?.length ?? null,
  })

  const dimCheck = validateEmbeddingDimensions(vectors, BGE_BASE_EN_DIMS)
  if (!dimCheck.ok) {
    logIndex({
      event: 'invalid_embedding_shape',
      documentId,
      index: dimCheck.index,
      actualDim: dimCheck.actualDim,
      expectedDim: BGE_BASE_EN_DIMS,
    })
    return {
      ok: false,
      httpStatus: 500,
      error: 'invalid_embedding_shape',
      detail: `vector[${dimCheck.index}] length ${dimCheck.actualDim}, expected ${BGE_BASE_EN_DIMS}`,
      stage: 'invalid_embedding_shape',
    }
  }

  try {
    await upsertChunkVectors({
      index: env.VECTOR_INDEX,
      documentId,
      title: doc.title,
      chunks: chunksToIndex,
      vectors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'vectorize upsert failed'
    logIndex({
      event: 'vector_upsert_failed',
      documentId,
      chunkCountAttempted: chunksToIndex.length,
      detail: message,
    })
    return {
      ok: false,
      httpStatus: 500,
      error: 'vector_upsert_failed',
      detail: message,
      stage: 'vector_upsert_failed',
    }
  }

  logIndex({
    event: 'complete',
    documentId,
    indexed: chunksToIndex.length,
    limited: chunkLimit !== undefined,
  })

  return {
    ok: true,
    documentId,
    indexed: chunksToIndex.length,
    vectorCleanup: V1_CLEANUP_SKIPPED,
    ...(chunkLimit !== undefined ? { limitedTo: chunkLimit } : {}),
  }
}
