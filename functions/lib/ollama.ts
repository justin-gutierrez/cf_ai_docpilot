/** Default models for local v1 (no paid APIs). */
export const OLLAMA_EMBED_MODEL = 'nomic-embed-text' as const
export const OLLAMA_CHAT_MODEL = 'qwen2.5:7b' as const

type EmbeddingsResponse = {
  embedding?: number[]
}

type ChatResponse = {
  message?: { content?: string }
}

function trimBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

/**
 * Single-text embedding via Ollama REST API.
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md
 */
export async function ollamaEmbed(
  baseUrl: string,
  model: string,
  text: string,
  fetcher: typeof fetch = fetch,
): Promise<number[]> {
  const url = `${trimBaseUrl(baseUrl)}/api/embeddings`
  const res = await fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text }),
  })
  const bodyText = await res.text()
  if (!res.ok) {
    throw new Error(`ollama embeddings HTTP ${res.status}: ${bodyText.slice(0, 300)}`)
  }
  let json: EmbeddingsResponse
  try {
    json = JSON.parse(bodyText) as EmbeddingsResponse
  } catch {
    throw new Error('ollama embeddings: invalid JSON response')
  }
  const emb = json.embedding
  if (!Array.isArray(emb) || emb.length === 0) {
    throw new Error('ollama embeddings: missing or empty embedding array')
  }
  return emb.map((v) => Number(v))
}

const DEFAULT_CONCURRENCY = 2

/**
 * Embed many strings with limited parallelism (local Ollama is often single-GPU).
 */
export async function ollamaEmbedMany(
  baseUrl: string,
  model: string,
  texts: string[],
  fetcher: typeof fetch = fetch,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<number[][]> {
  const out: number[][] = new Array(texts.length)
  let next = 0

  async function worker(): Promise<void> {
    for (;;) {
      const idx = next++
      if (idx >= texts.length) return
      out[idx] = await ollamaEmbed(baseUrl, model, texts[idx], fetcher)
    }
  }

  const n = Math.max(1, Math.min(concurrency, texts.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return out
}

export type OllamaChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * Non-streaming chat completion (for a future chat route).
 */
export async function ollamaChat(
  baseUrl: string,
  model: string,
  messages: OllamaChatMessage[],
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const url = `${trimBaseUrl(baseUrl)}/api/chat`
  const res = await fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  })
  const bodyText = await res.text()
  if (!res.ok) {
    throw new Error(`ollama chat HTTP ${res.status}: ${bodyText.slice(0, 300)}`)
  }
  let json: ChatResponse
  try {
    json = JSON.parse(bodyText) as ChatResponse
  } catch {
    throw new Error('ollama chat: invalid JSON response')
  }
  const content = json.message?.content
  if (typeof content !== 'string') {
    throw new Error('ollama chat: missing message.content')
  }
  return content
}
