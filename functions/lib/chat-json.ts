export async function readJsonBody<T>(request: Request): Promise<T | null> {
  const ct = request.headers.get('content-type') ?? ''
  if (!ct.toLowerCase().includes('application/json')) {
    return null
  }
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export function parseCitationsField(raw: string | null): unknown {
  if (raw === null || raw === '') return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}
