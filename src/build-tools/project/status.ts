export const status = {
  building: "building",
  builtButTesting: "built-but-testing",
  builtWithErrors: "built-with-errors",
  succeeded: "succeeded",
  failed: "failed",
} as const

export type Status = (typeof status)[keyof typeof status]
