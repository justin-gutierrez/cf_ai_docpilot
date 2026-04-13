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