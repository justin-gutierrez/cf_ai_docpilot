import type { ChatMessageRow, ChatSessionRow } from './chat-types'

export async function insertChatSession(
  db: D1Database,
  input: { id: string; title: string | null; documentId: string | null },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO chat_sessions (id, title, document_id, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    )
    .bind(input.id, input.title, input.documentId)
    .run()
}

export async function getChatSession(db: D1Database, sessionId: string): Promise<ChatSessionRow | null> {
  const row = await db
    .prepare(
      `SELECT id, title, document_id, created_at, updated_at
       FROM chat_sessions
       WHERE id = ?`,
    )
    .bind(sessionId)
    .first<ChatSessionRow>()

  return row ?? null
}

export async function listChatMessages(
  db: D1Database,
  sessionId: string,
): Promise<ChatMessageRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, session_id, role, content, citations, created_at
       FROM chat_messages
       WHERE session_id = ?
       ORDER BY datetime(created_at) ASC`,
    )
    .bind(sessionId)
    .all<ChatMessageRow>()

  return results ?? []
}

export async function insertChatMessage(
  db: D1Database,
  input: {
    id: string
    sessionId: string
    role: 'user' | 'assistant'
    content: string
    citationsJson: string | null
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO chat_messages (id, session_id, role, content, citations, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(input.id, input.sessionId, input.role, input.content, input.citationsJson)
    .run()
}

export async function touchChatSession(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare(`UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?`)
    .bind(sessionId)
    .run()
}
