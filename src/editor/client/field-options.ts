import { Immutable } from "engine/utils/immutable"
import { OptionalTaggedImmutableSetter } from "./preact-help"
import { Drilled } from "./utils/immutable-helper"

export interface FieldOptions {
  readonly readonly?: boolean
  readonly title?: string
  readonly isFile?: boolean
  readonly fileBrowserRoot?: string
  readonly fileBrowserFilter?: RegExp
}

export interface ObjectProperties<T extends unknown, Path extends readonly (string | number)[]> {
  readonly title: string,
  readonly topLevelThing: Immutable<T>
  readonly pathToImportantThing: Path
  readonly pathToDeleteThing?: SubPath<Path> | undefined
  readonly fields: { readonly [K in keyof Drilled<T, Path>]: FieldOptions }
  readonly allowDelete: boolean
  readonly setTopLevelThing: OptionalTaggedImmutableSetter<T>
  readonly onDelete: (thing: Drilled<T, Path>) => void
  readonly onUpdate: <K extends keyof Drilled<T, Path>>(field: K, newValue: Drilled<T, Path>[K], oldValue: Drilled<T, Path>[K]) => void
}

export type GenericObjectProperties = ObjectProperties<Record<string, unknown>, readonly (string | number)[]>

type SubPath<T extends readonly unknown[]> = T extends [...(infer EarlyPathPart), (infer LastPathPart)]
  ? (T | SubPath<EarlyPathPart>)
  : []
