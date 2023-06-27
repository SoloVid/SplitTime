import { Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"
import { FileLevel } from "../file-types"
import { Immutable } from "engine/utils/immutable"

export type EditorLevel = FileLevel

export type EditorGroup = FileGroup
export type EditorPosition = FilePosition
export type EditorProp = FileProp
export type EditorTrace = FileTrace

type WithType<TypeString extends string, T> = { t: TypeString, e: T }
export type EditorEntityWithType = WithType<"position", EditorPosition> | WithType<"prop", EditorProp> | WithType<"trace", EditorTrace>

export type ObjectMetadata = {
  mouseOver: boolean
}
export const blankObjectMetadata: Immutable<ObjectMetadata> = {
  mouseOver: false,
}

export type ObjectMetadataMap = Record<string, ObjectMetadata | undefined>
