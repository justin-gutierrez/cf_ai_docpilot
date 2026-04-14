#!/usr/bin/env bash
set -euo pipefail

# Simple end-to-end demo script for cf_ai_docpilot.
# It exercises: health → upload → ingest → index → chat.

API_BASE="${API_BASE:-http://localhost:8788}"
DOC_PATH="${DOC_PATH:-sample_docs/demo_handbook.md}"

echo "=== cf_ai_docpilot demo ==="
echo "API base: $API_BASE"
echo "Document: $DOC_PATH"
echo

run_curl() {
  local label=$1
  shift
  echo "--- $label"
  # shellcheck disable=SC2068
  curl -sS "$@"
  echo
  echo
}

extract_json_field() {
  # Usage: echo "$JSON" | extract_json_field 'document.id'
  local path=$1
  node -e "
    const path = '$path'.split('.');
    let data = '';
    process.stdin.on('data', c => (data += c));
    process.stdin.on('end', () => {
      try {
        const obj = JSON.parse(data);
        let cur = obj;
        for (const key of path) {
          if (cur == null || !(key in cur)) {
            console.error('Missing field in JSON:', '$path');
            process.exit(1);
          }
          cur = cur[key];
        }
        process.stdout.write(String(cur));
      } catch (err) {
        console.error('Failed to parse JSON:', err?.message || err);
        process.exit(1);
      }
    });
  "
}

echo "Step 0: Health check"
run_curl "GET /api/health" "$API_BASE/api/health"

echo "Step 1: Upload demo document"
UPLOAD_RESP="$(
  curl -sS -X POST "$API_BASE/api/documents/upload" \
    -F "file=@${DOC_PATH};type=text/markdown" \
    -F "title=Demo Handbook"
)"
echo "$UPLOAD_RESP"
echo
DOC_ID="$(printf '%s' "$UPLOAD_RESP" | extract_json_field 'document.id')"
echo "Parsed document id: $DOC_ID"
echo

echo "Step 2: Ingest"
run_curl "POST /api/documents/$DOC_ID/ingest" \
  -X POST "$API_BASE/api/documents/$DOC_ID/ingest"

echo "Step 3: Index"
run_curl "POST /api/documents/$DOC_ID/index" \
  -X POST "$API_BASE/api/documents/$DOC_ID/index"

echo "Step 4: Create chat session scoped to document"
SESSION_RESP="$(
  curl -sS -X POST "$API_BASE/api/chat/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Demo Handbook Q&A\",\"documentId\":\"$DOC_ID\"}"
)"
echo "$SESSION_RESP"
echo
SESSION_ID="$(printf '%s' "$SESSION_RESP" | extract_json_field 'session.id')"
echo "Parsed session id: $SESSION_ID"
echo

ask_question() {
  local question=$1
  echo "Step 5: Ask question:"
  echo "Q: $question"
  echo
  RESP="$(
    curl -sS -X POST "$API_BASE/api/chat/sessions/$SESSION_ID/messages" \
      -H "Content-Type: application/json" \
      -d "{\"content\":\"$question\"}"
  )"
  echo "Raw response:"
  echo "$RESP"
  echo
  echo "Parsed answer and citations:"
  printf '%s' "$RESP" | node -e "
    let data = '';
    process.stdin.on('data', c => (data += c));
    process.stdin.on('end', () => {
      try {
        const obj = JSON.parse(data);
        const assistant = obj.assistant || obj.message || {};
        const content = assistant.content || '(no content)';
        const citations = assistant.citations || [];
        console.log('A:', content);
        console.log();
        console.log('Citations:');
        if (!Array.isArray(citations) || citations.length === 0) {
          console.log('  (none returned)');
          return;
        }
        for (const c of citations) {
          console.log(
            '- chunkId=' + (c.chunkId ?? 'n/a') +
            ' documentId=' + (c.documentId ?? 'n/a') +
            ' ordinal=' + (c.ordinal ?? 'n/a') +
            ' score=' + (c.score ?? 'n/a') +
            (c.title ? ' title=\"' + c.title + '\"' : '')
          );
        }
      } catch (err) {
        console.error('Failed to parse chat response JSON:', err?.message || err);
        process.exit(1);
      }
    });
  "
  echo
}

ask_question "What is this document about?"
ask_question "Summarize the PTO policy and onboarding steps."

echo "=== Demo complete ==="

