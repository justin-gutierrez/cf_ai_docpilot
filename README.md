# cf_ai_docpilot

**cf_ai_docpilot** is a **local-first**, **Cloudflare-based** demo of **chat with your documents**. You upload files, the app stores raw bytes in **R2**, tracks metadata and text chunks in **D1**, computes **embeddings** with **Ollama** (running on your machine), stores those vectors **in D1**, and answers questions using **retrieval** (cosine similarity over stored embeddings) plus **grounded chat** from Ollama. Responses include **citations** (chunk id, document id, ordinal, title, score) so answers can be traced back to source text.

**This repository is meant to be evaluated locally.** There is no required hosted URL, no paid LLM API key, and no Cloudflare Workers AI or Vectorize dependency. The Pages Functions Worker calls **Ollama’s HTTP API** on `localhost` for both embedding and chat.

---

## What this project is for (plain language)

1. **Upload** documents (see [PDF note](#pdf-and-file-formats) below).  
2. **Ingest** them: extract text, split into chunks, save chunks in D1.  
3. **Index** them: embed each chunk with Ollama and save vectors on the chunk rows in D1.  
4. **Chat**: create a session (optionally scoped to one document), ask a question, get an answer **grounded in retrieved chunks** plus **structured citations**.

The included **React** UI is minimal; reviewers can exercise **all major behavior through the HTTP API** using the steps and `curl` examples below.

---

## How this satisfies the assignment

This README is the **project documentation** with **clear running instructions** to try each component. The design maps cleanly to a typical “Cloudflare + RAG / doc chat” brief:

| Expectation | What we ship |
|-------------|----------------|
| Cloudflare-native app | **Pages** (Vite static site) + **Pages Functions** (`functions/`) |
| Durable storage for app data | **D1** — documents, chunks, embeddings (JSON on rows), chat sessions, messages |
| Raw file storage | **R2** — uploaded objects |
| Embeddings | **Ollama** (`nomic-embed-text`), vectors persisted in D1 |
| Retrieval | **Application code** — cosine similarity over chunk embeddings in D1 (no separate vector DB service) |
| Grounded answers + citations | **Ollama** (`qwen2.5:7b`) with context from top‑k chunks; citations returned in JSON |
| Runnable evaluation | **Local-only** path: Ollama + `wrangler pages dev` + `curl` (documented end-to-end below) |

---

## Architecture (high level)

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (browser or curl)                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (local dev server)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages                                                │
│  • Static assets from Vite build (`dist/`)                       │
│  • Pages Functions (`functions/`) — REST API under `/api/*`      │
└─────────────┬───────────────────────┬──────────────────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│  D1 (SQLite)             │  R2                       │
│  • documents             │  • raw uploads per doc     │
│  • chunks + embeddings     │                           │
│  • chat_sessions / msgs    │                           │
└─────────────────────────┘ └─────────────────────────┘
              │
              │  fetch() to localhost
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ollama (same machine)                                           │
│  • POST /api/embeddings — nomic-embed-text                      │
│  • POST /api/chat — qwen2.5:7b                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Pipeline in order:** upload → ingest → index → chat (session + message).

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | v18+ recommended |
| **npm** | Comes with Node |
| **Git** | To clone the repository |
| **Cloudflare account** | For `wrangler login` (D1 / R2 bindings in dev often talk to your account) |
| **Ollama** | Installed and running; models pulled (see below) |

---

## One-time setup

### 1. Clone and install JavaScript dependencies

```bash
git clone <your-repo-url> cf_ai_docpilot
cd cf_ai_docpilot
npm install
```

### 2. Log in to Cloudflare (Wrangler)

```bash
npx wrangler login
```

### 3. Install and configure Ollama

1. Install Ollama from [ollama.com](https://ollama.com/) for your OS.  
2. Start Ollama (desktop app or `ollama serve` in a terminal).  
3. Pull the models referenced in `wrangler.jsonc`:

```bash
ollama pull nomic-embed-text
ollama pull qwen2.5:7b
```

4. Verify the daemon responds:

```bash
curl -s http://127.0.0.1:11434/api/tags
```

Default base URL is **`http://127.0.0.1:11434`** (`OLLAMA_BASE_URL` in `wrangler.jsonc`). The dev Worker must run on the **same machine** as Ollama so `localhost` is reachable.

### 4. Cloudflare resources (D1 / R2)

- **`wrangler.jsonc`** binds a D1 database named **`cf_ai_docpilot`** and an R2 bucket **`cf-ai-docpilot-docs`**.  
- Ensure the **database** and **bucket** exist in your Cloudflare account **or** update `database_id` / `bucket_name` in `wrangler.jsonc` to match yours.  
- After changing bindings, regenerate types:

```bash
npm run cf-typegen
```

### 5. Apply D1 migrations (local database)

```bash
npm run db:migrate:local
```

This applies SQL in `migrations/` to the **local** D1 instance used by `wrangler pages dev`.

---

## Local development (exact commands)

Build the front end and TypeScript (including `functions/`), then start the **full** stack (static + Pages Functions):

```bash
npm run build
npx wrangler pages dev ./dist
```

Wrangler prints a **local URL** (commonly `http://localhost:8788`). Use that host and port in all API calls below—**replace `8788` if your terminal shows a different port.**

**Note:** `npm run dev` starts **Vite only** (fast UI reload) and does **not** serve Pages Functions. For API testing, use the command above.

Other useful scripts:

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` after Wrangler config changes |
| `npm run db:migrate:remote` | Apply migrations to **remote** D1 (only if you configure remote DB) |
| `npm run deploy` | Build + deploy to Pages (optional; not required for local evaluation) |

---

## Quick demo (one command)

After completing the **One-time setup** steps above (including pulling Ollama models and running local D1 migrations), you can run a reviewer‑friendly end‑to‑end demo with a single command.

1. **Start Ollama** and ensure the models are available:

   ```bash
   ollama serve          # or start the Ollama desktop app
   ollama pull nomic-embed-text
   ollama pull qwen2.5:7b
   ```

2. **Start the local app** (Pages static assets + Functions):

   ```bash
   npm run build
   npx wrangler pages dev ./dist
   ```

   Note the URL Wrangler prints (for example `http://localhost:8788`). The demo script defaults to `http://localhost:8788`; if your port differs, set `API_BASE` before running it.

3. **In a second terminal**, from the project root, run:

   ```bash
   npm run demo
   ```

   This script will:

   - Hit `/api/health`.
   - Upload `sample_docs/demo_handbook.md`.
   - Ingest and index the document.
   - Create a chat session scoped to that document.
   - Ask a couple of sample questions and print the assistant answers and citations in a readable format.

If your dev server is running on a non‑default port, you can override the base URL:

```bash
API_BASE=http://localhost:8789 npm run demo
```

---

## How to try it (step by step)

Set a shell variable for the API base (adjust port if needed):

```bash
export API=http://localhost:8788
```

### Step 0 — Health check

Confirms the Worker is up:

```bash
curl -s "$API/api/health"
```

Expected: JSON with `"ok": true` (and service metadata).

---

### Step 1 — Upload a document

Upload a **Markdown** or **text** file for the smoothest path (see [PDF note](#pdf-and-file-formats)):

```bash
curl -s -X POST "$API/api/documents/upload" \
  -F "file=@./README.md;type=text/markdown" \
  -F "title=README"
```

Copy the **`document.id`** from the JSON (a UUID). Export it for the next steps:

```bash
export DOC_ID='<paste-document-id-here>'
```

---

### Step 2 — Ingest (extract text, create chunks in D1)

```bash
curl -s -X POST "$API/api/documents/$DOC_ID/ingest"
```

The document should move to **`ready`** with chunk rows in D1.

---

### Step 3 — Index (embed chunks with Ollama, store vectors in D1)

```bash
curl -s -X POST "$API/api/documents/$DOC_ID/index"
```

Optional: index only the first chunk while debugging:

```bash
curl -s -X POST "$API/api/documents/$DOC_ID/index?limit=1"
```

Optional Ollama-only smoke test (embeddings, no D1 write beyond your other calls):

```bash
curl -s "$API/api/debug/ai-embedding"
```

---

### Step 4 — Create a chat session (scoped to this document)

```bash
curl -s -X POST "$API/api/chat/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"README Q&A\",\"documentId\":\"$DOC_ID\"}"
```

Copy **`session.id`** from the response:

```bash
export SESSION_ID='<paste-session-id-here>'
```

---

### Step 5 — Ask a question

```bash
curl -s -X POST "$API/api/chat/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"What is this project and what stack does it use? Summarize in two sentences."}'
```

The response should include **`assistant.content`** and **`assistant.citations`** (array with `chunkId`, `documentId`, `ordinal`, `title`, `score`).

---

### Step 6 — Fetch session history

```bash
curl -s "$API/api/chat/sessions/$SESSION_ID"
```

You should see the session metadata and an ordered list of **user** and **assistant** messages; assistant rows may include parsed **`citations`** stored in D1.

---

### More sample questions (same `messages` endpoint)

```bash
curl -s -X POST "$API/api/chat/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"What are the exact Ollama model names this app expects?"}'
```

```bash
curl -s -X POST "$API/api/chat/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"Where are chunk embeddings stored?"}'
```

---

## API quick reference

| Method | Path | Role |
|--------|------|------|
| GET | `/api/health` | Liveness |
| GET | `/api/documents` | List documents |
| POST | `/api/documents/upload` | Multipart upload → R2 + D1 |
| GET | `/api/documents/:id` | Document metadata |
| POST | `/api/documents/:id/ingest` | Ingest → chunks |
| POST | `/api/documents/:id/index` | Embed → D1 |
| POST | `/api/chat/sessions` | Create session (`documentId` optional) |
| GET | `/api/chat/sessions/:id` | Session + messages |
| POST | `/api/chat/sessions/:id/messages` | Ask question |
| GET | `/api/debug/ai-embedding` | Ollama embedding smoke test |

---

## PDF and file formats

- **`.pdf`**, **`.md`**, **`.txt`** (and **`.markdown`**) are accepted on upload with MIME validation.  
- **Recommended for evaluation:** **Markdown** or **plain text** — ingestion and chunking are reliable.  
- **PDF:** allowed, but **full PDF text extraction is not the focus** of the current pipeline; use PDFs only if you have verified ingest works for your files. For a predictable demo, prefer **`README.md`** or a **`.txt`** file.

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| **`ollama` / connection errors** during index or chat | Is Ollama running? `curl http://127.0.0.1:11434/api/tags`. Are both models pulled? Same machine as `wrangler pages dev`. |
| **500 on embeddings** | Run `curl "$API/api/debug/ai-embedding"`; inspect Wrangler logs. Firewall / VPN blocking localhost. |
| **D1 errors / missing tables** | Run `npm run db:migrate:local` again after pulling latest migrations. |
| **R2 or D1 “not found” / binding errors** | `npx wrangler login`; `wrangler.jsonc` `database_id` and `bucket_name` match your account. |
| **Empty or bad chat answers** | Confirm **ingest** and **index** succeeded for that document; session `documentId` matches; chunks have `embedding_json` populated. |
| **Port confusion** | Always use the URL printed by Wrangler, not a guess. |
| **Type errors after editing `wrangler.jsonc`** | Run `npm run cf-typegen`. |

---

## Current limitations

- **Local-first evaluation** is the primary story; production deployment would require a separate inference strategy (Ollama is not on the public internet by default).  
- **No authentication**; all sessions and documents are effectively shared in dev.  
- **No OCR**, billing, or multi-user isolation.  
- **React UI** is minimal; the **API** is the main surface for reviewers.  
- **Chat** does not stream tokens; full reply is returned in one JSON response.

---

## Development notes and prompts

Iterative **AI-assisted prompts** and scaffolding used while building this project are collected in **`PROMPTS.md`** (optional reading; not required to run the app).

---

## Scripts (reference)

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite only (no Pages Functions) |
| `npm run build` | `tsc -b` + Vite build → `dist/` |
| `npm run preview` | `npm run build` then `wrangler pages dev` (see Wrangler for URL) |
| `npm run lint` | ESLint |
| `npm run cf-typegen` | Generate TypeScript env types from Wrangler |
| `npm run db:migrate:local` | Local D1 migrations |
| `npm run db:migrate:remote` | Remote D1 migrations |

---

## License

Private / assignment use unless otherwise stated by the author.
