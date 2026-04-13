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