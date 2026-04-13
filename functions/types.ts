export type DocumentRow = {
  id: string
  title: string | null
  r2_key: string
  mime_type: string | null
  byte_size: number | null
  status: string
  error: string | null
  chunk_count: number
  created_at: string
  updated_at: string
}
