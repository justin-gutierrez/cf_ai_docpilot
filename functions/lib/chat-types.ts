export type ChatCitation = {
  chunkId: string
  documentId: string
  ordinal: number
  title: string | null
  score: number
}

export type ChatSessionRow = {
  id: string
  title: string | null
  document_id: string | null
  created_at: string
  updated_at: string
}

export type ChatMessageRow = {
  id: string
  session_id: string
  role: string
  content: string
  citations: string | null
  created_at: string
}
