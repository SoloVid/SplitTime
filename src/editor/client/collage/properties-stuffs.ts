import { Collage, Frame, Montage, MontageFrame } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { tracePropertyFields } from "../common/trace-properties"
import { GenericObjectProperties, ObjectProperties } from "../field-options"
import { FileCollage } from "../file-types"
import { ImmutableSetter } from "../utils/preact-help"
import { CollageEditorPreferences } from "./collage-preferences"

const collageFieldObject = {
  image: {
    isFile: true,
  },
  defaultMontageId: {}
} as const
type SimplifiedCollage = { [K in keyof typeof collageFieldObject]: Collage[K] }

const frameFieldObject = {
  id: {
    readonly: true,
  },
  name: {},
  x: {},
  y: {},
  width: {},
  height: {}
} as const
type SimplifiedFrame = { [K in keyof typeof frameFieldObject]: Frame[K] }

const montageFieldObject = {
  id: {
    readonly: true,
  },
  name: {},
  direction: {},
  propPostProcessor: {},
  playerOcclusionFadeFactor: {}
}
export type SimplifiedMontage = { [K in keyof typeof montageFieldObject]: Montage[K] }

const montageFrameFieldObject = {
  id: {
    readonly: true,
  },
  frame: {},
  offsetX: {},
  offsetY: {},
  duration: {}
}
export type SimplifiedMontageFrame = { [K in keyof typeof montageFrameFieldObject]: MontageFrame[K] }

const bodySpecFieldObject = {
  width: {},
  depth: {},
  height: {}
}
type SimplifiedBodySpec = { [K in keyof typeof bodySpecFieldObject]: string | number }

export function getObjectProperties(collage: Immutable<Collage>, setCollage: ImmutableSetter<Collage>, prefsProperties: Exclude<CollageEditorPreferences["propertiesPanel"], null>, clearProperties: () => void): GenericObjectProperties | null {
  const baseProperties: Partial<GenericObjectProperties> = {
    topLevelThing: collage,
    // TODO: More type safety?
    setTopLevelThing: setCollage as any,
    onDelete: () => {
      clearProperties()
    },
    onUpdate: () => {
      // Do nothing by default.
    },
    allowDelete: true,
  }
  if (prefsProperties === "collage") {
    const properties: ObjectProperties<SimplifiedCollage, []> = {
      // TODO: More type safety?
      ...baseProperties as any,
      pathToImportantThing: [],
      title: "Collage Properties",
      fields: collageFieldObject,
      allowDelete: false,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (prefsProperties.type === "frame") {
    const index = collage.frames.findIndex(f => f.id === prefsProperties.id)
    if (index < 0) {
      return null
    }
    const path = ["frames", index] as const
    const properties: ObjectProperties<Collage, ["frames", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      pathToImportantThing: path,
      pathToDeleteThing: path,
      title: "Frame Properties",
      fields: frameFieldObject,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (prefsProperties.type === "montage") {
    const index = collage.montages.findIndex(m => m.id === prefsProperties.id)
    if (index < 0) {
      return null
    }
    const path = ["montages", index] as const
    const properties: ObjectProperties<Collage, ["montages", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      pathToImportantThing: path,
      pathToDeleteThing: path,
      title: "Montage Properties",
      fields: montageFieldObject,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (prefsProperties.type === "body") {
    const index = collage.montages.findIndex(m => m.id === prefsProperties.id)
    if (index < 0) {
      return null
    }
    const path = ["montages", index, "body"] as const
    const properties: ObjectProperties<Collage, ["montages", number, "body"]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      pathToImportantThing: path,
      title: "Body Spec Properties",
      fields: bodySpecFieldObject,
      allowDelete: false,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (prefsProperties.type === "montage-frame") {
    const [montageIndex, frameIndex] = getMontageChildIndex(collage, "frames", prefsProperties.id)
    if (frameIndex < 0) {
      return null
    }
    const path = ["montages", montageIndex, "frames", frameIndex]
    const properties: ObjectProperties<Collage, ["montages", number, "frames", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      pathToImportantThing: path,
      pathToDeleteThing: path,
      title: "Montage Frame Properties",
      fields: montageFrameFieldObject,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (prefsProperties.type === "trace") {
    const [montageIndex, traceIndex] = getMontageChildIndex(collage, "traces", prefsProperties.id)
    if (traceIndex < 0) {
      return null
    }
    const path = ["montages", montageIndex, "traces", traceIndex]
    const properties: ObjectProperties<Collage, ["montages", number, "traces", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      pathToImportantThing: path,
      pathToDeleteThing: path,
      title: "Trace Properties",
      fields: tracePropertyFields,
    }
    // TODO: More type safety?
    return properties as any
  }
  throw new Error(`Unexpected properties: ${JSON.stringify(prefsProperties)}`)
}

function getMontageChildIndex(collage: FileCollage, key: "frames" | "traces", id: string): [montageIndex: number, itemIndex: number] {
  let montageIndex = 0
  for (const m of collage.montages) {
    let itemIndex = 0
    for (const item of m[key]) {
      if (item.id === id) {
        return [montageIndex, itemIndex]
      }
      itemIndex++
    }
    montageIndex++
  }
  return [-1, -1]
}
