import stringify from "json-stringify-safe"

export function logArgsToHtmlString(args: readonly unknown[]): string {
  return args.map(a => unknownToString(a)).join(" ")
}

export function unknownToString(arg: unknown): string {
  if (typeof arg === "string") {
    return arg
  }
  if (arg instanceof Error) {
    return arg.message
  }
  return stringify(arg, null, 2)
}
