import { IMAGE_DIR } from "engine/assets/assets"
import { Immutable } from "engine/utils/immutable"
import { assert } from "globals"
import { GenericObjectProperties, ObjectProperties } from "../field-options"
import { FileLevel, FileTrace } from "../file-types"
import { ImmutableSetter } from "../preact-help"
import { getTracePropertiesFields } from "../trace-properties"
import { BasePath, getByPath } from "../utils/immutable-helper"
import { onGroupIdUpdate } from "./group-wrapper"
import { onPositionDelete, onPositionIdUpdate, PositionWrapper } from "./position-wrapper"

const levelFieldObject = {
  region: {},
  width: {},
  height: {},
  background: {
    isFile: true,
    fileBrowserRoot: IMAGE_DIR
  },
  backgroundOffsetX: {},
  backgroundOffsetY: {}
}
type SimplifiedLevel = { [K in keyof typeof levelFieldObject]: string | number }

const groupFields = {
  id: {},
  parent: {},
  defaultZ: {},
  defaultHeight: {}
}
type SimplifiedGroup = { [K in keyof Required<typeof groupFields>]: string | number }

const propFields = {
  id: {},
  group: {},
  collage: {},
  montage: {},
  x: {},
  y: {},
  z: {},
  dir: {}
}
type SimplifiedProp = { [K in keyof Required<typeof propFields>]: string | number }

const positionFields = {
  id: {},
  group: {},
  collage: {},
  montage: {},
  x: {},
  y: {},
  z: {},
  dir: {}
}
type SimplifiedPosition = { [K in keyof Required<typeof positionFields>]: string | number }

export function getObjectProperties(level: Immutable<FileLevel>, setLevel: ImmutableSetter<FileLevel>, path: BasePath, clearProperties: () => void): GenericObjectProperties {
  const baseProperties: Partial<GenericObjectProperties> = {
    topLevelThing: level,
    pathToImportantThing: path,
    // TODO: More type safety?
    setTopLevelThing: setLevel as any,
    onDelete: () => {
      clearProperties()
    },
    onUpdate: () => {
      // Do nothing by default.
    },
    allowDelete: true,
  }
  if (path.length === 0) {
    const properties: ObjectProperties<SimplifiedLevel, []> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Level Properties",
      fields: levelFieldObject,
      allowDelete: false,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "groups") {
    assert(path.length == 2, `Unexpected path within groups: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<FileLevel, ["groups", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Group Properties",
      fields: groupFields,
      onUpdate: (field, newValue, oldValue) => {
        if (field === "id") {
          onGroupIdUpdate(setLevel, oldValue as string, newValue as string)
        }
      },
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "props") {
    assert(path.length == 2, `Unexpected path within props: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<FileLevel, ["props", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Prop Properties",
      fields: propFields,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "positions") {
    assert(path.length == 2, `Unexpected path within positions: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<FileLevel, ["positions", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Position Properties",
      fields: positionFields,
      onDelete: (position) => {
        clearProperties()
        onPositionDelete(setLevel, position)
      },
      onUpdate: (field, newValue, oldValue) => {
        if (field === "id") {
          onPositionIdUpdate(setLevel, oldValue as string, newValue as string)
        }
      }
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "traces") {
    assert(path.length === 2, `Unexpected path within traces: ${JSON.stringify(path)}`)
    const initialTrace = getByPath(level, path)
    const fieldObject = getTracePropertiesFields(initialTrace as FileTrace)
    const properties: ObjectProperties<FileLevel, ["traces", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Trace Properties",
      fields: fieldObject,
    }
    // TODO: More type safety?
    return properties as any
  }
  throw new Error(`Unexpected properties path: ${JSON.stringify(path)}`)
}
