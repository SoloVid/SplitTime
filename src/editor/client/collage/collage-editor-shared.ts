import { Coordinates2D } from "api"
import { Trace as FileTrace } from "api/file"
import { Collage, Frame, Montage } from "engine/file/collage"
import { Collage as RealCollage, makeCollageFromFile } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { TraceType } from "engine/world/level/trace/trace-type"
import { useContext, useMemo, useState } from "preact/hooks"
import { ServerLiaison } from "../common/server-liaison"
import { Followable, UserInputsContext } from "../common/user-inputs"
import { FileFrame } from "../file-types"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { convertZoomToScale } from "../preferences/scale"
import { GridSnapMover } from "../utils/grid-snap-mover"
import { BasePath } from "../utils/immutable-helper"
import { ImmutableSetter } from "../utils/preact-help"
import { MIN_FRAME_LEN } from "./shared-types"

type MakeSharedStuffOptions = {
  readonly server: ServerLiaison
  readonly collage: Immutable<Collage>
  readonly setCollageNull: ImmutableSetter<Collage | null>
}

export function makeSharedStuff({ server, collage, setCollageNull }: MakeSharedStuffOptions) {
  const userInputs = useContext(UserInputsContext)
  const [globalPrefs, setGlobalPrefs] = useContext(GlobalEditorPreferencesContext) 
  const [propertiesPath, setPropertiesPath] = useState<BasePath | null>([])
  const [traceInProgress, setTraceInProgress] = useState<FileTrace | null>(null)
  const [traceTypeSelected, setTraceTypeSelected] = useState<(typeof TraceType)[keyof typeof TraceType]>(TraceType.SOLID)
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null)
  const [selectedMontageIndex, setSelectedMontageIndex] = useState<number | null>(null)
  const realCollage = useMemo(() => makeCollageFromFile(collage, true), [collage])

  const scale = convertZoomToScale(globalPrefs.zoom)

  const setCollage: ImmutableSetter<Collage> = (transform => {
    setCollageNull(before => {
      if (before === null) {
        return null
      }
      return transform(before)
    })
  })

  return {
    scale, server, collage, setCollage,
    propertiesPath, setPropertiesPath,
    traceInProgress, setTraceInProgress,
    traceTypeSelected, setTraceTypeSelected,
    selectedFrameIndex, //setSelectedFrameIndex,
    selectedMontageIndex, //setSelectedMontageIndex,

    realCollage,
    // get realCollage(): RealCollage {
    //   return makeCollageFromFile(collage, true)
    // },

    get selectedFrame(): Frame | null {
      if (selectedFrameIndex !== null) {
        return collage.frames[selectedFrameIndex]
      }
      return null
    },

    get selectedMontage(): Montage | null {
      if (selectedMontageIndex !== null) {
        return collage.montages[selectedMontageIndex]
      }
      return null
    },

    follow(follower: Followable): void {
      if (userInputs !== null) {
        userInputs.setFollowers(() => [follower])
      }
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
  
    trackFrame(frameIndex: number, frame: Immutable<FileFrame>, point?: Coordinates2D): void {
      setTraceInProgress(null)
      this.selectFrame(frameIndex, true)
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
      const snappedMover = new GridSnapMover(globalPrefs.gridCell, originalPoints)
      const follower = {
        shift: (dx: number, dy: number) => {
          const dxScaled = dx / scale
          const dyScaled = dy / scale
          snappedMover.applyDelta(dxScaled, dyScaled)
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
  "selectMontage" |
  "server"
> & { scale: number }
