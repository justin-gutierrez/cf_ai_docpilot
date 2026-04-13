import { getDocumentById } from '../../lib/documents'
import { jsonError } from '../../lib/json-response'

export const onRequestPost: PagesFunction<Env> = async () => {
  return jsonError(405, 'method not allowed', 'use GET')
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const rawId = context.params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  if (!id) {
    return jsonError(400, 'missing document id')
  }

  try {
    const document = await getDocumentById(context.env.DB, id)
    if (!document) {
      return jsonError(404, 'document not found')
    }
    return Response.json({ document })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return jsonError(500, 'failed to load document', message)
  }
}
