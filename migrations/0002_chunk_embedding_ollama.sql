-- Local Ollama embeddings stored on each chunk (JSON array of floats).

ALTER TABLE chunks ADD COLUMN embedding_json TEXT;
ALTER TABLE chunks ADD COLUMN embedding_model TEXT;
ALTER TABLE chunks ADD COLUMN embedded_at TEXT;
