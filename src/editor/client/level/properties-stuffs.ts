import { Immutable } from "engine/utils/immutable"
import { assert } from "globals"
import { tracePropertyFields } from "../common/trace-properties"
import { GenericObjectProperties, ObjectProperties } from "../field-options"
import { OptionalTaggedImmutableSetter } from "../utils/preact-help"
import { EditorLevel } from "./extended-level-format"
import { LevelEditorPreferences } from "./level-preferences"
import { onPositionDelete, onPositionIdUpdate } from "./position-wrapper"

const levelFieldObject = {
  region: {},
  width: {},
  height: {},
  background: {
    isFile: true,
  },
  backgroundOffsetX: {},
  backgroundOffsetY: {}
}
type SimplifiedLevel = { [K in keyof typeof levelFieldObject]: string | number }

const groupFields = {
  id: {
    readonly: true
  },
  name: {},
  parent: {},
  defaultZ: {},
  defaultHeight: {}
}
type SimplifiedGroup = { [K in keyof Required<typeof groupFields>]: string | number }

const propFields = {
  id: {
    readonly: true
  },
  name: {},
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
  id: {
    readonly: true
  },
  name: {},
  group: {},
  collage: {},
  montage: {},
  x: {},
  y: {},
  z: {},
  dir: {}
}
type SimplifiedPosition = { [K in keyof Required<typeof positionFields>]: string | number }

export function getObjectProperties(level: Immutable<EditorLevel>, setLevel: OptionalTaggedImmutableSetter<EditorLevel>, prefsProperties: Exclude<LevelEditorPreferences["propertiesPanel"], null>, clearProperties: () => void): GenericObjectProperties | null {
  const baseOnDelete = () => {
    clearProperties()
  }
  const baseBaseProperties = {
    topLevelThing: level,
    // TODO: More type safety?
    setTopLevelThing: setLevel as any,
    onDelete: baseOnDelete,
    onUpdate: () => {
      // Do nothing by default.
    },
    allowDelete: true,
  } as const
  if (prefsProperties === "level") {
    const properties: ObjectProperties<SimplifiedLevel, []> = {
      // TODO: More type safety?
      ...baseBaseProperties as any,
      pathToImportantThing: [],
      title: "Level Properties",
      fields: levelFieldObject,
      allowDelete: false,
    }
    // TODO: More type safety?
    return properties as any
  }
  const keyInLevel = `${prefsProperties.type}s` as const
  const indexInArray = level[keyInLevel].findIndex(e => e.id === prefsProperties.id)
  if (indexInArray < 0) {
    return null
  }
  const path = [keyInLevel, indexInArray] as const
  const baseProperties = {
    ...baseBaseProperties,
    pathToImportantThing: path,
  } as const
  const testBasePropertiesType: Partial<GenericObjectProperties> = baseProperties
  void testBasePropertiesType
  if (path[0] === "groups") {
    assert(path.length == 2, `Unexpected path within groups: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<EditorLevel, ["groups", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Group Properties",
      fields: groupFields,
      pathToDeleteThing: [path[0], path[1]],
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "props") {
    assert(path.length == 2, `Unexpected path within props: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<EditorLevel, ["props", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Prop Properties",
      fields: propFields,
      pathToDeleteThing: [path[0], path[1]],
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "positions") {
    assert(path.length == 2, `Unexpected path within positions: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<EditorLevel, ["positions", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Position Properties",
      fields: positionFields,
      pathToDeleteThing: [path[0], path[1]],
      onDelete: (position) => {
        baseOnDelete()
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
    const properties: ObjectProperties<EditorLevel, ["traces", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Trace Properties",
      fields: tracePropertyFields,
      pathToDeleteThing: [path[0], path[1]],
    }
    // TODO: More type safety?
    return properties as any
  }
  throw new Error(`Unexpected properties path: ${JSON.stringify(path)}`)
}
