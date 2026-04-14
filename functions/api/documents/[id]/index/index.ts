import { indexDocumentVectors } from '../../../../lib/index-document'

function parseChunkLimit(raw: string | null): { limit?: number; invalid?: true } {
  if (raw === null || raw === '') {
    return {}
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) {
    return { invalid: true }
  }
  return { limit: n }
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json(
    { ok: false, error: 'method not allowed', detail: 'use POST', stage: 'bad_request' },
    { status: 405 },
  )
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const rawId = context.params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  if (!id) {
    return Response.json(
      { ok: false, error: 'missing document id', stage: 'bad_request' },
      { status: 400 },
    )
  }

  const url = new URL(context.request.url)
  const { limit, invalid } = parseChunkLimit(url.searchParams.get('limit'))
  if (invalid) {
    return Response.json(
      {
        ok: false,
        error: 'invalid_limit',
        detail: 'limit must be a positive integer',
        stage: 'bad_request',
      },
      { status: 400 },
    )
  }

  const env = context.env as Env
  const indexEnv = {
    DB: env.DB,
    OLLAMA_BASE_URL: env.OLLAMA_BASE_URL,
    OLLAMA_EMBED_MODEL: env.OLLAMA_EMBED_MODEL,
  }

  try {
    const result = await indexDocumentVectors(indexEnv, id, { chunkLimit: limit })
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: result.error,
          detail: result.detail,
          stage: result.stage,
        },
        { status: result.httpStatus },
      )
    }
    return Response.json({
      ok: true,
      documentId: result.documentId,
      indexed: result.indexed,
      embeddingModel: result.embeddingModel,
      embeddingDim: result.embeddingDim,
      backend: 'ollama+d1',
      ...(result.limitedTo !== undefined ? { limitedTo: result.limitedTo } : {}),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.log(
      `[cf_ai_docpilot:index] ${JSON.stringify({ event: 'unhandled', documentId: id, detail: message })}`,
    )
    return Response.json(
      {
        ok: false,
        error: 'index_failed',
        detail: message,
        stage: 'unhandled',
      },
      { status: 500 },
    )
  }
}
