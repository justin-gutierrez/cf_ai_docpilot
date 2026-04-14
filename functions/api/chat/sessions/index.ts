import { getDocumentById } from '../../../lib/documents'
import { insertChatSession } from '../../../lib/chat-store'
import { readJsonBody } from '../../../lib/chat-json'

type CreateSessionBody = {
  title?: string
  documentId?: string
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json(
    { ok: false, error: 'method not allowed', detail: 'use POST', stage: 'bad_request' },
    { status: 405 },
  )
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await readJsonBody<CreateSessionBody>(context.request)
  if (!body || typeof body !== 'object') {
    return Response.json(
      { ok: false, error: 'invalid_json', stage: 'bad_request' },
      { status: 400 },
    )
  }

  const title =
    typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : null
  const documentId =
    typeof body.documentId === 'string' && body.documentId.trim() !== ''
      ? body.documentId.trim()
      : null

  if (documentId) {
    const doc = await getDocumentById(context.env.DB, documentId)
    if (!doc) {
      return Response.json(
        { ok: false, error: 'document not found', documentId, stage: 'invalid_document' },
        { status: 404 },
      )
    }
  }

  const id = crypto.randomUUID()
  try {
    await insertChatSession(context.env.DB, { id, title, documentId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to create session'
    return Response.json(
      { ok: false, error: 'create_session_failed', detail: message, stage: 'd1_write_failed' },
      { status: 500 },
    )
  }

  return Response.json(
    {
      ok: true,
      session: { id, title, documentId },
    },
    { status: 201 },
  )
}
