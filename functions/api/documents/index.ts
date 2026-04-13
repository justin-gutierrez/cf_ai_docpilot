import { listDocuments } from '../../lib/documents'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const documents = await listDocuments(context.env.DB)
    return Response.json({ documents })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return Response.json({ error: 'failed to list documents', detail: message }, { status: 500 })
  }
}
