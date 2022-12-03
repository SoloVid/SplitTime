import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { EditorEntity, EditorLevel } from "./extended-level-format"

type ImmutableTransform<T> = (before: Immutable<T>) => Immutable<T>

export function makeEditorEntityFromFileObject<T extends EditorEntity>(
  setLevel: ImmutableSetter<EditorLevel>,
  e: T["obj"],
  type: T["type"],
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
        console.log("updating entity", metadataInitial.editorId)
        const objAfter = transform(entityBefore.obj as Immutable<T["obj"]>)
        return {
          ...entityBefore,
          obj: objAfter,
        }
      })
    }),
    metadata: metadataInitial,
    setMetadata: ((transform: ImmutableTransform<EditorMetadata>) => {
      updateEntity((entityBefore) => {
        console.log("updating metadata", metadataInitial.editorId)
        const metadataAfter = transform(entityBefore.metadata)
        return {
          ...entityBefore,
          metadata: metadataAfter,
        }
      })
    })
  }
  return entity as unknown as T
}
