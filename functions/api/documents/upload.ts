import { getDocumentById, insertPendingDocument } from '../../lib/documents'
import { jsonError } from '../../lib/json-response'
import { buildDocumentObjectKey, deleteRawObject, putRawBytes } from '../../lib/r2-storage'
import { parseValidatedUpload } from '../../lib/upload-validation'

export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonError(405, 'method not allowed', 'use POST with multipart/form-data')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const contentType = context.request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return jsonError(400, 'invalid content type', 'expected multipart/form-data')
  }

  let form: FormData
  try {
    form = await context.request.formData()
  } catch {
    return jsonError(400, 'invalid multipart body')
  }

  const raw = form.get('file')
  if (raw === null || typeof raw === 'string') {
    return jsonError(400, 'missing file', 'expected multipart field "file"')
  }

  const validated = await parseValidatedUpload(raw)
  if ('status' in validated) {
    return jsonError(validated.status, validated.error, validated.detail)
  }

  const titleField = form.get('title')
  const title =
    typeof titleField === 'string' && titleField.trim() !== '' ? titleField.trim() : validated.filename

  const id = crypto.randomUUID()
  const r2Key = buildDocumentObjectKey(id, validated.filename)

  try {
    await putRawBytes(context.env.DOCS_BUCKET, r2Key, validated.bytes, validated.mimeType)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return jsonError(500, 'failed to store file', message)
  }

  try {
    await insertPendingDocument(context.env.DB, {
      id,
      title,
      r2Key,
      mimeType: validated.mimeType,
      byteSize: validated.byteSize,
    })
  } catch (err) {
    try {
      await deleteRawObject(context.env.DOCS_BUCKET, r2Key)
    } catch {
      /* best-effort cleanup */
    }
    const message = err instanceof Error ? err.message : 'unknown error'
    return jsonError(500, 'failed to save document metadata', message)
  }

  const document = await getDocumentById(context.env.DB, id)
  if (!document) {
    return jsonError(500, 'document created but could not be loaded')
  }

  return Response.json({ document }, { status: 201 })
}
