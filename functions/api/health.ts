export async function onRequestGet(): Promise<Response> {
  return Response.json({
    ok: true,
    service: 'cf_ai_docpilot',
    phase: 'ollama-local-v1',
  })
}
