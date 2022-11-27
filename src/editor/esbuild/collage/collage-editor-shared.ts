import { Coordinates2D } from "api"
import { Trace as FileTrace } from "api/file"
import { Collage, Frame, Montage, MontageFrame } from "engine/file/collage"
import { Collage as RealCollage, makeCollageFromFile } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { useState } from "preact/hooks"
import { ObjectProperties } from "../field-options"
import { GridSnapMover } from "../grid-snap-mover"
import { ImmutableSetter } from "../preact-help"
import { Followable, GlobalEditorShared } from "../shared-types"
import { BasePath } from "../utils/immutable-helper"
import { FrameWrapper } from "./frame-wrapper"
import { MontageFrameWrapper } from "./montage-frame-wrapper"
import { MontageWrapper } from "./montage-wrapper"
// import { getCollagePropertiesStuff, getFramePropertiesStuff, getMontageFramePropertiesStuff, getMontagePropertiesStuff } from "./properties-stuffs"
import { MIN_FRAME_LEN } from "./shared-types"

type MakeSharedStuffOptions = {
  readonly globalStuff: GlobalEditorShared,
  readonly collage: Immutable<Collage>,
  readonly setCollage: ImmutableSetter<Collage>
}

export function makeSharedStuff({ globalStuff, collage, setCollage }: MakeSharedStuffOptions) {
  const [info, setInfo] = useState<Record<string, string>>({})
  const [propertiesPath, setPropertiesPath] = useState<BasePath | null>([])
  const [traceInProgress, setTraceInProgress] = useState<FileTrace | null>(null)
  const [traceTypeSelected, setTraceTypeSelected] = useState("")
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null)
  const [selectedMontageIndex, setSelectedMontageIndex] = useState<number | null>(null)

  return {
    globalStuff, collage, setCollage,
    info, setInfo,
    setInfoField(field: string, value: string) {
      setInfo({...info, [field]: value})
    },
    propertiesPath, setPropertiesPath,
    traceInProgress, setTraceInProgress,
    traceTypeSelected, setTraceTypeSelected,
    selectedFrameIndex, //setSelectedFrameIndex,
    selectedMontageIndex, //setSelectedMontageIndex,

    get realCollage(): RealCollage {
      return makeCollageFromFile(collage, true)
    },

    get selectedFrame(): Frame | null {
      if (selectedFrameIndex) {
        return collage.frames[selectedFrameIndex]
      }
      return null
    },

    get selectedMontage(): Montage | null {
      if (selectedMontageIndex) {
        return collage.montages[selectedMontageIndex]
      }
      return null
    },

    follow(follower: Followable): void {
      globalStuff.setFollowers([follower])
    },
  
    selectMontage(montageIndex: number, andProperties: boolean = true): void {
      setTraceInProgress(null)
      setSelectedMontageIndex(montageIndex)
      if (andProperties) {
        setPropertiesPath(["montages", montageIndex])
      }
    },
  
    selectFrame(frameIndex: number, andProperties: boolean): void {
      setSelectedFrameIndex(frameIndex)
      if (andProperties) {
        setPropertiesPath(["frames", frameIndex])
      }
    },
  
    selectMontageFrame(montageIndex: number, montageFrameIndex: number, andProperties: boolean): void {
      const montageFrame = collage.montages[montageIndex].frames[montageFrameIndex]
      const frameId = montageFrame.frameId
      const frameIndex = collage.frames.findIndex(f => f.id === frameId)
      if (frameIndex < 0) {
        setSelectedFrameIndex(null)
      } else {
        setSelectedFrameIndex(frameIndex)
      }
      if (andProperties) {
        setPropertiesPath(["montages", montageIndex, "frames", montageFrameIndex])
      }
    },
  
    trackFrame(frameIndex: number, point?: Coordinates2D): void {
      setTraceInProgress(null)
      this.selectFrame(frameIndex, true)
      const frame = collage.frames[frameIndex]
      const left = frame.x
      const top = frame.y
      const width = frame.width
      const height = frame.height
      const x = point ? point.x : left
      const y = point ? point.y : top
      let originalPoints: Coordinates2D[]
      if (point) {
        originalPoints = [new Coordinates2D(x, y)]
      } else {
        originalPoints = [
          new Coordinates2D(x, y),
          new Coordinates2D(x + width, y),
          new Coordinates2D(x, y + height),
          new Coordinates2D(x + width, y + height)
        ]
      }
  
      // const MIN_FRAME_LEN = 4
      const snappedMover = new GridSnapMover(globalStuff.gridCell, originalPoints)
      const follower = {
        shift: (dx: number, dy: number) => {
          snappedMover.applyDelta(dx, dy)
          const snappedDelta = snappedMover.getSnappedDelta()
          setCollage((before) => {
            const newFrame = {...before.frames[frameIndex]}
            if (!point) {
              newFrame.x = x + snappedDelta.x
            } else if (x === left) {
              const newWidth = width - snappedDelta.x
              if (newWidth > MIN_FRAME_LEN) {
                newFrame.x = x + snappedDelta.x
                newFrame.width = newWidth
              }
            } else {
              const newWidth = width + snappedDelta.x
              if (newWidth > MIN_FRAME_LEN) {
                newFrame.width = newWidth
              }
            }
            if (!point) {
              newFrame.y = y + snappedDelta.y
            } else if (y === top) {
              const newHeight = height - snappedDelta.y
              if (newHeight > MIN_FRAME_LEN) {
                newFrame.y = y + snappedDelta.y
                newFrame.height = newHeight
              }
            } else {
              const newHeight = height + snappedDelta.y
              if (newHeight > MIN_FRAME_LEN) {
                newFrame.height = newHeight
              }
            }
            return {
              ...before,
              frames: [
                ...before.frames.slice(0, frameIndex),
                newFrame,
                ...before.frames.slice(frameIndex + 1),
              ]
            }
          })
        }
      }
      this.follow(follower)
    },
  } as const
}

export type SharedStuff = ReturnType<typeof makeSharedStuff>
export type SharedStuffViewOnly = Pick<SharedStuff,
  "collage" |
  "realCollage" |
  "selectedMontage" |
  "selectMontage"
> & { globalStuff: Pick<GlobalEditorShared, "server" | "time" | "userInputs">}
