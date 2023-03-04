export function getErrorString(e: unknown): string {
  if (typeof e === "string") {
    return e
  }
  if (e instanceof Error) {
    return e.message
  }
  return JSON.stringify(e)
}
