# PROMPTS.md

## Prompt 1

```text
# Prompt 1: 
You are helping me build cf_ai_docpilot, a Cloudflare-native chat-with-your-documents app.

Product:
Users upload PDFs/notes/docs, the app stores raw files, extracts and chunks text, embeds chunks into a vector index, and lets users chat with their documents using grounded answers with citations.

Locked stack decisions:
- React frontend on Cloudflare Pages
- Worker API backend
- Workers AI for generation and embeddings
- R2 for raw file storage
- Vectorize for embeddings index
- D1 for document metadata, chat sessions, and messages
- Workflows for background summaries

V1 scope:
Single-user demo app. No auth, billing, OCR, or collaboration. Focus on upload, ingest, retrieve, answer, cite, and summarize.

Please inspect the current scaffold and output:
1. recommended folder structure
2. API routes
3. D1 schema
4. ingestion flow
5. chat flow
6. the first 5 implementation steps

Do not generate lots of code yet. Keep the architecture practical and small.
```

## Prompt 2

```text
#Prompt 2:
Use the architecture you just proposed and implement only the initial scaffolding and D1 foundation for cf_ai_docpilot.

Current goal:
Set up the project structure, create the initial D1 schema and migration, wire the minimum Wrangler config placeholders/bindings needed for local development, and implement two minimal Pages Functions routes:
- GET /api/health
- GET /api/documents

Important:
Do not implement upload, R2, Vectorize, Workers AI, chat, or Workflows yet.
Do not add auth, OCR, or large UI changes.
Do not overengineer abstractions.

Context:
This is a Cloudflare-native chat-with-your-documents app.
Stack is locked:
- React frontend on Cloudflare Pages
- Pages Functions / Worker API
- D1 for document metadata, chat sessions, and messages
- R2 for raw file storage later
- Vectorize later
- Workers AI later
- Workflows later

What to implement now:
1. Create the recommended folder/file structure needed for:
   - functions/api/health.ts
   - functions/api/documents/index.ts
   - migrations/0001_init.sql
   - any small shared types/util files if truly necessary
2. Create the initial D1 migration for:
   - documents
   - chunks
   - chat_sessions
   - chat_messages
   - chat_summaries
3. Update Wrangler config only as needed for this phase, using placeholders/TODO comments where actual resource IDs are still needed
4. Add any package scripts that help with D1 migration/type generation/local dev
5. Implement:
   - GET /api/health returning a simple JSON response
   - GET /api/documents returning a minimal list from D1
6. Keep route handlers thin and code modular
7. If something cannot be completed without a real Cloudflare resource ID, leave a clear TODO and still implement everything else cleanly

Acceptance criteria:
- project structure exists for the API and migrations
- D1 migration SQL is created
- wrangler config is prepared for D1 integration
- /api/health works
- /api/documents is implemented against D1
- changes are small, readable, and production-leaning
- no unrelated features are added

Instructions:
- first give a concise implementation plan
- then make the code changes
- then list exactly what I need to do manually in the terminal after the changes
```

## Prompt 3

```text
# Prompt 3: 
Use the current cf_ai_docpilot codebase and preserve the existing Pages Functions + D1 foundation.

Current goal:
Implement real document upload to R2 and document metadata persistence in D1.

Scope for this phase:
- add the R2 binding to wrangler config
- implement POST /api/documents/upload
- implement GET /api/documents/:id
- update GET /api/documents if needed
- accept actual file uploads from the backend route
- store the raw uploaded file in R2
- create the corresponding document row in D1 with status = 'pending'

Do not implement ingestion, chunking, PDF parsing, Vectorize, Workers AI, chat, or Workflows yet.
Do not add auth or large UI work.

Requirements:
1. Update wrangler.jsonc to include an R2 bucket binding named DOCS_BUCKET, with a clear TODO/placeholders where needed
2. Add the Pages Functions files needed for:
   - POST /api/documents/upload
   - GET /api/documents/[id]
3. Accept multipart/form-data upload with a single file field
4. Validate:
   - allowed file types: pdf, txt, md
   - reasonable size limit
   - missing file errors
5. Store the raw file in R2 with a deterministic object key
6. Insert a D1 document record containing at least:
   - id
   - title
   - r2_key
   - mime_type
   - byte_size
   - status
   - created_at / updated_at
7. Return clean JSON responses and clear error messages
8. Keep route handlers thin and move storage/DB logic into small helper modules
9. Reuse the existing D1 foundation and code style already in the repo

Constraints:
- no ingestion pipeline yet
- no vector index work yet
- no PDF text extraction yet
- no broad refactors
- keep code typed, small, and production-leaning

Acceptance criteria:
- I can POST a real file to /api/documents/upload
- the file is stored in R2
- a document row is created in D1 with status 'pending'
- GET /api/documents lists the uploaded document
- GET /api/documents/:id returns document metadata
- code is modular and consistent with the current structure

Instructions:
- first give a concise implementation plan
- then make the code changes
- then list the exact Cloudflare setup steps I must do manually next, including the R2 bucket creation command and any config values I need to paste into wrangler.jsonc
- then list exact curl commands I can use to test the upload endpoint locally
```

## Prompt 4

```text
# Prompt 4:
Use your proposed upload plan and now actually implement the code changes in the repo.

Current goal:
Implement the real document upload phase for cf_ai_docpilot.

The R2 bucket already exists in Cloudflare and wrangler.jsonc has already been updated with the R2 binding:
- binding: DOCS_BUCKET
- bucket_name: cf-ai-docpilot-docs

Do the code changes now, not just the plan.

Scope:
- use the existing R2 binding in wrangler.jsonc
- create the helper files you proposed
- implement POST /api/documents/upload
- implement GET /api/documents/[id]
- extend the D1 document helpers as needed
- keep the existing GET /api/documents working

Requirements:
1. Accept multipart/form-data with a required file field named file
2. Allow pdf, txt, md, and markdown
3. Enforce a reasonable size limit
4. Store the raw uploaded file in R2 with a deterministic key
5. Insert a D1 document row with status = 'pending'
6. Return clear JSON responses and validation errors
7. Keep route handlers thin and push logic into helper modules
8. Preserve the existing Pages Functions + D1 foundation
9. Do not implement ingestion, Vectorize, Workers AI, chat, or Workflows yet

Constraints:
- no auth
- no broad refactors
- no UI work unless absolutely required
- no extra features beyond this upload phase

Acceptance criteria:
- POST /api/documents/upload stores a file in R2 and creates a D1 record
- GET /api/documents returns the uploaded document
- GET /api/documents/[id] returns document metadata
- code is typed, small, and production-leaning

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact terminal commands I should run afterward to test locally
- then give me the exact curl command to upload README.md for testing
```

## Prompt 5

```text
# Prompt 5:
Use the current cf_ai_docpilot codebase and preserve the existing Pages Functions + D1 + R2 upload foundation.

Current goal:
Implement the ingestion foundation for uploaded documents.

Do the code changes now, not just the plan.

Scope for this phase:
- add an ingestion route that processes one uploaded document by id
- read the raw file from R2
- support text extraction for txt, md, and markdown first
- chunk the extracted text deterministically
- insert chunk rows into D1
- update the document status in D1 to processing, ready, or failed
- keep pdf support as a clear TODO for the next phase

Do not implement Vectorize, embeddings, Workers AI, chat, or Workflows yet.
Do not add auth or UI work.

Requirements:
1. Add the Pages Functions file(s) needed for:
   - POST /api/documents/[id]/ingest
2. Read the uploaded file from R2 using the existing r2_key from D1
3. Support text-based files only in this phase:
   - .txt
   - .md
   - .markdown
4. If the file is a pdf, return a clear not-yet-supported error and leave a TODO for the next phase
5. Create deterministic chunking logic with a reasonable chunk size and overlap
6. Insert chunk rows into the existing chunks table
7. Update the document row:
   - processing when ingestion starts
   - ready when chunks are stored successfully
   - failed with an error message when ingestion fails
8. Keep route handlers thin and move extraction/chunking/DB logic into small helper modules
9. Prevent duplicate chunk inserts for the same document on re-ingest by clearing old chunks first or handling it cleanly
10. Preserve the current code style and structure

Constraints:
- no Vectorize yet
- no Workers AI yet
- no chat yet
- no workflow yet
- no broad refactors
- keep code typed, small, and production-leaning

Acceptance criteria:
- I can POST to /api/documents/:id/ingest
- a txt or md document is read from R2
- chunk rows are created in D1
- the document status changes to ready on success
- errors are handled cleanly
- code is modular and consistent with the current repo

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact terminal commands I should run afterward to test locally
- then give me the exact curl commands to ingest the README.md document I already uploaded and to inspect the results afterward
```

## Prompt 6

```text
# Prompt 6: 
Use the current cf_ai_docpilot codebase and preserve the existing Pages Functions + D1 + R2 + ingestion foundation.

Current goal:
Implement vector indexing for ingested document chunks.

Do the code changes now, not just the plan.

Scope for this phase:
- add Vectorize integration for chunk embeddings
- add a route that indexes one already-ingested document by id
- generate embeddings for the document's stored chunks using Workers AI
- upsert vectors into Vectorize with metadata that includes at least documentId, chunkId, and ordinal
- keep chat/retrieval for the next phase

Do not implement the final chat endpoint yet.
Do not add auth, UI work, or Workflows yet.

Requirements:
1. Add the Pages Functions file(s) needed for:
   - POST /api/documents/[id]/index
2. Read the already-ingested chunk rows for the document from D1
3. Generate embeddings for each chunk using Workers AI
4. Upsert vectors into Vectorize with stable ids matching the chunk ids
5. Store enough vector metadata for later retrieval/citations
6. Handle re-index cleanly for the same document
7. Return a clear JSON response including indexed chunk count
8. Keep route handlers thin and move embedding/index logic into helper modules
9. Preserve the current code style and structure

Constraints:
- do not build chat yet
- do not build retrieval yet
- no broad refactors
- keep code typed, small, and production-leaning
- assume the embeddings model is @cf/baai/bge-base-en-v1.5 unless there is a strong repo-local reason to choose another model

Acceptance criteria:
- I can POST to /api/documents/:id/index
- the route reads chunk rows from D1
- embeddings are generated through Workers AI
- vectors are inserted/upserted into Vectorize
- the response clearly reports success/failure and indexed count
- code is modular and consistent with the current repo

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact manual setup steps I need next, including:
  - the Vectorize index creation command
  - the binding changes needed
  - how to expose the AI binding for local Pages development
- then give me the exact terminal commands and curl command to test indexing the README document I already ingested
```

## Prompt 7

```text
# Prompt 7:
Fix the Cloudflare Pages Functions route collision for document indexing.

Problem:
POST /api/documents/:id/index currently returns 405.
In Cloudflare Pages Functions, a file named index.ts maps to the parent folder route, so the current indexing file path is colliding with the existing GET /api/documents/:id route instead of creating a real /index child route.

Current goal:
Make POST /api/documents/:id/index work as a real endpoint without breaking the existing GET /api/documents/:id metadata route.

Do the code changes now, not just the plan.

Requirements:
1. Keep the existing GET /api/documents/:id behavior working
2. Move or rename the indexing route so that a real literal child route exists for:
   - POST /api/documents/:id/index
3. Preserve the existing indexing logic and helper modules as much as possible
4. Do not change upload, ingestion, D1, R2, Vectorize, or AI logic unless required for the route fix
5. Keep code changes minimal and production-leaning

Constraints:
- no broad refactors
- do not change the indexing response shape unless necessary
- do not add UI work
- preserve current code style

Acceptance criteria:
- GET /api/documents/:id still works
- POST /api/documents/:id/index works
- no route collision remains
- minimal file changes

Instructions:
- first give a very short summary of the file moves/edits you are about to make
- then make the code changes
- then list the exact terminal commands I should run to retest
- then give me the exact curl commands to verify both:
  1. GET /api/documents/44a3e4bc-de63-4699-940b-a441ba1978d8
  2. POST /api/documents/44a3e4bc-de63-4699-940b-a441ba1978d8/index
```

## Prompt 8

```text
# Prompt 8: 
Fix the document indexing route so Vectorize deletion is no longer a blocker for v1.

Problem:
POST /api/documents/:id/index now reaches the handler, but returns:
VECTOR_DELETE_ERROR: Status + 500

Current goal:
Make indexing succeed reliably for v1 by removing or downgrading the delete-before-upsert step.

Do the code changes now, not just the plan.

Requirements:
1. Preserve the existing indexing route and helper structure
2. Keep Workers AI embeddings generation and Vectorize upsert logic
3. Do not make Vectorize delete a hard failure for indexing
4. Prefer one of these approaches:
   - skip delete entirely for v1 and rely on stable chunk ids + upsert
   - or catch delete errors, continue indexing, and return a warning instead of failing
5. Keep stable vector ids equal to chunk ids
6. Keep the response JSON clear and include whether stale vector cleanup was skipped or failed
7. Do not change upload, ingestion, D1, or R2 behavior
8. Keep code changes minimal and production-leaning

Important implementation note:
Vectorize upsert already overwrites vectors with the same id, so pre-deleting current chunk ids is not required for v1. Only stale vectors from a smaller future re-ingest are a cleanup concern, and that can be deferred.

Constraints:
- no broad refactors
- no chat yet
- no retrieval yet
- no UI work

Acceptance criteria:
- POST /api/documents/:id/index succeeds for the existing README document
- vectors are upserted into Vectorize
- delete failures do not cause a 500 for the whole indexing request
- code stays small and modular

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact commands I should run to retest
- then give me the exact curl command to re-index document 44a3e4bc-de63-4699-940b-a441ba1978d8
```

## Prompt 9

```text
# Prompt 9:
Add targeted debugging and failure isolation to the document indexing path.

Current problem:
POST /api/documents/:id/index returns:
{"ok":false,"error":"index_failed","detail":"Error: internal error; reference = ..."}

Current goal:
Make the indexing route report exactly which stage is failing, and add a small debug mode so I can test one chunk at a time.

Do the code changes now, not just the plan.

Requirements:
1. Preserve the current route structure and existing indexing logic
2. Add structured logging and structured error reporting around these stages:
   - load document
   - load chunks
   - generate embeddings
   - validate embedding dimensions
   - upsert into Vectorize
3. Add a temporary debug option so I can index only the first N chunks via query param:
   - POST /api/documents/:id/index?limit=1
4. In development/debug responses, include a machine-readable stage field on failure, for example:
   - load_chunks_failed
   - embeddings_failed
   - invalid_embedding_shape
   - vector_upsert_failed
5. Log useful but compact diagnostics:
   - document id
   - chunk count attempted
   - first chunk id
   - first chunk text length
   - embedding count returned
   - vector dimension of the first embedding if available
6. Do not log entire document text
7. Do not change upload, ingestion, D1, or R2 logic
8. Keep changes minimal and production-leaning

Important:
- Keep the normal success path unchanged
- Keep stable vector ids equal to chunk ids
- If the AI response shape is being assumed incorrectly, normalize it safely
- If the Vectorize payload needs a specific shape, validate it before calling upsert

Constraints:
- no broad refactors
- no UI work
- no chat yet
- no retrieval yet

Acceptance criteria:
- POST /api/documents/:id/index?limit=1 returns either success or a failure JSON that clearly identifies the failing stage
- console logs are enough to diagnose the issue
- code remains small and modular

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact commands I should run to retest
- then give me the exact curl command to test document 44a3e4bc-de63-4699-940b-a441ba1978d8 with limit=1
```

## Prompt 10

```text
# Prompt 10:
Add a minimal Workers AI embeddings smoke test route and a fallback model option for cf_ai_docpilot.

Current problem:
The indexing route reaches the embeddings step, but env.AI.run(...) fails with an internal error during local Pages dev.

Current goal:
Isolate whether Workers AI embeddings are failing generally, or only inside the indexing pipeline.

Do the code changes now, not just the plan.

Requirements:
1. Add a new Pages Functions route:
   - GET /api/debug/ai-embedding
2. The route should:
   - call env.AI.run() with a tiny hardcoded sample input
   - first try the current model @cf/baai/bge-base-en-v1.5
   - return structured JSON with:
     - ok
     - model
     - embeddingCount
     - firstEmbeddingDims
     - raw shape summary if useful
   - if it fails, return:
     - ok: false
     - stage: "ai_smoke_test_failed"
     - model
     - error/detail
3. Add a temporary fallback option via query param:
   - /api/debug/ai-embedding?model=small
   - this should use @cf/baai/bge-small-en-v1.5
4. Keep the route minimal and self-contained
5. Do not change upload, ingestion, D1, R2, or chat logic yet
6. Do not change the main indexing route yet unless needed for a small reusable helper

Important:
- Use the official Workers AI request shape for embeddings:
  { text: ["hello world"] }
- Normalize the response safely and report dimensions clearly
- Keep code small and production-leaning

Constraints:
- no broad refactors
- no UI work
- no Vectorize changes yet
- no chat yet

Acceptance criteria:
- GET /api/debug/ai-embedding returns a clear success/failure JSON for the base model
- GET /api/debug/ai-embedding?model=small returns a clear success/failure JSON for the small model
- I can tell whether the account/dev environment can call embeddings successfully at all

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact commands I should run to test both routes
- then give me the exact curl commands for both the base and small model smoke tests
```

## Prompt 11

```text
# Prompt 11:
Pivot cf_ai_docpilot to a fully local, no-paid-API-key architecture for the final v1.

Current goal:
Remove the dependency on Workers AI and Vectorize, and replace them with local Ollama-based embeddings and local Ollama-based chat generation.

Target architecture:
- Cloudflare Pages Functions for the app/API
- D1 for document metadata, chunk rows, chat sessions, and chat messages
- R2 for raw uploaded files
- Ollama running locally for:
  - embeddings
  - chat generation
- embeddings stored in D1 on each chunk row
- retrieval implemented in app code using cosine similarity over stored chunk embeddings

Do the code changes now, not just the plan.

Requirements:
1. Remove the current dependency on Workers AI embeddings for indexing
2. Remove the current dependency on Vectorize for retrieval
3. Add a small Ollama client module that calls the local Ollama REST API
4. Use:
   - embedding model: nomic-embed-text
   - chat model: qwen2.5:7b
5. Extend the D1 schema as needed so chunk embeddings can be stored locally
6. Update the indexing route so it:
   - reads chunks from D1
   - calls Ollama embeddings locally
   - stores embeddings on chunk rows
7. Add a retrieval helper that:
   - embeds the user query with Ollama
   - computes cosine similarity against chunk embeddings stored in D1
   - returns top-k chunks
8. Prepare the codebase for the later chat route using the same Ollama provider
9. Keep changes minimal, typed, and production-leaning

Constraints:
- local-only instructions
- no paid API keys
- no Workers AI
- no Vectorize
- no broad UI work yet
- preserve existing upload and ingestion flow where possible

Acceptance criteria:
- indexing no longer depends on Workers AI or Vectorize
- embeddings are generated locally through Ollama
- chunk embeddings are stored in D1
- retrieval can be done locally from D1
- the project is easy to document with local-only setup steps

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact local setup commands I need, including Ollama model pulls
- then list the exact README quickstart steps I should include
```

## Prompt 12

```text
# Prompt 12:
Use the current cf_ai_docpilot codebase and preserve the existing local-only Ollama + D1 + R2 foundation.

Current goal:
Implement the first working chat/Q&A route for asking questions about uploaded and indexed documents.

Do the code changes now, not just the plan.

Scope for this phase:
- add a chat session route
- add a message route that answers a user question grounded in indexed document chunks
- use Ollama for both query embedding and final answer generation
- use D1-stored chunk embeddings for retrieval
- return citations with the answer
- persist chat messages in D1

Requirements:
1. Add the Pages Functions files needed for:
   - POST /api/chat/sessions
   - GET /api/chat/sessions/[id]
   - POST /api/chat/sessions/[id]/messages
2. Use existing D1 tables:
   - chat_sessions
   - chat_messages
3. On POST /api/chat/sessions:
   - create a session
   - optionally allow a documentId in the request body for doc-scoped chat
4. On POST /api/chat/sessions/[id]/messages:
   - accept a user question
   - save the user message
   - embed the query with Ollama using nomic-embed-text
   - retrieve top-k similar chunks from D1 using the existing retrieval helpers
   - build a grounded prompt using only the retrieved chunk text
   - call ollamaChat() with qwen2.5:7b
   - instruct the model to answer only from provided context and say when the answer is not supported
   - save the assistant response
   - return assistant content plus citations
5. Citations should include enough information for later UI display, at minimum:
   - chunkId
   - documentId
   - ordinal
   - title if available
6. Keep route handlers thin and move retrieval/prompt/chat logic into helper modules
7. Preserve the local-only setup and existing code style

Constraints:
- no auth
- no broad UI work
- no Workers AI
- no Vectorize
- no broad refactors
- keep code typed, small, and production-leaning

Acceptance criteria:
- I can create a chat session
- I can send a question to a session
- the app retrieves relevant chunks from D1
- Ollama generates a grounded answer
- the response includes citations
- user and assistant messages are stored in D1

Instructions:
- first give a very short summary of the files you are about to edit
- then make the code changes
- then list the exact terminal commands I should run to test locally
- then give me the exact curl commands to:
  1. create a session
  2. ask a question about document 44a3e4bc-de63-4699-940b-a441ba1978d8
  3. fetch the session afterward
```

## Prompt 13

```text
# Prompt 13: 
Create a strong project README for cf_ai_docpilot.

Current state of the app:
- Cloudflare Pages Functions app
- D1 for metadata, chunks, sessions, and messages
- R2 for uploaded raw documents
- local Ollama for embeddings and chat
- upload, ingest, index, and chat all work locally
- citations are returned with answers
- local-only setup is the official evaluation path

Goal:
Replace the default Vite README with a polished README that matches the assignment requirements and makes the project easy for a hiring team to evaluate locally.

Requirements:
1. Explain what the app does in plain language
2. Explicitly map the project to the assignment requirements
3. Include a local setup section with exact commands
4. Include Ollama setup instructions
5. Include Cloudflare local dev instructions
6. Include a “How to try it” section with:
   - upload
   - ingest
   - index
   - ask a question
7. Include sample curl commands and sample questions
8. Include a short architecture section
9. Include known limitations
10. Mention that AI-assisted prompts are documented in PROMPTS.md

Constraints:
- keep it polished and concise
- assume local-only evaluation
- do not invent deployed links
- do not mention unfinished features as completed

Instructions:
- first provide the full README.md content only
```

## Prompt 14

```text
# Prompt 14:
Replace the current README.md with a more polished and detailed version that clearly satisfies this requirement:

"must include a README.md file with project documentation and clear running instructions to try out components"

Context:
This repository is cf_ai_docpilot, a local-first Cloudflare-based chat-with-your-documents app.

Current architecture:
- Cloudflare Pages Functions
- D1 for documents, chunks, embeddings, chat sessions, and chat messages
- R2 for raw uploaded files
- local Ollama for embeddings and chat
- upload, ingest, index, and chat all work locally
- citations are returned with answers
- local-only setup is the official evaluation path

Goal:
Rewrite README.md so a completely new person can understand the project, install dependencies, run it locally, and test all major components end to end.

Requirements:
1. Explain what the app does in plain language
2. Include a section explaining how the project satisfies the assignment
3. Include a high-level architecture section
4. Include prerequisites
5. Include exact one-time setup instructions
6. Include exact local development commands
7. Include a step-by-step “How to try it” section covering:
   - health check
   - upload
   - ingest
   - index
   - create chat session
   - ask a question
   - fetch session history
8. Include sample curl commands for every core step
9. Include troubleshooting notes
10. Include current limitations
11. Mention that AI-assisted prompts used during development are documented in PROMPTS.md
12. Keep the README polished, detailed, practical, and reviewer-friendly
13. Do not invent a deployed link
14. Make local-only evaluation the primary path
15. Be accurate about PDF support: allowed, but md/txt are the recommended evaluation formats

Instructions:
- output the full README.md content only
- do not output commentary before or after
```

## Prompt 15

```text
# Prompt 15:
Format my PROMPTS.md into polished Markdown while preserving every prompt exactly word for word and letter for letter.

Important:
- Do not rewrite, shorten, summarize, or paraphrase any prompt text
- Preserve every prompt exactly as written
- Only improve formatting and organization
- Use a top-level title: # PROMPTS.md
- Put each prompt under a heading like: ## Prompt 1
- Wrap each prompt body in a fenced code block labeled text
- Keep the prompt order exactly the same
- Preserve spacing, punctuation, capitalization, and line breaks inside each prompt as much as possible
- Do not omit any prompts
- Do not add explanatory commentary outside the markdown content

Instructions:
- output the full PROMPTS.md content only
```
## Prompt 16

```text
Add a reviewer-friendly demo flow to cf_ai_docpilot without changing the core architecture.

Current goal:
Create a simple, reliable sample document and a one-command smoke test script so a new person can quickly verify the project works end to end.

Do the code changes now, not just the plan.

Requirements:
1. Add a new folder:
   - sample_docs/
2. Add one sample document:
   - sample_docs/demo_handbook.md
3. The sample document should be realistic, easy to query, and written in clear sections.
4. Include content that supports obvious test questions, such as:
   - what the document is about
   - onboarding steps
   - PTO policy
   - communication guidelines
   - deployment or tooling notes
5. Use Markdown, not PDF, as the official demo document for reliability.
6. Add a new script:
   - scripts/demo.sh
7. The demo script should:
   - check /api/health
   - upload sample_docs/demo_handbook.md
   - parse the returned document id
   - call ingest
   - call index
   - create a chat session scoped to that document
   - ask one or two sample questions
   - print the final assistant answer and citations in a readable way
8. Keep the script simple and portable bash
9. Do not add new app features or architecture changes
10. Do not modify the existing API contracts unless absolutely necessary
11. If needed, add a package.json script like:
   - "demo": "bash scripts/demo.sh"
12. Update README.md with a short "Quick demo" section that explains how to run the demo script after starting Ollama and the local Wrangler server

Constraints:
- no broad refactors
- no new dependencies unless absolutely necessary
- no UI work
- preserve current local-only evaluation flow
- keep everything production-leaning and reviewer-friendly

Acceptance criteria:
- the repo contains sample_docs/demo_handbook.md
- the repo contains scripts/demo.sh
- the demo script exercises the real upload → ingest → index → chat path
- the README includes a short quick-demo section
- a reviewer can follow the README and run the demo with minimal effort

Instructions:
- first give a very short summary of the files you are about to add or edit
- then make the code changes
- then list the exact commands I should run to test the demo locally
- then show me the exact expected usage, including:
  1. starting Ollama
  2. starting the local app
  3. running the demo script