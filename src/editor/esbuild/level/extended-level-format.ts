import { int } from "api"
import { Immutable } from "engine/utils/immutable"
import { Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"
import { useState } from "preact/hooks"
import { defaultFileGroup, defaultFilePosition, defaultFileProp, defaultFileTrace, FileLevel } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { makeEditorEntityFromFileObject } from "./entity-mapper"

export type EditorLevel = {
  region: string
  width: int
  height: int
  background: string
  backgroundOffsetX: int
  backgroundOffsetY: int
  groups: readonly EditorGroupEntity[]
  addGroup: (init: Partial<FileGroup>) => EditorGroupEntity
  traces: readonly EditorTraceEntity[]
  addTrace: (init: Partial<FileTrace>) => EditorTraceEntity
  props: readonly EditorPropEntity[]
  addProp: (init: Partial<FileProp>) => EditorPropEntity
  positions: readonly EditorPositionEntity[]
  addPosition: (init: Partial<FilePosition>) => EditorPositionEntity
}

type TemplateEditorEntity<Type extends string, ObjectType> = {
  type: Type
  keyInLevel: `${Type}s`
  obj: Immutable<ObjectType>
  setObj: ImmutableSetter<ObjectType>
  metadata: Immutable<EditorMetadata>
  setMetadata: ImmutableSetter<EditorMetadata>
}

export type EditorGroupEntity = TemplateEditorEntity<"group", FileGroup>
export type EditorPositionEntity = TemplateEditorEntity<"position", FilePosition>
export type EditorPropEntity = TemplateEditorEntity<"prop", FileProp>
export type EditorTraceEntity = TemplateEditorEntity<"trace", FileTrace>

export type EditorEntity = EditorGroupEntity | EditorPositionEntity | EditorPropEntity | EditorTraceEntity
/** Unlike {@link EditorEntity} these are displayed in the graphical editor. */
export type GraphicalEditorEntity = EditorPositionEntity | EditorPropEntity | EditorTraceEntity

export function useEditorLevel(fileLevel: FileLevel): [EditorLevel, ImmutableSetter<EditorLevel>] {
  const setEditorLevel1: ImmutableSetter<EditorLevel> = (...args) => setEditorLevel2(...args)
  const [editorLevel, setEditorLevel2] = useState<EditorLevel>(() => ({
    region: fileLevel.region,
    width: fileLevel.width,
    height: fileLevel.height,
    background: fileLevel.background,
    backgroundOffsetX: fileLevel.backgroundOffsetX,
    backgroundOffsetY: fileLevel.backgroundOffsetY,
    groups: fileLevel.groups.map(g => makeEditorEntityFromFileObject(setEditorLevel1, g, "group")),
    addGroup: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorGroupEntity>(setEditorLevel1, { ...defaultFileGroup, ...init }, "group")
      setEditorLevel1((before) => ({...before, groups: [...before.groups, newEntity]}))
      return newEntity
    },
    traces: fileLevel.traces.map(t => makeEditorEntityFromFileObject(setEditorLevel1, t, "trace")),
    addTrace: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorTraceEntity>(setEditorLevel1, { ...defaultFileTrace, ...init }, "trace")
      setEditorLevel1((before) => ({...before, traces: [...before.traces, newEntity]}))
      return newEntity
    },
    props: fileLevel.props.map(p => makeEditorEntityFromFileObject(setEditorLevel1, p, "prop")),
    addProp: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorPropEntity>(setEditorLevel1, { ...defaultFileProp, ...init }, "prop")
      setEditorLevel1((before) => ({...before, props: [...before.props, newEntity]}))
      return newEntity
    },
    positions: fileLevel.positions.map(p => makeEditorEntityFromFileObject(setEditorLevel1, p, "position")),
    addPosition: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorPositionEntity>(setEditorLevel1, { ...defaultFilePosition, ...init }, "position")
      setEditorLevel1((before) => ({...before, positions: [...before.positions, newEntity]}))
      return newEntity
    },
  }))

  return [editorLevel, setEditorLevel2]
}
