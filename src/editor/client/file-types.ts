import { Collage as FileCollage, Frame as FileFrame, Montage as FileMontage } from "engine/file/collage"
import { FileData as FileLevel, Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"

export type {
  FileCollage,
  FileFrame,
  FileGroup,
  FileLevel,
  FileMontage,
  FilePosition,
  FileProp,
  FileTrace,
}

export const defaultFileGroup = {
  id: "",
  parent: "",
  defaultZ: 0,
  defaultHeight: 64,
} as const
const testFileGroup: FileGroup = defaultFileGroup

export const defaultFileProp = {
  id: "",
  group: "",
  collage: "",
  montage: "",
  x: 0,
  y: 0,
  z: 0,
  dir: "",
} as const
const testFileProp: FileProp = defaultFileProp

export const defaultFilePosition = {
  id: "",
  group: "",
  collage: "",
  montage: "",
  x: 0,
  y: 0,
  z: 0,
  dir: "",
} as const
const testFilePosition: FilePosition = defaultFilePosition
