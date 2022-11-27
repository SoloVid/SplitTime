import { Immutable } from "engine/utils/immutable"
import { useMemo } from "preact/hooks"
import { FileLevel } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { EditorEntity } from "./entity-body-manager"
import { LevelEditorState } from "./level-editor-state"

type ImmutableTransform<T> = (before: Immutable<T>) => Immutable<T>

export function useEntities(
  level: Immutable<FileLevel>,
  setLevel: ImmutableSetter<FileLevel>,
  levelEditorState: Immutable<LevelEditorState>,
  setLevelEditorState: ImmutableSetter<LevelEditorState>,
) {
  function hookUp<T extends EditorEntity>(
    e: T["obj"],
    i: number,
    type: T["type"],
    key: `${T["type"]}s`
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

  const mappedProps = useMemo(() => level.props.map((e, i) => hookUp(e, i, "prop", "props")), level.props)
  const mappedPositions = useMemo(() => level.positions.map((e, i) => hookUp(e, i, "position", "positions")), level.positions)
  const mappedTraces = useMemo(() => level.traces.map((e, i) => hookUp(e, i, "trace", "traces")), level.traces)

  return useMemo(() => {

    return [
      ...mappedProps,
      ...mappedPositions,
      ...mappedTraces,
    ]
  }, [mappedProps, mappedPositions, mappedTraces])
}
