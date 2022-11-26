import { type Immutable } from "engine/utils/immutable"

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

export function makeStyleString(styleMap: Record<string, string>) {
  return Object.entries(styleMap)
    .map(([key, value]) => `${key}:${value}`)
    .join(";")
}

export type ImmutableSetter<T> = (transform: (before: Immutable<T>) => Immutable<T>) => void
