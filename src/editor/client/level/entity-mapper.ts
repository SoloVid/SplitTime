import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter, TaggedImmutableSetter } from "../preact-help"
import { EditorMetadata } from "../shared-types"
import { EditorEntity, EditorLevel } from "./extended-level-format"

type ImmutableTransform<T> = (before: Immutable<T>) => Immutable<T>

export function makeEditorEntitySetMethods<T extends EditorEntity>(
  setLevel: TaggedImmutableSetter<EditorLevel>,
  metadata: EditorMetadata,
  type: T["type"],
): Pick<T, "setObj" | "setMetadata"> {
  const key: T["keyInLevel"] = `${type}s`
  function updateEntity(transform: ImmutableTransform<T>, tag?: string) {
    setLevel(`${metadata.editorId}:${tag ?? ""}`, before => {
      const collection = before[key] as Immutable<T[]>
      const entityBefore = collection.find(e => e.metadata.editorId === metadata.editorId)
      if (entityBefore === undefined) {
        return before
      }
      const entityAfter = transform(entityBefore)
      return {
        ...before,
        [key]: before[key].map((e2) => {
          if (e2.metadata.editorId !== metadata.editorId) {
            return e2
          }
          return entityAfter
        })
      }
    })
  }
  const methods = {
    setObj: ((transform: ImmutableTransform<T["obj"]>, tag?: string) => {
      updateEntity((entityBefore) => {
        const objAfter = transform(entityBefore.obj as Immutable<T["obj"]>)
        return {
          ...entityBefore,
          obj: objAfter,
        }
      }, tag)
    }),
    setMetadata: ((transform: ImmutableTransform<EditorMetadata>, tag?: string) => {
      updateEntity((entityBefore) => {
        const metadataAfter = transform(entityBefore.metadata)
        return {
          ...entityBefore,
          metadata: metadataAfter,
        }
      }, tag)
    })
  }
  return methods as unknown as Pick<T, "setObj" | "setMetadata">
}

export function makeEditorEntityFromFileObject<T extends EditorEntity>(
  setLevel: TaggedImmutableSetter<EditorLevel>,
  e: T["obj"],
  type: T["type"],
): T {
  const metadataInitial = new EditorMetadata()
  const setMethods = makeEditorEntitySetMethods(setLevel, metadataInitial, type)
  const entity = {
    type: type,
    keyInLevel: `${type}s`,
    obj: e,
    metadata: metadataInitial,
    ...setMethods,
  }
  return entity as unknown as T
}