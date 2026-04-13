export function jsonError(status: number, error: string, detail?: string): Response {
  return Response.json(detail !== undefined ? { error, detail } : { error }, { status })
}
