export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5' as const

/** Expected vector width for @cf/baai/bge-base-en-v1.5 (must match Vectorize index). */
export const BGE_BASE_EN_DIMS = 768

const EMBED_BATCH = 32

function isNumberArray(x: unknown): x is number[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'number' && Number.isFinite(v))
}

/**
 * Normalize Workers AI embedding responses (shape varies slightly by runtime/version).
 */
export function extractEmbeddingsFromAiResponse(raw: unknown, expectedBatch: number): number[][] {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('embedding response is not an object')
  }

  const obj = raw as Record<string, unknown>
  let data = obj.data

  if (data === undefined && Array.isArray(obj)) {
    data = obj
  }

  if (data === undefined) {
    throw new Error('embedding response missing data')
  }

  // Single flat vector for batch size 1
  if (expectedBatch === 1 && isNumberArray(data)) {
    return [data]
  }

  if (!Array.isArray(data)) {
    throw new Error('embedding data is not an array')
  }

  const rows: number[][] = []
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (isNumberArray(row)) {
      rows.push(row)
      continue
    }
    // Typed arrays
    if (ArrayBuffer.isView(row) && !(row instanceof DataView)) {
      rows.push(Array.from(row as unknown as ArrayLike<number>))
      continue
    }
    throw new Error(`embedding row ${i} is not a numeric array`)
  }

  if (rows.length !== expectedBatch) {
    throw new Error(`embedding count mismatch: expected ${expectedBatch}, got ${rows.length}`)
  }

  return rows
}

/**
 * Embed many texts in fixed-size batches (Workers AI limits payload size).
 */
export async function embedTextsBatched(ai: Ai, texts: string[]): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const slice = texts.slice(i, i + EMBED_BATCH)
    const raw = await ai.run(EMBEDDING_MODEL, {
      text: slice,
    })
    const batch = extractEmbeddingsFromAiResponse(raw, slice.length)
    for (const vec of batch) {
      out.push(vec)
    }
  }
  return out
}

export function validateEmbeddingDimensions(
  vectors: number[][],
  expectedDim: number,
): { ok: true } | { ok: false; index: number; actualDim: number } {
  for (let i = 0; i < vectors.length; i++) {
    const len = vectors[i]?.length ?? 0
    if (len !== expectedDim) {
      return { ok: false, index: i, actualDim: len }
    }
  }
  return { ok: true }
}
