import { Frame } from "engine/file/collage"
import { useContext, useMemo, useRef } from "preact/hooks"
import GridLines from "../grid-lines"
import { imageContext } from "../server-liaison"
import { getRelativeMouse } from "../shared-types"
import { SharedStuff } from "./collage-editor-shared"
import FrameRectangle from "./frame-rectangle"
import { EDITOR_PADDING, MIN_FRAME_LEN } from "./shared-types"

type CollageLayoutProps = {
  collageEditorShared: SharedStuff
}

export default function CollageLayout(props: CollageLayoutProps) {
  const {
    collageEditorShared
  } = props

  const collage = collageEditorShared.collage

  // TODO: real width
  const width = 500
  const containerWidth = width + 2*EDITOR_PADDING

  // TODO: real height
  const height = 500
  const containerHeight = height + 2*EDITOR_PADDING

  const framesSorted = useMemo(() => {
    const framesWithIndices = collage.frames.map((f, i) => ({ f, i }))
    framesWithIndices.sort((a, b) => {
      if (a.f === collageEditorShared.selectedFrame) {
        return 1
      }
      if (b.f === collageEditorShared.selectedFrame) {
        return -1
      }
      return 0
    })
    return framesWithIndices
  }, [collage.frames, collageEditorShared.selectedFrame])

  const viewBox = "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + containerWidth + " " + containerHeight

  const projectImages = useContext(imageContext)
  const backgroundSrc = projectImages.imgSrc(collage.image)

  const $el = useRef<HTMLDivElement>(document.createElement("div"))

  function startNewFrame(): void {
    const mouse = getRelativeMouse(collageEditorShared.globalStuff.userInputs, $el.current)
    let frameIndex = collage.frames.length
    let frameId = "Frame " + frameIndex
    while (collage.frames.some(f => f.id === frameId)) {
      frameIndex++
      frameId = "Frame " + frameIndex
    }
    const gridCell = collageEditorShared.globalStuff.gridCell
    const newFrame: Frame = {
      id: frameId,
      x: Math.round((mouse.x - EDITOR_PADDING) / gridCell.x) * gridCell.x,
      y: Math.round((mouse.y - EDITOR_PADDING) / gridCell.y) * gridCell.y,
      width: MIN_FRAME_LEN,
      height: MIN_FRAME_LEN
    }
    const newFrameIndex = collage.frames.length
    collageEditorShared.setCollage((before) => ({
      ...before,
      frames: [
        ...before.frames,
        newFrame,
      ]
    }))
    collageEditorShared.trackFrame(newFrameIndex, {x: newFrame.x + newFrame.width, y: newFrame.y + newFrame.height})
  }

  return <div
    ref={$el}
    style="position: relative; cursor: crosshair; display: inline-block;"
    class="transparency-checkerboard-background"
    onMouseDown={(e) => { if (e.button === 3) { startNewFrame(); e.preventDefault() }}}
    onContextMenu={(e) => e.preventDefault()}
  >
    <div style={`padding: ${EDITOR_PADDING}px`}>
      {!!backgroundSrc && <img
        src={backgroundSrc}
      />}
    </div>
    <svg
      style="position:absolute; left: 0; top: 0; width: 100%; height: 100%"
    >
      {framesSorted.map((frame) => (
        <FrameRectangle
          key={frame.f.id}
          collageEditorShared={collageEditorShared}
          frameIndex={frame.i}
          frame={frame.f}
          offset={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
        />
      ))}
    </svg>
    {collageEditorShared.globalStuff.gridEnabled && <GridLines
      gridCell={collageEditorShared.globalStuff.gridCell}
      origin={{x: EDITOR_PADDING, y: EDITOR_PADDING}}
    />}
  </div>
}