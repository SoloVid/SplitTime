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
}

export default function FrameRectangle(props: FrameRectangleProps) {
  const {
    collageEditorShared,
    frameIndex,
    frame,
    offset,
  } = props

  const collage = collageEditorShared.collage

  const GRAB_BOX_WIDTH = 8
  const grabBox = useMemo(() => {
    return Rect.make(
      frame.x + frame.width / 2 - GRAB_BOX_WIDTH / 2,
      frame.y + frame.height / 2 - GRAB_BOX_WIDTH / 2,
      GRAB_BOX_WIDTH,
      GRAB_BOX_WIDTH
    )
  }, [frame])

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

  const backgroundSrc = collageEditorShared.globalStuff.server.imgSrc(collage.image)

  function track(point?: Coordinates2D): void {
    collageEditorShared.trackFrame(frameIndex, point)
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
      x={frame.x + offset.x}
      y={frame.y + offset.y}
      width={frame.width}
      height={frame.height}
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
        cx={vertex.x + offset.x}
        cy={vertex.y + offset.y}
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