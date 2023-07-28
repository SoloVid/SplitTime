import { type Immutable } from "engine/utils/immutable"
import { assert } from "globals"
import { useEffect } from "preact/hooks"

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
    .join(";") + ";"
}

export type TaggedImmutableSetter<T> = (tag: string | null, transform: (before: Immutable<T>) => Immutable<T>) => void

export type ImmutableSetter<T> = (transform: (before: Immutable<T>) => Immutable<T>) => void
export type OptionalTaggedImmutableSetter<T> = (transform: (before: Immutable<T>) => Immutable<T>, tag?: string) => void
export type ImmutableUpdater<T> = (updates: Immutable<Partial<T>> | ((before: Immutable<T>) => Immutable<Partial<T>>)) => void

export function makeImmutableObjectSetterUpdater<T extends object>(setter: ImmutableSetter<T>): ImmutableUpdater<T> {
  return (updates) => setter((before) => {
    const updatesObject = typeof updates === "function" ?
      (updates as ((before: Immutable<T>) => Immutable<Partial<T>>))(before) :
      updates
    return {
      ...before,
      ...updatesObject as Partial<T>,
    }
  })
}

export function preventDefault(e: Event) {
  e.preventDefault()
}

export function onlyLeft(handler: (e: MouseEvent) => void, preventDefault: boolean = false) {
  return (e: MouseEvent) => {
    if (e.button === 0) {
      handler(e)
    }
    if (preventDefault) {
      e.preventDefault()
    }
  }
}

export function onlyRight(handler: (e: MouseEvent) => void, preventDefault: boolean = false) {
  return (e: MouseEvent) => {
    if (e.button === 2) {
      handler(e)
    }
    if (preventDefault) {
      e.preventDefault()
    }
  }
}

export function useLogValueChanged(debugLabel: string, value: unknown) {
  useEffect(() => {
    console.log(`${debugLabel} changed`)
  }, [value])
}
