import { parseCitationsField } from '../../../lib/chat-json'
import { getChatSession, listChatMessages } from '../../../lib/chat-store'

export const onRequestPost: PagesFunction<Env> = async () => {
  return Response.json(
    { ok: false, error: 'method not allowed', detail: 'use GET', stage: 'bad_request' },
    { status: 405 },
  )
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const rawId = context.params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  if (!id) {
    return Response.json({ ok: false, error: 'missing session id', stage: 'bad_request' }, { status: 400 })
  }

  const session = await getChatSession(context.env.DB, id)
  if (!session) {
    return Response.json({ ok: false, error: 'session not found', stage: 'not_found' }, { status: 404 })
  }

  const rows = await listChatMessages(context.env.DB, id)
  const messages = rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    citations: parseCitationsField(m.citations),
    created_at: m.created_at,
  }))

  return Response.json({
    ok: true,
    session: {
      id: session.id,
      title: session.title,
      documentId: session.document_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
    },
    messages,
  })
}
