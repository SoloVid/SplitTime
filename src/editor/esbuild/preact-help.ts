export type InputChangeEvent<T> = {
  target: {
    value: T
  } | null
}

export function makeClassNames(classMap: Record<string, boolean>) {
  return Object.entries(classMap)
    .filter(([name, shouldShow]) => shouldShow)
    .map(([name]) => name)
    .join(" ")
}
