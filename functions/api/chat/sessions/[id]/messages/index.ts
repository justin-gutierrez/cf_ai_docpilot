import { answerChatQuestion, type ChatEnv } from '../../../../../lib/chat-answer'
import { readJsonBody } from '../../../../../lib/chat-json'

type PostMessageBody = {
  content?: string
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json(
    { ok: false, error: 'method not allowed', detail: 'use POST', stage: 'bad_request' },
    { status: 405 },
  )
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const rawId = context.params.id
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId
  if (!sessionId) {
    return Response.json({ ok: false, error: 'missing session id', stage: 'bad_request' }, { status: 400 })
  }

  const body = await readJsonBody<PostMessageBody>(context.request)
  if (!body || typeof body !== 'object') {
    return Response.json(
      { ok: false, error: 'invalid_json', stage: 'bad_request' },
      { status: 400 },
    )
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) {
    return Response.json(
      { ok: false, error: 'missing content', detail: 'provide non-empty string "content"', stage: 'bad_request' },
      { status: 400 },
    )
  }

  const env: ChatEnv = {
    DB: context.env.DB,
    OLLAMA_BASE_URL: context.env.OLLAMA_BASE_URL,
    OLLAMA_EMBED_MODEL: context.env.OLLAMA_EMBED_MODEL,
    OLLAMA_CHAT_MODEL: context.env.OLLAMA_CHAT_MODEL,
  }

  const result = await answerChatQuestion(env, sessionId, content)
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
    userMessageId: result.userMessageId,
    assistantMessageId: result.assistantMessageId,
    assistant: {
      content: result.content,
      citations: result.citations,
    },
  })
}
