/** Max upload size (single file). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MiB

const PDF_MIMES = new Set(['application/pdf'])
const TXT_MIMES = new Set(['text/plain'])
const MD_MIMES = new Set(['text/markdown', 'text/plain', 'application/octet-stream'])

export type ValidatedUpload = {
  filename: string
  mimeType: string
  bytes: ArrayBuffer
  byteSize: number
}

export type ValidationFailure = { status: number; error: string; detail?: string }

function basename(name: string): string {
  const parts = name.split(/[/\\]/)
  return parts[parts.length - 1] ?? name
}

function fileExtension(filename: string): string {
  const base = basename(filename)
  const dot = base.lastIndexOf('.')
  if (dot < 0) return ''
  return base.slice(dot).toLowerCase()
}

function normalizeReportedMime(type: string): string {
  return type.split(';')[0]?.trim().toLowerCase() ?? ''
}

function resolveAllowedMime(ext: string, reported: string): string | null {
  if (ext === '.pdf') {
    if (reported && !PDF_MIMES.has(reported)) return null
    return 'application/pdf'
  }
  if (ext === '.txt') {
    if (reported && !TXT_MIMES.has(reported)) return null
    return 'text/plain'
  }
  if (ext === '.md' || ext === '.markdown') {
    if (reported && !MD_MIMES.has(reported)) return null
    return 'text/markdown'
  }
  return null
}

/**
 * Parse multipart file field "file": type/size checks, then full body read (bounded by MAX_UPLOAD_BYTES).
 */
export async function parseValidatedUpload(
  file: File | null,
): Promise<ValidatedUpload | ValidationFailure> {
  if (!file || !(file instanceof File)) {
    return { status: 400, error: 'missing file', detail: 'expected multipart field "file"' }
  }

  const filename = basename(file.name)
  if (!filename) {
    return { status: 400, error: 'invalid filename', detail: 'empty name' }
  }

  const ext = fileExtension(file.name)
  const reported = file.type ? normalizeReportedMime(file.type) : ''

  const mimeType = resolveAllowedMime(ext, reported)
  if (!mimeType) {
    return {
      status: 415,
      error: 'unsupported file type',
      detail: 'allowed: .pdf, .txt, .md, .markdown (and compatible Content-Type)',
    }
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      status: 413,
      error: 'file too large',
      detail: `max size is ${MAX_UPLOAD_BYTES} bytes`,
    }
  }

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return {
      status: 413,
      error: 'file too large',
      detail: `max size is ${MAX_UPLOAD_BYTES} bytes`,
    }
  }

  return {
    filename,
    mimeType,
    bytes,
    byteSize: bytes.byteLength,
  }
}
