export class AlreadyPrintedError extends Error {
  constructor(
    readonly cause: unknown,
  ) {
    super("This error was already printed...")
  }
}
