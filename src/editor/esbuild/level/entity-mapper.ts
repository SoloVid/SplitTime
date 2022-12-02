import { Immutable } from "engine/utils/immutable"
import { useEffect, useMemo, useState } from "preact/hooks"
import { FileLevel } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { useArrayMemo } from "../utils/use-array-memo"
import { EditorEntity, EditorGroupEntity, EditorLevel, EditorPositionEntity, EditorPropEntity, EditorTraceEntity, GraphicalEditorEntity } from "./extended-level-format"
import { LevelEditorState } from "./level-editor-state"

type ImmutableTransform<T> = (before: Immutable<T>) => Immutable<T>

type EditorEntityCollection = {
  readonly groups: readonly Immutable<EditorGroupEntity>[]
  readonly props: readonly Immutable<EditorPropEntity>[]
  readonly positions: readonly Immutable<EditorPositionEntity>[]
  readonly traces: readonly Immutable<EditorTraceEntity>[]
}

type State = {
  entityCollection: EditorEntityCollection
  level: Immutable<FileLevel>
  levelEditorState: Immutable<LevelEditorState>
}

export function useEntities(
  level: Immutable<FileLevel>,
  setLevel: ImmutableSetter<FileLevel>,
  levelEditorState: Immutable<LevelEditorState>,
  setLevelEditorState: ImmutableSetter<LevelEditorState>,
) {
  const deps = [level, setLevel, levelEditorState, setLevelEditorState]

  function hookUp<T extends EditorEntity>(
    e: T["obj"],
    i: number,
    type: T["type"],
    key: T["keyInLevel"]
  ): EditorEntity {
    const metadata = levelEditorState[key][i]
    const entity = {
      type: type,
      index: i,
      obj: e,
      setObj: ((transform: ImmutableTransform<T["obj"]>) => {
        setLevel(before => {
          const objBefore = before[key][i] as Immutable<T["obj"]>
          const objAfter = transform(objBefore)
          return {
            ...before,
            [key]: before[key].map((e2, i2) => {
              if (i2 !== i) {
                return e2
              }
              return objAfter
            })
          }
        })
      }),
      metadata,
      setMetadata: ((transform: ImmutableTransform<EditorMetadata>) => {
        setLevelEditorState(before => {
          const metadataBefore = before[key][i]
          const metadataAfter = transform(metadataBefore)
          return {
            ...before,
            [key]: before[key].map((e2, i2) => {
              if (i2 !== i) {
                return e2
              }
              return metadataAfter
            })
          }
        })
      })
    }
    return entity as unknown as EditorEntity
  }

  // const mappedGroups = useArrayMemo(
  //   level.groups,

  // )
  const mappedGroups = useMemo(() => level.groups.map((e, i) => hookUp<EditorGroupEntity>(e, i, "group", "groups")), [...deps, level.props])
  const mappedProps = useMemo(() => level.props.map((e, i) => hookUp<EditorPropEntity>(e, i, "prop", "props")), [...deps, level.props])
  const mappedPositions = useMemo(() => level.positions.map((e, i) => hookUp<EditorPositionEntity>(e, i, "position", "positions")), [...deps, level.positions])
  const mappedTraces = useMemo(() => level.traces.map((e, i) => hookUp<EditorTraceEntity>(e, i, "trace", "traces")), [...deps, level.traces])

  return useMemo(() => {

    return [
      ...mappedGroups,
      ...mappedProps,
      ...mappedPositions,
      ...mappedTraces,
    ]
  }, [...deps, mappedGroups, mappedProps, mappedPositions, mappedTraces])
}

export function makeEditorEntityFromFileObject<T extends EditorEntity>(
  setLevel: ImmutableSetter<EditorLevel>,
  e: T["obj"],
  type: T["type"],
  // key: T["keyInLevel"]
): T {
  const key: T["keyInLevel"] = `${type}s`
  const metadataInitial = new EditorMetadata()
  function updateEntity(transform: ImmutableTransform<T>) {
    setLevel(before => {
      const collection = before[key] as Immutable<T[]>
      const entityBefore = collection.find(e => e.metadata.editorId === metadataInitial.editorId)
      if (entityBefore === undefined) {
        return before
      }
      const entityAfter = transform(entityBefore)
      return {
        ...before,
        [key]: before[key].map((e2) => {
          if (e2.metadata.editorId !== metadataInitial.editorId) {
            return e2
          }
          return entityAfter
        })
      }
    })
  }
  const entity = {
    type: type,
    keyInLevel: `${type}s`,
    obj: e,
    setObj: ((transform: ImmutableTransform<T["obj"]>) => {
      updateEntity((entityBefore) => {
        const objAfter = transform(entityBefore.obj as Immutable<T["obj"]>)
        return {
          ...entityBefore,
          obj: objAfter,
        }
      })
      // setLevel(before => {
      //   const collection = before[key] as Immutable<T[]>
      //   const entityBefore = collection.find(e => e.metadata.editorId === metadataInitial.editorId)
      //   if (entityBefore === undefined) {
      //     return
      //   }
      //   const objBefore = entityBefore.obj as Immutable<T["obj"]>
      //   const objAfter = transform(objBefore)
      //   return {
      //     ...before,
      //     [key]: before[key].map((e2) => {
      //       if (e2.metadata.editorId !== metadataInitial.editorId) {
      //         return e2
      //       }
      //       return {
      //         ...e2,
      //         obj: objAfter,
      //       }
      //     })
      //   }
      // })
    }),
    metadata: metadataInitial,
    setMetadata: ((transform: ImmutableTransform<EditorMetadata>) => {
      updateEntity((entityBefore) => {
        const metadataAfter = transform(entityBefore.metadata)
        return {
          ...entityBefore,
          metadata: metadataAfter,
        }
      })
      // setLevel(before => {
      //   const metadataBefore = before[key][i].metadata
      //   const metadataAfter = transform(metadataBefore)
      //   return {
      //     ...before,
      //     [key]: before[key].map((e2) => {
      //       if (e2.metadata.editorId !== metadataInitial.editorId) {
      //         return e2
      //       }
      //       return {
      //         ...e2,
      //         metadata: metadataAfter,
      //       }
      //     })
      //   }
      // })
    })
  }
  return entity as unknown as T
}
