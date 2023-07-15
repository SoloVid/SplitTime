import { Collage as FileCollage, Frame as FileFrame, Montage as FileMontage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { Group as FileGroup, FileData as FileLevel, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"

export type {
  FileCollage,
  FileFrame,
  FileGroup,
  FileLevel,
  FileMontage,
  FileMontageFrame,
  FilePosition,
  FileProp,
  FileTrace
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
