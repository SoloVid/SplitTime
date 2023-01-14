import { Frame } from "engine/file/collage"
import { Rect } from "engine/math/rect"
import { Coordinates2D } from "engine/world/level/level-location"
import { useMemo } from "preact/hooks"
import { SharedStuff } from "./collage-editor-shared"
import { CollageHelper } from "./collage-helper"

type FrameRectangleProps = {
  collageEditorShared: SharedStuff
  frameIndex: number
  frame: Frame
  offset: Coordinates2D
  scale?: number
}

export default function FrameRectangle(props: FrameRectangleProps) {
  const {
    collageEditorShared,
    frameIndex,
    frame,
    offset,
    scale = 1,
  } = props

  const collage = collageEditorShared.collage
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

  const isSelected = collageEditorShared.selectedFrame === frame

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
    collageEditorShared.trackFrame(frameIndex, frame, point)
  }

  function addToMontage(): void {
    const montageIndex = collageEditorShared.selectedMontageIndex
    if (montageIndex === null) {
      return
    }
    const collageHelper = new CollageHelper(collage)
    const newMontageFrame = collageHelper.newMontageFrame(collage.montages[montageIndex], frame)
    collageEditorShared.setCollage((before) => ({
      ...before,
      montages: before.montages.map((m, i) => {
        if (i !== montageIndex) {
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