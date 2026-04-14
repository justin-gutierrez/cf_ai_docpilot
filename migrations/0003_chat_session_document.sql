-- Optional document scope for chat sessions (retrieve only that document's chunks).

ALTER TABLE chat_sessions ADD COLUMN document_id TEXT;

CREATE INDEX idx_chat_sessions_document ON chat_sessions(document_id);
