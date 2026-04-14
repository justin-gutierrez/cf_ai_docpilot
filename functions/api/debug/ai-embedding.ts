import { extractEmbeddingsFromAiResponse } from '../../lib/embeddings'

const MODEL_BASE = '@cf/baai/bge-base-en-v1.5' as const
const MODEL_SMALL = '@cf/baai/bge-small-en-v1.5' as const

const SAMPLE = ['hello world'] as const

function resolveModel(modelParam: string | null): string {
  return modelParam === 'small' ? MODEL_SMALL : MODEL_BASE
}

/** Compact summary of raw Workers AI embedding payload (no full vectors). */
function embeddingRawShapeSummary(raw: unknown): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object') {
    return { kind: typeof raw }
  }
  const o = raw as Record<string, unknown>
  const out: Record<string, unknown> = {}
  if (Array.isArray(o.shape)) {
    out.shape = o.shape
  }
  if ('data' in o) {
    const d = o.data
    if (Array.isArray(d)) {
      out.dataOuterLen = d.length
      const first = d[0]
      if (Array.isArray(first)) {
        out.firstRowLen = first.length
      } else if (typeof first === 'number') {
        out.firstRowFlatNumberCount = d.length
      } else if (first != null && typeof first === 'object' && ArrayBuffer.isView(first)) {
        out.firstRowIsArrayBufferView = (first as { constructor?: { name?: string } }).constructor?.name
      }
    } else {
      out.dataType = typeof d
    }
  }
  if (Object.keys(out).length === 0) {
    out.keys = Object.keys(o)
  }
  return out
}

export const onRequestPost: PagesFunction<Env> = async () => {
  return Response.json(
    { ok: false, error: 'method not allowed', detail: 'use GET', stage: 'bad_request' },
    { status: 405 },
  )
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const model = resolveModel(url.searchParams.get('model'))

  try {
    const raw = await context.env.AI.run(model as keyof AiModels, {
      text: [...SAMPLE],
    })

    const vectors = extractEmbeddingsFromAiResponse(raw, 1)
    const first = vectors[0]

    return Response.json({
      ok: true,
      model,
      embeddingCount: vectors.length,
      firstEmbeddingDims: first?.length ?? 0,
      shapeSummary: embeddingRawShapeSummary(raw),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(
      `[cf_ai_docpilot:ai-smoke] ${JSON.stringify({ ok: false, model, detail: message })}`,
    )
    return Response.json(
      {
        ok: false,
        stage: 'ai_smoke_test_failed',
        model,
        error: err instanceof Error ? err.name : 'Error',
        detail: message,
      },
      { status: 500 },
    )
  }
}
