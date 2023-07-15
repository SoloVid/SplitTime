import { Immutable } from "engine/utils/immutable"
import { Coordinates2D } from "engine/world/level/level-location"
import { UserInputs2 } from "../common/user-inputs"
import { FileCollage, FileFrame } from "../file-types"
import { GlobalEditorPreferences } from "../preferences/global-preferences"
import { convertZoomToScale } from "../preferences/scale"
import { GridSnapMover } from "../utils/grid-snap-mover"
import { ImmutableSetter } from "../utils/preact-help"
import { CollageEditorPreferencesPair } from "./collage-preferences"
import { MIN_FRAME_LEN } from "./shared-types"

export type TrackFrameOptions = {
  globalPrefs: GlobalEditorPreferences
  setCollage: ImmutableSetter<FileCollage>
  setCollagePrefs: CollageEditorPreferencesPair[1]
  setTraceIdInProgress: (id: string | null) => void
}

export type TrackFrameFunction = (followContext: Pick<UserInputs2, "setFollowers">, frame: Immutable<FileFrame>, point?: Coordinates2D) => void

export function makeTrackFrameFunction({
  globalPrefs,
  setCollage,
  setCollagePrefs,
  setTraceIdInProgress,
}: TrackFrameOptions): TrackFrameFunction {
  return (followContext, frame, point) => {
    setTraceIdInProgress(null)
    setCollagePrefs((before) => ({
      ...before,
      frameSelected: frame.id,
      propertiesPanel: {
        type: "frame",
        id: frame.id,
      },
    }))
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

    const scale = convertZoomToScale(globalPrefs.zoom)
    // const MIN_FRAME_LEN = 4
    const snappedMover = new GridSnapMover(globalPrefs.gridCell, originalPoints)
    const follower = {
      shift: (dx: number, dy: number) => {
        const dxScaled = dx / scale
        const dyScaled = dy / scale
        snappedMover.applyDelta(dxScaled, dyScaled)
        const snappedDelta = snappedMover.getSnappedDelta()
        setCollage((before) => {
          const newFrame = {...(before.frames.find(f => f.id === frame.id) ?? frame)}
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
            frames: before.frames.map(f => {
              if (f.id !== frame.id) {
                return f
              }
              return newFrame
            })
          }
        })
      }
    }
    followContext.setFollowers(() => [follower])
  }
}
