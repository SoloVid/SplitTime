import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter } from "./preact-help"
import { Drilled } from "./utils/immutable-helper"

export interface FieldOptions {
  readonly readonly?: boolean
  readonly title?: string
  readonly isFile?: boolean
  readonly fileBrowserRoot?: string
}

export interface ObjectProperties<T extends unknown, Path extends readonly (string | number)[]> {
  readonly title: string,
  readonly topLevelThing: Immutable<T>
  readonly pathToImportantThing: Path
  readonly fields: { readonly [K in keyof Drilled<T, Path>]: FieldOptions }
  readonly allowDelete: boolean
  readonly setTopLevelThing: ImmutableSetter<T>
  readonly onDelete: (thing: Drilled<T, Path>) => void
  readonly onUpdate: <K extends keyof Drilled<T, Path>>(field: K, newValue: Drilled<T, Path>[K], oldValue: Drilled<T, Path>[K]) => void
}

export type GenericObjectProperties = ObjectProperties<Record<string, unknown>, readonly (string | number)[]>
