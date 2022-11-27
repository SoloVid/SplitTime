import { IMAGE_DIR } from "engine/assets/assets"
import { BodySpec, Collage, Frame, Montage, MontageFrame } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { Trace as FileTrace, Trace } from "engine/world/level/level-file-data"
import { assert } from "globals"
import { GenericObjectProperties, ObjectProperties } from "../field-options"
import { ImmutableSetter } from "../preact-help"
import { getTracePropertiesFields, getTracePropertiesStuff as getTracePropertiesStuffShared } from "../trace-properties"
import { BasePath, getByPath } from "../utils/immutable-helper"
import { FrameWrapper, updateFrameId } from "./frame-wrapper"
import { MontageFrameWrapper } from "./montage-frame-wrapper"
import { MontageWrapper } from "./montage-wrapper"

const collageFieldObject = {
  image: {
    isFile: true,
    fileBrowserRoot: IMAGE_DIR
  },
  defaultMontageId: {}
} as const
type SimplifiedCollage = { [K in keyof typeof collageFieldObject]: Collage[K] }
// export function getCollagePropertiesStuff(collage: Immutable<Collage>, setCollage: ImmutableSetter<Collage>): ObjectProperties<SimplifiedCollage> {
//   return {
//     title: "Collage Properties",
//     thing: collage as SimplifiedCollage,
//     fields: collageFieldObject,
//     setField(field, value) {
//       setCollage((before) => ({...before, [field]: value}))
//     },
//     doDelete: null
//   }
// }

const frameFieldObject = {
  id: {},
  x: {},
  y: {},
  width: {},
  height: {}
} as const
type SimplifiedFrame = { [K in keyof typeof frameFieldObject]: Frame[K] }

// export function getFramePropertiesStuff(frameWrapper: FrameWrapper, doDelete: () => void): ObjectProperties<SimplifiedFrame> {
//   return {
//     title: "Frame Properties",
//     thing: frameWrapper.frame as SimplifiedFrame,
//     fields: frameFieldObject,
//     setField: (field, value) => {
//       (frameWrapper as Frame)[field] = value
//     },
//     doDelete
//   }
// }

const montageFieldObject = {
  id: {},
  direction: {},
  propPostProcessor: {},
  playerOcclusionFadeFactor: {}
}
export type SimplifiedMontage = { [K in keyof typeof montageFieldObject]: Montage[K] }
// export function getMontagePropertiesStuff(montageWrapper: MontageWrapper, doDelete: () => void): ObjectProperties<SimplifiedMontage> {
//   return {
//     title: "Montage Properties",
//     thing: montageWrapper as SimplifiedMontage,
//     fields: montageFieldObject,
//     setField: (field, value) => {
//       (montageWrapper as SimplifiedMontage)[field] = value
//     },
//     doDelete
//   }
// }

const montageFrameFieldObject = {
  frameId: {},
  offsetX: {},
  offsetY: {},
  duration: {}
}
export type SimplifiedMontageFrame = { [K in keyof typeof montageFrameFieldObject]: MontageFrame[K] }
// export function getMontageFramePropertiesStuff(montageFrameWrapper: MontageFrameWrapper, doDelete: () => void): ObjectProperties<SimplifiedMontageFrame> {
//   return {
//     title: "Montage Frame Properties",
//     thing: montageFrameWrapper as SimplifiedMontageFrame,
//     fields: montageFrameFieldObject,
//     setField: (field, value) => {
//       (montageFrameWrapper as SimplifiedMontageFrame)[field] = value
//     },
//     doDelete
//   }
// }

const bodySpecFieldObject = {
  width: {},
  depth: {},
  height: {}
}
type SimplifiedBodySpec = { [K in keyof typeof bodySpecFieldObject]: string | number }
// export function getBodySpecPropertiesStuff(body: Immutable<BodySpec>): ObjectProperties<SimplifiedBodySpec> {
//   const montage = 
//   return {
//     title: "Body Spec Properties",
//     thing: body as SimplifiedBodySpec,
//     fields: bodySpecFieldObject,
//     setField: (field, value) => {

//     },
//     doDelete: () => null
//   }
// }

// export function getTracePropertiesStuff(montage: Immutable<Montage>, trace: Immutable<FileTrace>): ObjectProperties {
//   return getTracePropertiesStuffShared(trace, () => {
//     montage.traces = montage.traces.filter(t => t !== trace)
//   })
// }

export function getObjectProperties(collage: Immutable<Collage>, setCollage: ImmutableSetter<Collage>, path: BasePath, clearProperties: () => void): GenericObjectProperties {
  const baseProperties: Partial<GenericObjectProperties> = {
    topLevelThing: collage,
    pathToImportantThing: path,
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
  if (path.length === 0) {
    const properties: ObjectProperties<SimplifiedCollage, []> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Collage Properties",
      fields: collageFieldObject,
      allowDelete: false,
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "frames") {
    assert(path.length == 2, `Unexpected path within frames: ${JSON.stringify(path)}`)
    const properties: ObjectProperties<Collage, ["frames", number]> = {
      // TODO: More type safety?
      ...baseProperties as any,
      title: "Frame Properties",
      fields: frameFieldObject,
      onUpdate: (key, newValue, oldValue) => {
        if (key === "id") {
          updateFrameId(setCollage, oldValue as string, newValue as string)
        }
      }
    }
    // TODO: More type safety?
    return properties as any
  }
  if (path[0] === "montages") {
    // assert(path.length >= 2, `Unexpected path within montages: ${JSON.stringify(path)}`)
    if (path.length === 2) {
      const properties: ObjectProperties<Collage, ["montages", number]> = {
        // TODO: More type safety?
        ...baseProperties as any,
        title: "Montage Properties",
        fields: montageFieldObject,
      }
      // TODO: More type safety?
      return properties as any
    }
    if (path[2] === "body") {
      assert(path.length === 3, `Unexpected body path: ${JSON.stringify(path)}`)
      const properties: ObjectProperties<Collage, ["montages", number, "body"]> = {
        // TODO: More type safety?
        ...baseProperties as any,
        title: "Body Spec Properties",
        fields: bodySpecFieldObject,
      }
      // TODO: More type safety?
      return properties as any
    }
    if (path[2] === "frames") {
      assert(path.length === 4, `Unexpected (montage) frames path: ${JSON.stringify(path)}`)
      const properties: ObjectProperties<Collage, ["montages", number, "frames", number]> = {
        // TODO: More type safety?
        ...baseProperties as any,
        title: "Montage Frame Properties",
        fields: montageFrameFieldObject,
      }
      // TODO: More type safety?
      return properties as any
    }
    if (path[2] === "traces") {
      assert(path.length === 4, `Unexpected (montage) traces path: ${JSON.stringify(path)}`)
      const initialTrace = getByPath(collage, path)
      const fieldObject = getTracePropertiesFields(initialTrace as Trace)
      const properties: ObjectProperties<Collage, ["montages", number, "traces", number]> = {
        // TODO: More type safety?
        ...baseProperties as any,
        title: "Trace Properties",
        fields: fieldObject,
      }
      // TODO: More type safety?
      return properties as any
    }
  }
  throw new Error(`Unexpected properties path: ${JSON.stringify(path)}`)
}
