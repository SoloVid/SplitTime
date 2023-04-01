import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter, TaggedImmutableSetter } from "../preact-help"
import { LevelEditorPreferences } from "../preferences"
import { EditorMetadata } from "../shared-types"
import { EditorEntity, EditorGroupEntity, EditorLevel, GraphicalEditorEntity } from "./extended-level-format"
import { FileGroup } from "../file-types"
import { generateUID } from "engine/utils/misc"

type ImmutableTransform<T> = (before: Immutable<T>) => Immutable<T>

export function makeEditorEntitySetMethods<T extends EditorEntity>(
  setLevel: TaggedImmutableSetter<EditorLevel>,
  metadata: T["metadata"],
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
    setMetadata: ((transform: ImmutableTransform<T["metadata"]>, tag?: string) => {
      updateEntity((entityBefore) => {
        const metadataAfter = transform(entityBefore.metadata as Immutable<T["metadata"]>)
        return {
          ...entityBefore,
          metadata: metadataAfter,
        }
      }, tag)
    })
  }
  return methods as unknown as Pick<T, "setObj" | "setMetadata">
}

export function makeEditorGroupEntityFromFileObject(
  setLevel: TaggedImmutableSetter<EditorLevel>,
  e: Immutable<FileGroup>,
  prefs?: LevelEditorPreferences,
): EditorGroupEntity {
  const metadataInitial = {
    editorId: generateUID(),
    collapsed: prefs ? prefs.collapsedGroups.includes(e.id) : true,
  }
  const setMethods = makeEditorEntitySetMethods(setLevel, metadataInitial, "group")
  const entity = {
    type: "group",
    keyInLevel: `groups`,
    obj: e,
    metadata: metadataInitial,
    ...setMethods,
  }
  return entity as unknown as EditorGroupEntity
}

type ExtraEntityMapperOptions = {
  index?: number
  prefs?: LevelEditorPreferences
}

export function makeEditorEntityFromFileObject<T extends GraphicalEditorEntity>(
  setLevel: TaggedImmutableSetter<EditorLevel>,
  e: T["obj"],
  type: T["type"],
  { index, prefs }: ExtraEntityMapperOptions = {},
): T {
  const metadataInitial = {
    ...new EditorMetadata(),
    displayed: (prefs && typeof index === "number") ? !prefs.hidden[`${type}s`].includes(index) : true,
  }
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
