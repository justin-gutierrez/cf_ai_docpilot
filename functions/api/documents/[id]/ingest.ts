import { getDocumentById } from '../../../lib/documents'
import { ingestDocumentById } from '../../../lib/ingest-document'
import { jsonError } from '../../../lib/json-response'

export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonError(405, 'method not allowed', 'use POST')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const rawId = context.params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  if (!id) {
    return jsonError(400, 'missing document id')
  }

  try {
    const result = await ingestDocumentById(context.env, id)
    if (!result.ok) {
      return Response.json(
        { error: result.error, detail: result.detail },
        { status: result.httpStatus },
      )
    }

    const document = await getDocumentById(context.env.DB, id)
    return Response.json({
      ok: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
      document,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return jsonError(500, 'ingest_failed', message)
  }
}
