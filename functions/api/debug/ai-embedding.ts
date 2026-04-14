import { OLLAMA_EMBED_MODEL, ollamaEmbed } from '../../lib/ollama'

const SAMPLE = 'hello world'

/**
 * GET /api/debug/ai-embedding — smoke test local Ollama embeddings (no Workers AI).
 */
export const onRequestPost: PagesFunction<Env> = async () => {
  return Response.json(
    { ok: false, error: 'method not allowed', detail: 'use GET', stage: 'bad_request' },
    { status: 405 },
  )
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const modelParam = url.searchParams.get('model')?.trim()
  const model =
    modelParam && modelParam.length > 0 ? modelParam : (context.env.OLLAMA_EMBED_MODEL ?? OLLAMA_EMBED_MODEL)
  const baseUrl = context.env.OLLAMA_BASE_URL

  try {
    const vec = await ollamaEmbed(baseUrl, model, SAMPLE)
    return Response.json({
      ok: true,
      model,
      ollamaBaseUrl: baseUrl,
      embeddingCount: 1,
      firstEmbeddingDims: vec.length,
      shapeSummary: { length: vec.length },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(
      `[cf_ai_docpilot:ollama-smoke] ${JSON.stringify({ ok: false, model, detail: message })}`,
    )
    return Response.json(
      {
        ok: false,
        stage: 'ai_smoke_test_failed',
        model,
        ollamaBaseUrl: baseUrl,
        error: err instanceof Error ? err.name : 'Error',
        detail: message,
      },
      { status: 500 },
    )
  }
}
