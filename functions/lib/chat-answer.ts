import type { ChatCitation } from './chat-types'
import { getDocumentById } from './documents'
import { getChatSession, insertChatMessage, touchChatSession } from './chat-store'
import { ollamaChat, type OllamaChatMessage } from './ollama'
import { retrieveWithOllamaQuery, type RetrievedChunk } from './retrieval'

const DEFAULT_TOP_K = 5

export type ChatEnv = {
  DB: D1Database
  OLLAMA_BASE_URL: string
  OLLAMA_EMBED_MODEL: string
  OLLAMA_CHAT_MODEL: string
}

export type ChatAnswerResult =
  | {
      ok: true
      userMessageId: string
      assistantMessageId: string
      content: string
      citations: ChatCitation[]
    }
  | {
      ok: false
      httpStatus: number
      error: string
      detail?: string
      stage: string
    }

async function buildCitations(
  db: D1Database,
  chunks: RetrievedChunk[],
): Promise<ChatCitation[]> {
  const out: ChatCitation[] = []
  for (const c of chunks) {
    const doc = await getDocumentById(db, c.document_id)
    out.push({
      chunkId: c.id,
      documentId: c.document_id,
      ordinal: c.ordinal,
      title: doc?.title ?? null,
      score: c.score,
    })
  }
  return out
}

function buildGroundedPrompt(question: string, chunks: RetrievedChunk[], titles: Map<string, string | null>): string {
  const blocks = chunks.map((ch, i) => {
    const n = i + 1
    const title = titles.get(ch.document_id) ?? 'untitled'
    return `[${n}] (document: ${title}, chunk ordinal ${ch.ordinal})\n${ch.text}`
  })

  return `Answer ONLY using the numbered CONTEXT blocks below. If the answer is not supported by the context, say clearly that the provided documents do not contain enough information. Do not invent facts.

CONTEXT:
${blocks.join('\n\n---\n\n')}

Question: ${question}`
}

export async function answerChatQuestion(
  env: ChatEnv,
  sessionId: string,
  question: string,
  options: { topK?: number; fetcher?: typeof fetch } = {},
): Promise<ChatAnswerResult> {
  const { DB: db } = env
  const topK = options.topK ?? DEFAULT_TOP_K
  const fetcher = options.fetcher ?? fetch

  const session = await getChatSession(db, sessionId)
  if (!session) {
    return {
      ok: false,
      httpStatus: 404,
      error: 'session not found',
      stage: 'session_not_found',
    }
  }

  const documentId = session.document_id ?? undefined

  let retrieved: RetrievedChunk[]
  try {
    retrieved = await retrieveWithOllamaQuery(
      db,
      env.OLLAMA_BASE_URL,
      env.OLLAMA_EMBED_MODEL,
      question,
      topK,
      { documentId },
      fetcher,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'retrieval failed'
    return {
      ok: false,
      httpStatus: 502,
      error: 'retrieval_failed',
      detail: message,
      stage: 'retrieval_failed',
    }
  }

  const citations = await buildCitations(db, retrieved)
  const titleMap = new Map<string, string | null>()
  for (const c of citations) {
    titleMap.set(c.documentId, c.title)
  }

  const userMessageId = crypto.randomUUID()
  try {
    await insertChatMessage(db, {
      id: userMessageId,
      sessionId,
      role: 'user',
      content: question,
      citationsJson: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to save user message'
    return {
      ok: false,
      httpStatus: 500,
      error: 'persist_user_message_failed',
      detail: message,
      stage: 'persist_user_message_failed',
    }
  }

  const systemContent =
    'You are a precise assistant for document Q&A. Use only the context given in the user message. If context is empty, say no relevant passages were retrieved.'

  let userPrompt: string
  if (retrieved.length === 0) {
    userPrompt = `No relevant document chunks were retrieved (empty context).

Question: ${question}`
  } else {
    userPrompt = buildGroundedPrompt(question, retrieved, titleMap)
  }

  const messages: OllamaChatMessage[] = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userPrompt },
  ]

  let assistantText: string
  try {
    assistantText = await ollamaChat(
      env.OLLAMA_BASE_URL,
      env.OLLAMA_CHAT_MODEL,
      messages,
      fetcher,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ollama chat failed'
    return {
      ok: false,
      httpStatus: 502,
      error: 'chat_generation_failed',
      detail: message,
      stage: 'chat_generation_failed',
    }
  }

  const assistantMessageId = crypto.randomUUID()
  const citationsJson = JSON.stringify(citations)

  try {
    await insertChatMessage(db, {
      id: assistantMessageId,
      sessionId,
      role: 'assistant',
      content: assistantText,
      citationsJson,
    })
    await touchChatSession(db, sessionId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to save assistant message'
    return {
      ok: false,
      httpStatus: 500,
      error: 'persist_assistant_message_failed',
      detail: message,
      stage: 'persist_assistant_message_failed',
    }
  }

  return {
    ok: true,
    userMessageId,
    assistantMessageId,
    content: assistantText,
    citations,
  }
}
