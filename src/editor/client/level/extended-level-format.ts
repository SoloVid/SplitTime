import { Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"
import { FileLevel } from "../file-types"

export type EditorLevel = FileLevel

export type EditorGroup = FileGroup
export type EditorPosition = FilePosition
export type EditorProp = FileProp
export type EditorTrace = FileTrace

export type ObjectMetadata = {
  mouseOver: boolean
}

export type ObjectMetadataMap = Record<string, ObjectMetadata | undefined>
