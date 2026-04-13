/**
 * Deterministic key: documents/{documentId}/{safeFilename}
 * Same id + name always maps to the same object key.
 */
export function buildDocumentObjectKey(documentId: string, originalFilename: string): string {
  const safe = sanitizeFilename(originalFilename)
  return `documents/${documentId}/${safe}`
}

const MAX_NAME_LEN = 200

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, '')
  const stripped = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '')
  const limited = stripped.slice(0, MAX_NAME_LEN) || 'file'
  return limited
}

export async function putRawBytes(
  bucket: R2Bucket,
  key: string,
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<void> {
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: mimeType },
  })
}

export async function deleteRawObject(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key)
}

/** Full object body, or null if missing. */
export async function getRawObjectBytes(bucket: R2Bucket, key: string): Promise<ArrayBuffer | null> {
  const obj = await bucket.get(key)
  if (!obj) return null
  return obj.arrayBuffer()
}
