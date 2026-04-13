/** Default window size (characters). */
export const CHUNK_CHAR_SIZE = 900

/** Overlap between consecutive chunks (characters). */
export const CHUNK_OVERLAP_CHARS = 120

export type TextChunk = {
  ordinal: number
  text: string
  startChar: number
  endChar: number
}

/**
 * Fixed-size overlapping windows over the string. Deterministic for a given input.
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_CHAR_SIZE,
  overlap: number = CHUNK_OVERLAP_CHARS,
): TextChunk[] {
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error('invalid chunk parameters')
  }

  const normalized = text.replace(/^\uFEFF/, '')
  if (normalized.length === 0) {
    return []
  }

  const stride = chunkSize - overlap
  const out: TextChunk[] = []
  let ordinal = 0

  for (let start = 0; start < normalized.length; start += stride) {
    const end = Math.min(start + chunkSize, normalized.length)
    const slice = normalized.slice(start, end)
    out.push({ ordinal, text: slice, startChar: start, endChar: end })
    ordinal += 1
    if (end >= normalized.length) break
  }

  return out
}
