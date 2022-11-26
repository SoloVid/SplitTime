export function rethrowError(cause: unknown, message: string): never {
  const causeError = cause instanceof Error ? cause : new Error(JSON.stringify(cause))
  const fullMessage = `${message}\n  Caused by: ${causeError.message}`
  throw new Error(fullMessage, { cause: causeError })
}
