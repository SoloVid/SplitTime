import { int } from "api"
import { MadeJsonable } from "engine/file/json"
import { Immutable } from "engine/utils/immutable"
import { Group as FileGroup, Position as FilePosition, Prop as FileProp, Trace as FileTrace } from "engine/world/level/level-file-data"
import { useState } from "preact/hooks"
import { exportLevel } from "../editor-functions"
import { defaultFileGroup, defaultFilePosition, defaultFileProp, FileLevel } from "../file-types"
import { ImmutableSetter, OptionalTaggedImmutableSetter, TaggedImmutableSetter } from "../preact-help"
import { LevelEditorPreferences } from "../preferences"
import { EditorGroupMetadata, EditorMetadata } from "../shared-types"
import { makeDefaultTrace } from "../trace-properties"
import { useUndoStackState } from "../undo"
import { makeEditorEntityFromFileObject, makeEditorEntitySetMethods, makeEditorGroupEntityFromFileObject } from "./entity-mapper"

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
  addTrace: (init: Partial<FileTrace> & Pick<FileTrace, "type">) => EditorTraceEntity
  props: readonly EditorPropEntity[]
  addProp: (init: Partial<FileProp>) => EditorPropEntity
  positions: readonly EditorPositionEntity[]
  addPosition: (init: Partial<FilePosition>) => EditorPositionEntity
}

// type Dehydrated<T> = MadeJsonable<T>

// type Dehydrated<T> = {
//   // From https://stackoverflow.com/a/63990350/4639640
//   [K in keyof T as T[K] extends Function ? never : K]: T[K] extends (string | number)
//     ? T[K]
//     : T[K] extends ((...args: unknown[]) => unknown)
//       ? never
//       : Dehydrated<T[K]>
// }

// export type DehydratedEditorLevel = Dehydrated<EditorLevel>

export type DehydratedEditorLevel = Pick<
  EditorLevel, "region" | "width" | "height" | "background" | "backgroundOffsetX" | "backgroundOffsetY"
> & {
  groups: readonly DehydratedEditorGroupEntity[]
  traces: readonly DehydratedGraphicalEditorEntity<EditorTraceEntity>[]
  props: readonly DehydratedGraphicalEditorEntity<EditorPropEntity>[]
  positions: readonly DehydratedGraphicalEditorEntity<EditorPositionEntity>[]
}

type TemplateEditorEntity<Type extends string, ObjectType, EditorMetadataType = EditorMetadata> = {
  type: Type
  keyInLevel: `${Type}s`
  obj: Immutable<ObjectType>
  setObj: OptionalTaggedImmutableSetter<ObjectType>
  metadata: Immutable<EditorMetadataType>
  setMetadata: OptionalTaggedImmutableSetter<EditorMetadataType>
}

export type EditorGroupEntity = TemplateEditorEntity<"group", FileGroup, EditorGroupMetadata>
export type EditorPositionEntity = TemplateEditorEntity<"position", FilePosition>
export type EditorPropEntity = TemplateEditorEntity<"prop", FileProp>
export type EditorTraceEntity = TemplateEditorEntity<"trace", FileTrace>

export type EditorEntity = EditorGroupEntity | EditorPositionEntity | EditorPropEntity | EditorTraceEntity
/** Unlike {@link EditorEntity} these are displayed in the graphical editor. */
export type GraphicalEditorEntity = EditorPositionEntity | EditorPropEntity | EditorTraceEntity

type DehydratedEditorGroupEntity = {
  type: "group"
  obj: FileGroup
  metadata: {
    editorId: string
    collapsed: boolean
  }
}

function dehydrateGroup(group: EditorGroupEntity): DehydratedEditorGroupEntity {
  return {
    type: group.type,
    obj: group.obj,
    metadata: {
      editorId: group.metadata.editorId,
      collapsed: group.metadata.collapsed,
    },
  }
}

type DehydratedGraphicalEditorEntity<T extends GraphicalEditorEntity> = {
  type: T["type"]
  obj: T["obj"]
  metadata: {
    displayed: T["metadata"]["displayed"]
    editorId: T["metadata"]["editorId"]
  }
}

function dehydrateEntity<T extends GraphicalEditorEntity>(entity: T): DehydratedGraphicalEditorEntity<T> {
  return {
    type: entity.type,
    obj: entity.obj,
    metadata: {
      displayed: entity.metadata.displayed,
      editorId: entity.metadata.editorId,
    },
  }
}

export function useEditorLevel(fileLevel: FileLevel, setFileLevel: ImmutableSetter<FileLevel | null>, prefs: LevelEditorPreferences): [EditorLevel, OptionalTaggedImmutableSetter<EditorLevel>] {
  const setEditorLevel: TaggedImmutableSetter<EditorLevel> = (tag, transform) => {
    // console.log("take 2")
    setEditorLevelInternal(tag, (beforeEditor) => {
      // console.log("setting level")
      const afterEditor = transform(beforeEditor)
      setFileLevel((beforeFile) => exportLevel(afterEditor))
      return afterEditor
    })
  }

  function hydrateGroup(entity: DehydratedEditorGroupEntity): EditorGroupEntity {
    const metadata = {
      collapsed: entity.metadata.collapsed,
      editorId: entity.metadata.editorId,
    }
    return {
      type: entity.type,
      keyInLevel: `${entity.type}s`,
      obj: entity.obj,
      metadata: metadata,
      ...makeEditorEntitySetMethods(setEditorLevel, metadata, entity.type),
    } as unknown as EditorGroupEntity
  }

  function hydrateEntity<T extends GraphicalEditorEntity>(entity: DehydratedGraphicalEditorEntity<T>): T {
    const metadata: EditorMetadata = {
      displayed: entity.metadata.displayed,
      editorId: entity.metadata.editorId,
      highlighted: false,
    }
    return {
      type: entity.type,
      keyInLevel: `${entity.type}s`,
      obj: entity.obj,
      metadata: metadata,
      ...makeEditorEntitySetMethods(setEditorLevel, metadata, entity.type),
    } as unknown as T
  }
  
    function makeEditorLevelAddMethods(): Pick<EditorLevel, "addGroup" | "addTrace" | "addProp" | "addPosition"> {
    return {
      addGroup: (init) => {
        const newEntity = makeEditorGroupEntityFromFileObject(setEditorLevel, { ...defaultFileGroup, ...init })
        setEditorLevel(null, (before) => ({...before, groups: [...before.groups, newEntity]}))
        return newEntity
      },
      addTrace: (init) => {
        const newEntity = makeEditorEntityFromFileObject<EditorTraceEntity>(setEditorLevel, { ...makeDefaultTrace(init.type), ...init }, "trace")
        setEditorLevel(null, (before) => ({...before, traces: [...before.traces, newEntity]}))
        return newEntity
      },
      addProp: (init) => {
        const newEntity = makeEditorEntityFromFileObject<EditorPropEntity>(setEditorLevel, { ...defaultFileProp, ...init }, "prop")
        setEditorLevel(null, (before) => ({...before, props: [...before.props, newEntity]}))
        return newEntity
      },
      addPosition: (init) => {
        const newEntity = makeEditorEntityFromFileObject<EditorPositionEntity>(setEditorLevel, { ...defaultFilePosition, ...init }, "position")
        setEditorLevel(null, (before) => ({...before, positions: [...before.positions, newEntity]}))
        return newEntity
      },
    }
  }

  // const setEditorLevel: ImmutableSetter<EditorLevel> = (...args) => setEditorLevelInternal(...args)
  const [editorLevel, setEditorLevelInternal] = useUndoStackState<EditorLevel, DehydratedEditorLevel>(() => ({
    region: fileLevel.region,
    width: fileLevel.width,
    height: fileLevel.height,
    background: fileLevel.background,
    backgroundOffsetX: fileLevel.backgroundOffsetX,
    backgroundOffsetY: fileLevel.backgroundOffsetY,
    groups: fileLevel.groups.map((g, i) => makeEditorGroupEntityFromFileObject(setEditorLevel, g, prefs)),
    traces: fileLevel.traces.map((t, i) => makeEditorEntityFromFileObject(setEditorLevel, t, "trace", { prefs, index: i })),
    props: fileLevel.props.map((p, i) => makeEditorEntityFromFileObject(setEditorLevel, p, "prop", { prefs, index: i })),
    positions: fileLevel.positions.map((p, i) => makeEditorEntityFromFileObject(setEditorLevel, p, "position", { prefs, index: i })),
    ...makeEditorLevelAddMethods(),
  }), {
    dehydrate: (hydrated) => ({
      region: hydrated.region,
      width: hydrated.width,
      height: hydrated.height,
      background: hydrated.background,
      backgroundOffsetX: hydrated.backgroundOffsetX,
      backgroundOffsetY: hydrated.backgroundOffsetY,
      groups: hydrated.groups.map(dehydrateGroup),
      traces: hydrated.traces.map(dehydrateEntity),
      props: hydrated.props.map(dehydrateEntity),
      positions: hydrated.positions.map(dehydrateEntity),
    }),
    hydrate: (dehydrated) => ({
      region: dehydrated.region,
      width: dehydrated.width,
      height: dehydrated.height,
      background: dehydrated.background,
      backgroundOffsetX: dehydrated.backgroundOffsetX,
      backgroundOffsetY: dehydrated.backgroundOffsetY,
      groups: (dehydrated.groups as EditorGroupEntity[]).map<EditorGroupEntity>(hydrateGroup),
      traces: (dehydrated.traces as EditorTraceEntity[]).map<EditorTraceEntity>(hydrateEntity),
      props: (dehydrated.props as EditorPropEntity[]).map<EditorPropEntity>(hydrateEntity),
      positions: (dehydrated.positions as EditorPositionEntity[]).map<EditorPositionEntity>(hydrateEntity),
      ...makeEditorLevelAddMethods(),
    })
  })

  return [editorLevel, (transform, tag) => setEditorLevel(tag ?? null, transform)]
}
