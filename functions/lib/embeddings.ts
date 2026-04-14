import { ollamaEmbedMany } from './ollama'

/**
 * Embed many chunk texts via local Ollama (caller supplies base URL and model name).
 */
export async function embedTextsWithOllama(
  baseUrl: string,
  model: string,
  texts: string[],
  fetcher: typeof fetch = fetch,
): Promise<number[][]> {
  if (texts.length === 0) return []
  return ollamaEmbedMany(baseUrl, model, texts, fetcher)
}

export function validateEmbeddingSameDimensions(
  vectors: number[][],
): { ok: true; dim: number } | { ok: false; index: number; actualDim: number; expectedDim: number } {
  if (vectors.length === 0) {
    return { ok: true, dim: 0 }
  }
  const expectedDim = vectors[0].length
  if (expectedDim === 0) {
    return { ok: false, index: 0, actualDim: 0, expectedDim: 0 }
  }
  for (let i = 1; i < vectors.length; i++) {
    const len = vectors[i]?.length ?? 0
    if (len !== expectedDim) {
      return { ok: false, index: i, actualDim: len, expectedDim }
    }
  }
  return { ok: true, dim: expectedDim }
}
