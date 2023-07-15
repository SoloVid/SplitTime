import { Frame } from "engine/file/collage"
import { Rect } from "engine/math/rect"
import { Coordinates2D } from "engine/world/level/level-location"
import { useContext, useMemo } from "preact/hooks"
import { FileCollage } from "../file-types"
import { ImmutableSetter } from "../utils/preact-help"
import { CollageHelper } from "./collage-helper"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import { TrackFrameFunction } from "./track-frame"
import { UserInputsContext } from "../common/user-inputs"
import { CollageEditorControls } from "./collage-editor-shared"

type FrameRectangleProps = {
  collage: FileCollage
  controls: Pick<CollageEditorControls, "trackFrame">
  frame: Frame
  offset: Coordinates2D
  scale?: number
  setCollage: ImmutableSetter<FileCollage>
}

export default function FrameRectangle(props: FrameRectangleProps) {
  const {
    collage,
    controls,
    frame,
    offset,
    scale = 1,
    setCollage,
  } = props

  const userInputs = useContext(UserInputsContext)
  const [collagePrefs] = useContext(CollageEditorPreferencesContext)

  const frameS = {
    x: Math.round(frame.x * scale),
    y: Math.round(frame.y * scale),
    width: Math.round(frame.width * scale),
    height: Math.round(frame.height * scale),
  }

  const GRAB_BOX_WIDTH = 8
  const grabBox = useMemo(() => {
    return Rect.make(
      frameS.x + frameS.width / 2 - GRAB_BOX_WIDTH / 2,
      frameS.y + frameS.height / 2 - GRAB_BOX_WIDTH / 2,
      GRAB_BOX_WIDTH,
      GRAB_BOX_WIDTH
    )
  }, [frameS])

  const isSelected = collagePrefs.frameSelected === frame.id

  const traceFill = isSelected ? "rgba(255, 255, 0, 0.5)" : "none"
  const traceStroke = isSelected ? "red" : "black"
  const vertices = useMemo(() => {
    const left = frame.x
    const top = frame.y
    const right = left + frame.width
    const bottom = top + frame.height
    return [
      new Coordinates2D(left, top),
      new Coordinates2D(right, top),
      new Coordinates2D(left, bottom),
      new Coordinates2D(right, bottom)
    ]
  }, [frame])

  function track(point?: Coordinates2D): void {
    if (userInputs === null) {
      return
    }
    controls.trackFrame(userInputs, frame, point)
  }

  function addToMontage(): void {
    if (collagePrefs.montageSelected === null) {
      return
    }
    const montage = collage.montages.find((m) => m.id === collagePrefs.montageSelected)
    if (!montage) {
      return
    }
    const collageHelper = new CollageHelper(collage)
    const newMontageFrame = collageHelper.newMontageFrame(montage, frame)
    setCollage((before) => ({
      ...before,
      montages: before.montages.map((m) => {
        if (m.id !== collagePrefs.montageSelected) {
          return m
        }
        return {
          ...m,
          frames: [...m.frames, newMontageFrame],
        }
      }),
    }))
  }

  return <g>
    {/* Outline */}
    <rect
      x={frameS.x + offset.x}
      y={frameS.y + offset.y}
      width={frameS.width}
      height={frameS.height}
      stroke={traceStroke}
      stroke-width="2"
      fill={traceFill}
    />
    {/* Points around edge for dragging */}
    {isSelected && vertices.map((vertex) => (
      <circle
        onMouseDown={(e) => { if (e.button === 0) track(vertex) }}
        style="cursor: grab;"
        class="hoverable"
        fill="purple"
        cx={vertex.x * scale + offset.x}
        cy={vertex.y * scale + offset.y}
        r="4"
      />
    ))}
    {/* Box in middle for selecting/grabbing */}
    <rect
      style="cursor: grab;"
      x={grabBox.x + offset.x}
      y={grabBox.y + offset.y}
      width={grabBox.width}
      height={grabBox.height}
      stroke="red"
      stroke-width="2"
      fill="purple"
      onMouseDown={(e) => { if (e.button === 0) track() }}
      onDblClick={(e) => { if (e.button === 0) addToMontage() }}
    />
  </g>
}