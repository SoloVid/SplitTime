import { int } from "api"
import { Immutable } from "engine/utils/immutable"
import { Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"
import { useState } from "preact/hooks"
import { exportLevel } from "../editor-functions"
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

export function useEditorLevel(fileLevel: FileLevel, setFileLevel: ImmutableSetter<FileLevel | null>): [EditorLevel, ImmutableSetter<EditorLevel>] {
  const setEditorLevel: ImmutableSetter<EditorLevel> = (transform) => {
    console.log("take 2")
    setEditorLevelInternal((beforeEditor) => {
      console.log("setting level")
      const afterEditor = transform(beforeEditor)
      setFileLevel((beforeFile) => exportLevel(afterEditor))
      return afterEditor
    })
  }
  // const setEditorLevel: ImmutableSetter<EditorLevel> = (...args) => setEditorLevelInternal(...args)
  const [editorLevel, setEditorLevelInternal] = useState<EditorLevel>(() => ({
    region: fileLevel.region,
    width: fileLevel.width,
    height: fileLevel.height,
    background: fileLevel.background,
    backgroundOffsetX: fileLevel.backgroundOffsetX,
    backgroundOffsetY: fileLevel.backgroundOffsetY,
    groups: fileLevel.groups.map(g => makeEditorEntityFromFileObject(setEditorLevel, g, "group")),
    addGroup: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorGroupEntity>(setEditorLevel, { ...defaultFileGroup, ...init }, "group")
      setEditorLevel((before) => ({...before, groups: [...before.groups, newEntity]}))
      return newEntity
    },
    traces: fileLevel.traces.map(t => makeEditorEntityFromFileObject(setEditorLevel, t, "trace")),
    addTrace: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorTraceEntity>(setEditorLevel, { ...defaultFileTrace, ...init }, "trace")
      setEditorLevel((before) => ({...before, traces: [...before.traces, newEntity]}))
      return newEntity
    },
    props: fileLevel.props.map(p => makeEditorEntityFromFileObject(setEditorLevel, p, "prop")),
    addProp: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorPropEntity>(setEditorLevel, { ...defaultFileProp, ...init }, "prop")
      setEditorLevel((before) => ({...before, props: [...before.props, newEntity]}))
      return newEntity
    },
    positions: fileLevel.positions.map(p => makeEditorEntityFromFileObject(setEditorLevel, p, "position")),
    addPosition: (init) => {
      const newEntity = makeEditorEntityFromFileObject<EditorPositionEntity>(setEditorLevel, { ...defaultFilePosition, ...init }, "position")
      setEditorLevel((before) => ({...before, positions: [...before.positions, newEntity]}))
      return newEntity
    },
  }))

  return [editorLevel, setEditorLevel]
}
